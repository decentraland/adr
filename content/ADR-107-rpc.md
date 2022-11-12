---
adr: 107
date: 2022-09-21
title: Decentraland RPC Streams
authors:
  - kuruk-mm
  - menduz
status: Draft
discussion: https://github.com/decentraland/adr/discussions/88
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-7
---

# Abstract

This document describes the changes for Decentraland RPC (@dcl/rpc) in the streams.

# Introduction

The current implementation of the RPC Streams works, confirming with an `ack=true` every message that is sent from the Server.
It's like the `Client` requesting the messages of the `Server`.

Current implementation sequence:

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: Request {message_id}
  S->>C: Response {message_id,streaming=true,seqId=0}
  C->>C: Generate async iterator for {message_id}
  C->>S: StreamMessage {ack=true,message_id,seqId=0}
  note over C: Ask for a new item to be generated using ack=true
  S-->>C: StreamMessage {message_id,payload,seqId=1}
  C->>S: StreamMessage {ack=true,message_id,seqId=1}
  note over C: Close the message by responding<br/>the last ACK with ack=true,closed=true
  S-->>C: StreamMessage {message_id,payload,seqId=2}
  C->>S: StreamMessage {ack=true,message_id,seqId=2,closed=true}
  S->>S: Close async Generator
  C->>C: Close async Iterator
  S-->>C: StreamMessage {message_id,closed=true}
  C->>C: Close async iterator
```

The main idea of this implementation is to forget about the possible congestion that the transport can have. And generate messages at the time that is being requested.

But with this implementation, we can't send a continuous sequence of messages from the `Server` to the `Client` or vice-versa. And the streams are very slow due to the waiting sequence.
This document will refer to this implementation as `the stream with ack` from now on.

# Proposal

Having this in mind, this proposal wants to change how streams work and have a use-case like `the stream with ack` but using bidirectional streams.

The main idea is to have:

- Server Streams
- Client Streams
- Bidirectional Streams

## (TODO) Server sends stream to client (with ACKs)

## Server sends stream to client (without ACKs)

The client makes a request, and the Server starts sending messages independently. The server receives a CloseStream message when the client decides to stop consuming the stream.

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: Request {message_id,payload}
  S->>C: StreamMessage {message_id,streaming=true,seqId=0}
  S-->>C: StreamMessage {message_id,payload,seqId=1}
  S-->>C: StreamMessage {message_id,payload,seqId=2}
  S-->>C: StreamMessage {message_id,payload,seqId=3}
  S-->>C: StreamMessage {message_id,payload,seqId=n}
  note over C: On closing stream
  C->>S: CloseStream {message_id}
  S->>C: CloseStreamAck {message_id}
```

Protobuf specification for Server Stream:

```protobuf
service SomeService {
  rpc ServerStream(Request) returns (stream StreamResponse)
}
```

## (TODO) Client sends stream, server sends unary response (with ACK)

## Client sends stream, server sends unary response (without ACK)

It is a stream generated in the client and consumed by the server. It works exactly like `Server Stream`, but the other way around.

Some considerations are needed for client streams:

- The client stream may never be consumed by the server. The stream only starts upon a signal from the server. (Review if this also happens without ACK)
- It may be possible that the client stream lifeclycle is longer than the execution of the server method. That is, the stream may run forever regardless of the method responding.

The client stream MAY continue producing messages until the server sends the CloseClientStream message back to the client.

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: Request {message_id,payload,streaming=true}

  alt Consume client stream
    S->>C: OpenClientStream {message_id,streaming=true,seqId=0}
    C-->>S: StreamMessage {message_id,payload,seqId=1}
    C-->>S: StreamMessage {message_id,payload,seqId=2}
    C-->>S: StreamMessage {message_id,payload,seqId=3}
    C-->>S: StreamMessage {message_id,payload,seqId=n}
    alt close from server
      note over S: stream.close()
      S-->>C: CloseClientStream {message_id}
    else finishes client side
      C-->>S: CloseClientStream {message_id}
      note over S: stream.close()
    end
  end
  S->>C: Response {message_id,streaming=true,seqId=0}
```

Protobuf specification for Client Stream:

```protobuf
service SomeService {
  rpc ClientStream (stream StreamRequest) returns (Response)
}
```

## Bidirectional stream

In the case of Bidirectional streams, the Client and the Server can send messages independently without but not limited to synchronization between streams.

Some considerations for bidirectional streams:

- Both streams MUST have decoupled generation/iteration cycles. But synchronizing messages is possible like in the follwing exaple
  ```ts
  async function* bidirectionalMethod(clientStream: AsyncIterator<Req>): AsyncGenerator<Res> {
    for await (const request of clientStream) {
      yield processRequest(request)
    }
  }
  ```
- The client stream MAY be closed by either party at any moment.
- The server stream MAY be closed by either party at any moment.

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: Request {message_id,payload}
  S->>C: StreamMessage {message_id,streaming=true,seqId=0}
  C-->>S: StreamMessage {message_id,payload,seqId=1}
  C-->>S: StreamMessage {message_id,payload,seqId=2}
  C-->>S: StreamMessage {message_id,payload,seqId=n}
  S-->>C: StreamMessage {message_id,payload,seqId=1}
  S-->>C: StreamMessage {message_id,payload,seqId=2}
  S-->>C: StreamMessage {message_id,payload,seqId=n}
  note over S: On closing stream
  S->>C: CloseStream {message_id}
  C->>S: CloseStreamAck {message_id}
```

Protobuf specification for Bidirectional Streams:

```
service {
  rpc ClientStream(stream StreamRequest) returns (stream StreamResponse)
}
```

### Bidirectional Stream (`the stream with ack`)

If the developer wants to have a behaviour like `the stream with ack`. It can just send a `StreamMessage` after you receive one of them. Like this sequence diagram describes:

```mermaid
sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: Request {message_id,payload}
  S->>C: Response {message_id,streaming=true,seqId=0}
  C-->>S: StreamMessage {message_id,payload,seqId=1}
  S-->>C: StreamMessage {message_id,ack=true,seqId=1}
  C-->>S: StreamMessage {message_id,payload,seqId=2}
  S-->>C: StreamMessage {message_id,ack=true,seqId=2}
  C-->>S: StreamMessage {message_id,payload,seqId=n}
  S-->>C: StreamMessage {message_id,ack=true,seqId=n}
  note over S: On closing stream
  S->>C: CloseStream {message_id}
  C->>S: CloseStreamAck {message_id}
```
