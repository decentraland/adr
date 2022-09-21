---
layout: doc
adr: 81
date: 2022-09-21
title: Minimim communications transport interface
status: PROPOSED
authors:
  - menduz
---

## Abstract

This document describes the minimum communications interface to be used with any Decentraland Client. The content of this ADR is based on the results of the implementation of RFC-4 and RFC-5. The communications interface has some characteristics:
- Connects with multiple peers, each peer is identified by their unique Ethereum address
- Peers can't have two connections to the same comms interface
- The interface must be able to send and receive messages from these peers
- Has to validate the addresses in order to trust them
- The actual implementation of the interface is swappable at runtime (changing realms, islands, rooms, private servers, etc).
- At minimum, the interface must ensure broadcast capabilities with all peers. 1-to-1 optimizations are possible but should be transparent to the interface.
- The `.send` can be hinted to be RELIABLE (must ensure all messages are delivered)

The actual proposed code interface has events and methods. Typescript will be used to illustrate the behavior. The `Emmiter` is assumed to be [mitt](https://www.npmjs.com/package/mitt)

```typescript
interface MinimumCommunicationsTransport {
  /**
   * The .send method is used to send information to all the peers
   * connected to this transport. The hints can be used to tweak the
   * default behavior of the transport.
   */
  send(data: Uint8Array, hints: SendHints): void
  /**
   * The .connect() method resolves when the connection with the
   * transport was successful and it is ready to send and receive
   * messages.
   */
  connect(): Promise<void>
  /**
   * The .disconnect() method can optionally receive an error that will
   * be bubbled up in the DISCONNECTED event. It should be used to
   * notify the user about possible network errors and to help with the
   * UX of the explorer.
   */
  disconnect(error?: Error): Promise<void>

  /**
   * Event emitter (mitt) with all the events produced by the transport.
   */
  events: Emmiter<{
    DISCONNECTION: TransportDisconnectedEvent
    PEER_DISCONNECTED: PeerDisconnectedEvent
    message: TransportMessageEvent
  }>
}

type SendHints = { reliable: boolean }

// DISCONNECTION
type TransportDisconnectedEvent = {
  // Whether or no the reason of disconnection was that we logged in on
  // a different session
  kicked: boolean
  // Optional error
  error?: Error
}

// PEER_DISCONNECTED
type TransportDisconnectedEvent = {
  // The ethereum address of the disconnected peer
  address: string
}

// message
type TransportMessageEvent = {
  // The ethereum address of the sender
  address: boolean
  data: Uint8Array
}
```

This interface was designed with extensibility in mind and abstracting all the necessary functions to make Decentraland work. The communications protocol that is transferred using this Transport is defined in the RFC-4.