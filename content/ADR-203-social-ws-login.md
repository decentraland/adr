
---
layout: adr
adr: 203
title: Authentication Mechanism for Friendship WebSocket Service
date: 2023-03-31
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - Julieta11
  - agusaldasoro
  - lauti7
  - guidota
  - 2fd
  - kuruk-mm
---

## Abstract

This document contains the analysis of different solutions for authenticating a client and managing the token required for accessing the FriendshipsService. Each solution will be evaluated based on its pros and cons, including aspects such as scalability, security, and complexity.

This is an exhaustive analysis of the Authentication section of [Social Service M2](/adr/ADR-189).

## Context, Reach & Prioritization

Authentication will be done using the same mechanism as Matrix, meaning that the client is responsible for obtaining a token that must be sent to the service, leveraging the work in [Social Service Authentication](/adr/ADR-143).

Once the token is received, the service queries Synapse to retrieve the corresponding `user_id` and handles all queries using that user's credentials. To prevent overloading Synapse, this information is cached in Redis.

The document exposes possible solutions for sending the token from the Client to the Server.

## Solution Space Exploration

### Solution 1.a: use a login message

To send the token, this solution proposes to expand the current `.proto` definition with a mandatory login message that must be sent as the first message when establishing a WebSocket connection. The client sends its token in this message, and the service validates it against Synapse to obtain the corresponding `user_id`. This `user_id` remains the same throughout the connection for all subsequent messages, taking advantage of the established WebSocket connection.

Example of proto file:

```proto
service FriendshipsService {
  rpc Login(Token) returns (google.protobuf.Empty) {}
  rpc GetFriends(google.protobuf.Empty) returns (stream Users) {}
}
```

#### Solution 1: Advantages

- Takes advantage of the existing state and connection (establishes a relation one to one from connection to user, anyway this have some drawbacks explained in the disadvantages section).
- Saves sending the token in the payload for each message (only a few bytes), avoiding the need to fetch it from Redis.
- If a new connection with the same token/user_id arrives, the previous connection can be closed. This is a simple way to avoid DoS.

#### Solution 1: Disadvantages

- The information is stored in memory, which may be a replication of what is in Redis.
- [dcl-rpc](https://github.com/decentraland/rpc-rust) needs to be expanded to allow connection identification and specific information storage. Currently, a global context is stored for the entire service, but a way to identify the client (there is no IP address or socket, only user_id) needs to be found. Additionally, `dcl-rpc` currently does not expose the connection because it is abstracted.
- Client-side logic is more complex, as it must ensure that the first message sent is the login message.
- As the service has a state, then it makes it more complex to scale horizontally, as a new login is required when reconnecting with another node, even using the same token.
- Websockets support automatic reconnection, in this case, if the server restarts and loses the memory state and reconnects to the user, then the login information will be lost.

### Solution 1.b: the login message is sent by the Server

This solution is analogue to 1.a but the message for the login is sent by the server, so the client must respond with the token. This way the logic for the client-side will be simpler. The rest of the analysis remains the same.

### Solution 2: include the token on each message

The second solution proposes that each message sent to the service includes the token as part of the payload. The client must send the token with each message, and the service validates it against Synapse to obtain the corresponding `user_id`.

Example of proto file:

```proto
service FriendshipsService {
  rpc GetFriends(Token) returns (stream Users) {}
}
```

#### Solution 2: Advantages

- Implementation is simpler, as there is no custom logic on the client side, and reconnections do not require handling.
- Stateless.
- More compatible if the service is migrated to HTTP.
- Supports automatic reconnection or node switching (via Load Balancer) without requiring a new login.

#### Solution 2: Disadvantages

- The token must be sent with each message, even when the connection is persistent. Anyway, the definition of the proto is a stream, so the message will be sent once and open to hear new updated.
- The message signature in the `.proto` file is modified to receive the token as a parameter, making messages incompatible with Solution 1 if migration is desired.
- If multiple tokens for different users arrive on the same connection or multiple connections for the same user exist, it becomes more difficult to handle DoS attacks (with the same token and different IP) since connections cannot be rejected if they are for the same user.
- Validation of token against Synapse or Redis is required for each received message.

### Solution 3: Hybrid Model

The third solution proposes using a login message to obtain the FriendshipToken, a JWT generated by the service that combines the `matrix_token` and `user_id`. Each message requires the FriendshipToken, which eliminates the need to query Redis.

If the client sends a message other than the login message, such as `GetFriends`, the service will respond with `Unauthorized`. If a connection is established and no login message is received within a certain time frame, the connection will be closed.

Example of proto file:

```proto
service FriendshipsService {
  rpc Login(SynapseToken) returns (FriendshipToken) {}
  rpc GetFriends(FriendshipToken) returns (stream Users) {}
}
```

#### Solution 3: Advantages

- Avoids querying Redis since the JWT is generated by the same server, and validation of the JWT is sufficient to obtain the `synapse_token` and `user_id`.
- Implementation is simpler, as there is no need for custom logic on the client side or token management, nor does it have to handle reconnections.
- Stateless.
- Compatible if we want to migrate it to HTTP.
- Supports automatic reconnection or node change (through Load Balancer for example) without forcing a reconnection.

#### Solution 3: Disadvantages

- The implementation is a bit more complex as an additional authentication system and the generation of a JWT by the server is required.
- If the user changes their token, the `FriendshipToken` must be regenerated. This can generate a bit more overhead on the server.
- If the user has multiple tokens (for example, on different devices), then they would have to manually close all connections.
- If the server crashes, all generated tokens are lost, and clients would have to generate new tokens again.

### Solution 4: Authenticate the Websocket Connection

To prioritize minimizing requests to Redis and Synapse while taking advantage of an open connection to send the token only once and not having to send it with each message, another possible solution is to authenticate the websocket connection when it is opened. This way, only one websocket connection with the server is allowed when authenticated, and if no token is sent or it is incorrect, the connection is closed.

To achieve this, the client that opens the connection must send the authentication token via a header:

- The client must make an HTTP request to the server with the authentication header to request an upgrade to a websocket connection.
- The server validates the token, and if it is correct, allows the connection to be upgraded to a websocket connection and keeps the connection open. If the token is incorrect, the connection is closed.
- With the connection open, the client can send messages as desired without having to send the token again.

The native browser client does not allow headers to be added when creating a websocket connection. Therefore, the proposed solution is to use cookies:

- The client obtains the token through the social service HTTP endpoint `/login`, where the response includes the header `Set-Cookie: friendships-Authorization=<Token>; Domain=social.decentraland.org`.
- Then, when the client initializes the websocket, since the cookie is configured, the header `Cookie: friendships-Authorization=<Token>` is sent, and the server validates the token and obtains the user_id for the entire connection.
Example of proto file:

```proto
service FriendshipsService {
  rpc GetFriends(google.protobuf.Empty) returns (stream Users) {}
}
```

#### Solution 4: Advantages

- Sends the request to Redis/Synapse only once
- Does not allow more than one connection per user (prevents simple DOS)
- No need to send the token as part of the message

#### Solution 4: Disadvantages

- The client must support cookies or be able to send the authorization header.

## Conclusion

To be determined, at present, option 4 has been selected due to its prioritization of several essential factors. Nevertheless, a technical assessment of its viability must be conducted before a decision is made.
