---
adr: 114
date: 2022-10-17
title: P2P adapter with routing service
status: Draft
authors:
  - hugoArregui
  - agusAldasoro
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-14
---

## Abstract

This document describes a possible implementation for a P2P adapter using a minimum spanning tree to calculate the optimal routes for broadcasting a packet to whole network. For more information about what an adapter is, check [ADR-81](/ADR/ADR-81-minimum-comms-transport.md).

## Need

A P2P adapter is needed in order to provide a light mechanism for comms. This alternative won't require extra infrastructure to work, which means it can be used in constraint environments as opposed to [RFC-5: comms service using websocket](/RFC/RFC-5-ws-comms.md). For example: P2P could be a default adapter for [comms v3](/ADR/ADR-70).


## Current implementation

The new implementation should solve the problems in [the old version](https://github.com/decentraland/lighthouse):

- When two peers are unable to see each other, it's hard to identify if there is a network failure or they are in different clusters, or a bug in the client.
- Since all peers broadcast information on an ever-changing logical mesh (every tick the relay changes), it's almost impossible to measure latency. The impact of the number of packages that are circulating around the network or even how many are been currently relayed isn't measurable. The relay suspension mechanism that prevents the network to be flooded with packages also prevents the stabilization of the mesh.
- As there isn't a way to measure the impact of the "suspension relay" heuristic, there's no guarantee on the efficiency of the available routes.
- There are two unhandled scenarios that may cause messages to not be delivered:
  - if there are two clusters (or more), peers will be completely isolated from each other, and no communication using the P2P mesh is possible.
  - At some point, relay suspension may suspend the only peer that is able to deliver a message. This is a temporal failure, since the next time the mesh is negotiated, the delivery will be resumed. 

## Approach

This approach focuses on addressing the problems mentioned above:
  1. Handle clusters: identifying peers outside of the current mesh, and providing a fallback service to deliver the messages. Optionally (outside of the scope of this RFC), this service could provide hints to the peers in order to connect separated clusters.
  2. Efficient usage of resources: messages are received only once, they are decoded only once and they are relayed using only the most efficient route, avoiding to flood the network. There is also no additional expiration TTL, hops TTL or relay suspension since the route is already determined.
  3. This solution aims to have a stable mesh, so it is possible to have a consistent latency between peers.

## The solution

This implementation requires an extra service:

- Messaging service: in charge of sending messages between specific peers, when the target is in another cluster.

This implementation also requires the usage of the Topic Service to send notifications to all peers about the changes in the mesh (every time a new conection is stablish or lost).

Note: *As defined in [ADR-81](/ADR/ADR-81-minimum-comms-transport.md), each peer will know the ids of the peers around them*

The basic idea of this implementation is for peers to connect randomly to a subset of the others forming a mesh, and reporting their connections to each other using the Topic service. Then, each node will build the routing information needed for each package to be broadcasted to all the other peers: this is the minimal set of paths that cover all the connected peers from their point of view. So, when a peer needs to deliver a message, it will use the paths provided by the routing service, and if the connection to a neighbor fails, then nothing will be done. This may imply that some packages are lost, anyway the paths generation for the next package should reflect this change in the mesh so no path is cut.

This implementation tries to maximize the usage of P2P connections, by ensuring that each peer recives the same package only once. Also, each peer needs to decode the package to parse it but they don't make changes to it, so there is no cost associated to the encoding of each package.

This approach is simple, it should be easy to debug and it could be refined in the future for performance, if needed. 

## Flow example

### 1. Peers establish random connections with their known peers

```mermaid
sequenceDiagram
    participant Peer1
    participant Peer2
    participant Peer3
    participant Peer4
    participant Peer5

    Peer1->>Peer2: Initiate P2P webrtc connection
    Peer2->>Peer1: Establish P2P webrtc connection

    Peer1->>Peer3: Initiate P2P webrtc connection
    Peer3->>Peer1: Establish P2P webrtc connection

    Peer1->>Peer4: Initiate P2P webrtc connection
    Peer4->>Peer1: Establish P2P webrtc connection

    Peer2->>Peer3: Initiate P2P webrtc connection
    Peer3->>Peer2: Establish P2P webrtc connection
```

```mermaid
  graph TD;
      Peer1---Peer2;
      Peer1---Peer3;
      Peer1---Peer4;
      Peer2---Peer3;
```


### 2. Each peer reports its connections to the topic service

```mermaid
sequenceDiagram
    participant Peer1
    participant Peer2
    participant Peer3
    participant Peer4
    participant Peer5
    participant TS as Topic Service

    Peer1->>TS: connected to peer2
    Peer1->>TS: connected to peer3
    Peer1->>TS: connected to peer4
    Peer2->>TS: connected to peer1
    Peer2->>TS: connected to peer3
    Peer3->>TS: connected to peer1
    Peer3->>TS: connected to peer2
    Peer4->>TS: connected to peer1
```

### 3. The topic service sends all new connections to all peers

Each new connection is a new message, but for clarity in the diagram they are collapsed in one line.
New connections includes a message for each of the following pairs: `[1, 2], [1, 3], [1, 4], [2, 3], [2, 1], [3, 1], [3, 2], [4, 1]`


```mermaid
sequenceDiagram
    participant Peer1
    participant Peer2
    participant Peer3
    participant Peer4
    participant Peer5
    participant RS as Routing Service

    RS->>Peer1: new connections
    RS->>Peer2: new connections
    RS->>Peer3: new connections
    RS->>Peer4: new connections
    RS->>Peer5: new connections
```

```mermaid
  graph TD;
      Peer1---Peer2;
      Peer1---Peer3;
      Peer1---Peer4;
      Peer2---Peer3;
```
Then each of the peers calculates all the paths needed to cover for broadcasting a package to all the other peers. 
It is a list of all the needed paths so that the whole network can be notified by the message. As every message is broadcast, each peer needs to know the smallest set of paths that covers all the nodes. It will also notify the unreachable nodes (by using the Message Service), so the peer can do the relay by the Messaging Service. To calculate all the unreachable nodes, each peer will make a diff of the complete list of known peers against all the other peers mentioned in all the paths.

Paths for Peer1
```mermaid
  graph TD;
      Peer1-->Peer2;
      Peer1-->Peer3;
      Peer1-->Peer4;
```
Paths for Peer2
```mermaid
  graph TD;
      Peer2-->Peer1;
      Peer1-->Peer4;
      Peer2-->Peer3;
```
Paths for Peer3
```mermaid
  graph TD;
      Peer3-->Peer1;
      Peer1-->Peer4;
      Peer3-->Peer2;
```
Paths for Peer4
```mermaid
  graph TD;
      Peer4-->Peer1;
      Peer1-->Peer2;
      Peer2-->Peer3;
```
Empty Paths for Peer5

### Peer2 sends a message

First the peer2 creates and encodes a package that contains its own paths, so all the peers obey that rule.

Paths for Peer2
```mermaid
  graph TD;
      Peer2-->Peer1;
      Peer1-->Peer4;
      Peer2-->Peer3;
```

```
{
  source: 2
  payload,
  targets: [[2, 1, 4], [2, 3]]
}
```

When each peer receives a package, it checks if it is contained in any of the paths and continues the relay with the given order.

```mermaid
sequenceDiagram
    participant Peer1
    participant Peer2
    participant Peer3
    participant Peer4
    participant Peer5
    participant MS as Messaging Service

    Peer2->>Peer1: peer2 sends message directly to peer1
    Peer2->>Peer3: peer2 sends message directly to peer3
    Peer2->>MS: peer2 sends message trough Messaging Service to peer5

    Peer1->>Peer4: peer1 sends message directly to peer4
```

## Example: A connection is lost while relaying a package

Let's assume peer4 needs to distribute a package, but loses the connection to peer1 while trying to send the package. Then, nothing will be done.


Paths for Peer4
```mermaid
  graph TD;
      Peer4-->Peer1;
      Peer1-->Peer2;
      Peer2-->Peer3;
```

```
{
  source: 4
  payload,
  targets: [[4, 1, 2, 3]]
}
```


```mermaid
sequenceDiagram
    participant Peer1
    participant Peer2
    participant Peer3
    participant Peer4
    participant Peer5

    Peer4->>Peer1: send message
    Note over Peer1: peer1 is disconnected
    Peer4->>RS: update status: lost connection to peer1
```
That package will not be broadcasted to all other peers, if it's a hearbeat then the next one will have different routes that should work.

## Definitions

```typescript

type Address = string

// A route is a list of peer ids.
type Route = Address[]

// A list of all the paths that need to be covered to broadcast the network
type PeerRoutingTable = Route[]
```

## Messaging service

To establish a P2P webrtc connection, peers will exchange signals with each other using the messaging service. This service will act as a fallback when no P2P route is available to deliver a message due to the existence of clusters.

This service has same level of trust than any peer in the network, this means it has no specific authentication requirements, and any trust feature has to be built in the message itself.

## Routing service

This service will receive peer status updates including the connections to other peers, and will return the routing table which specifies the routes to every other peer in the mesh.

## Interfaces

```typescript
interface MessagingService {
  /**
   * The .send method is used to send the message `message` to the peers provided in the `to` field.
   */
    send(message: Uint8Array, to: Address[]): void
}

type PeerStatus = {
    timestamp: number,
    room: string,
    connectedTo: Address[]
}

interface RoutingService {

  /**
   * The .updatePeerStatus method is used to update the peer status in the service.
   */
   updatePeerStatus(status: PeerStatus): void

  /**
   * Event emitter (mitt) with all the events produced by the service.
   */
  events: Emmiter<{
    newPeerRoutingTable: NewPeerRoutingTableEvent
  }>
}

// NewPeerRoutingTableEvent
type NewPeerRoutingTableEvent = {
  // the new peer routing table
  routingTable: PeerRoutingTable
}
```

## Packet

A packet contains a source (peer id) and a target specifying to whom the packet is for and the route to follow to reach it.

```typescript

type Packet = {
  source: Address
  target: Route[]
}

## Peer

Each time a package needs to be sent, then the peer will create it using its own paths as routing table and will make the network to obey that flow.

```typescript
{ 
  source: 'peer1', 
  target: [ ['peer2', 'peer3'] ]
}
```

This means each peer will check the `target` field, always the message will be processed, and then it will be relayed in the way the route value indicates.

Notice the peer relaying the message is not expected to remove itself either as a recipient or as a hop in the route, since this will require encoding the package again. 

# Benefits

- Since there is a specific routing table for each message, there is no need to expire message or count hops. If a route is cut, the message will not be delivered by the mesh, this means the message should be relayed using the messaging service (if reliable) or discarded (if unreliable).
- The messaging service fallback provide a safety guarantee against network cluster partitions.
- A given implementation can be optimized by suggesting peers to connect to certain others in order to avoid clustering and minimize messaging service usage. This is out of the scope for this document.
- Since the routing service will know the status of the mesh at all times, it's easy to graph and debug network problems. 

# Risks

- Potentially the messages may be too big, if they include all the routes. Mitigation: if bandwidth becomes a problem, it is possible to encode the message again by removing the current peer from the routing paths, this way the message is small but the process will consume more CPU instead. 
- Routing service cost to keep the routes updated. Mitigation: based on metrics we can adjust the parameters: frequency of the routes calculation, the routing algorithm, and how the graph is stored in memory. 

# Competition (alternatives)

- One simple solution using a P2P mesh, in which peers broadcast to others, and upon receiving a message, they relay to their connections. The problem with this solution is there is the possibility of messages going through the network after the same message is delivered, which implies the need to build a mechanism to discard old messages (using time or hops). Another problem is the possibility of clusters in the mesh, which may cause certain group of peers to not see the ones in another group (partitioned).
- Keep the current implementation with the problems described in the "Need" section.

# Non-goals

- The route representation is not as efficient as it could be, since it uses `Address` (string) as a peer identification. This should be possible to improve, by assigning a numeric alias to every peer. However, detailing how to do that is out of the scope of this document, and doesn't change the overall proposed solution.

# Key dependencies and Open questions

- Why not let each peer calculate the best routing table, by broadcasting each peer status to the network?
  - This solution will consume a lot of resources from each client, since the table needs to be updated (or verified) every time there is a change.
  - This solution is somehow more difficult to debug, since routing tables have no source of truth, and different peers may build them differently. 
- Can we replace the messaging service by providing alternatives routes for broadcasting a message?
  - This won't solve the cluster partitions problem.
  - By looking at the metrics of the messaging service usage, it is possible to conclude that the service is not solving a frequent enough problem, and then it can be removed or replaced.
