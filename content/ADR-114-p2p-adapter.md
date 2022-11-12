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

This document describes a possible implementation for a P2P adapter using a fallback messaging service. For more information about what an adapter is, check [ADR-81](/ADR/ADR-81-minimum-comms-transport.md).

## Need

A P2P adapter is needed in order to provide a light mechanism for comms (compared to [RFC-5: comms service using websocket](/RFC/RFC-5-ws-comms.md)). This adapter should guarantee the delivery of a message to any peer in the network (or cluster, [real-time clustering of users in Islands (ADR-35)](/adr/ADR-35)).

In this approach a Routing Table is used, which is managed by the Routing Service. The idea is to limit the amount of times that any peer receives a packet to 1, currently with naive broadcasting p2p solution each node relays a package only once but it can receive as many times as peer conections has.

## Approach

This approach is simple, it should be easy to debug and it could be refined in the future for performance if needed.

This implementation requires two extra services:

- Messaging service: in charge of sending messages between specific peers.
- Routing service: in charge of keeping track of the connections between peers and providing them routing information.

As defined in [ADR-81](/ADR/ADR-81-minimum-comms-transport.md), each peer will know the ids of the peers around them using the information provided by the `CommunicationsDirector`.

The basic idea of this implementation is for peers to connect randomly to a subset of the others forming a mesh, and reporting their connections to the routing service. The routing service will build routing tables for each peer to connect to every other. Each peer will receive from the routing service the path to all other connected peers, this means all the paths that the peer needs to send the package to so all the mesh is notified. When a peer needs to deliver a message, it will use the paths provided by the routing table, and if the conection to the neighbour fails, it will fallback to the messaging service for all the pending peers.

Although this implementation requires a server, it tries to maximize the usage of P2P connections, while also keeping in mind that peers may run in a constrained environment (like a browser) in which it is not always possible to have a lot of open connections.
If broadcasting every message, then you can receive the same packet many times even if you are not distributing it anymore. This creates a congestion of the network, in this solution it is guaranteed that every packet will be processed only once per peer.
Also, each peer needs to decode the package to parse it but they don't make changes to it, so there is no cost associated to the enconding of each package.

## Flow example

### 1. Peers establish random connections with their known peers.

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

### 2. Each peer reports its connections to the routing service

```mermaid
sequenceDiagram
    participant Peer1
    participant Peer2
    participant Peer3
    participant Peer4
    participant Peer5
    participant RS as Routing Service

    Peer1->>RS: connected to [peer2, peer3, peer4]
    Peer2->>RS: connected to [peer1, peer3]
    Peer3->>RS: connected to [peer1, peer2]
    Peer4->>RS: connected to [peer1]
    Peer5->>RS: connected to []
```

### 3. The routing service creates a routing table for each peer

It is a list of all the needed paths so all the network can be notified by the message. As every message is a broadcast, each peer needs to know the smallest set of paths that covers all the nodes. It will also notify the unreachable nodes, so the peer can do the relay by the Messaging Service. To calculate all the unreachable nodes, each peer will make a diff of the complete list of kwnon hosts against to all the nodes mentioned in all the paths.

```mermaid
sequenceDiagram
    participant Peer1
    participant Peer2
    participant Peer3
    participant Peer4
    participant Peer5
    participant RS as Routing Service

    RS->>Peer1: { paths: [ [1, 2], [1, 3], [1, 4] ] }
    RS->>Peer2: { paths: [ [2, 1, 4], [2, 3] } }
    RS->>Peer3: { paths: [ [3, 1, 4], [3, 2] } }
    RS->>Peer4: { paths: [ [4, 1, 2, 3] } }
    RS->>Peer5: { paths: [] }
```

```mermaid
  graph TD;
      Peer1---Peer2;
      Peer1---Peer3;
      Peer1---Peer4;
      Peer2---Peer3;
```

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

First the peer2 creates and encodes a package that contains its own paths, so all the peers obay that rule.

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
    Peer2->>MS: peer2 sends message trough messaging service to peer5

    Peer1->>Peer4: peer1 sends message directly to peer4
```

## Example: A connection is lost while relaying a package

Let's assume peer4 needs to distribute a package, but loses the conection to peer1 while trying to send the package. Then it will relay the message to all the missing nodes trough the Messaging Service.
Note: A message received by the Messaging Service is never relayed.

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
    participant MS as Messaging Service
    participant RS as Routing Service

    Peer4->>Peer1: send message
    Note over Peer1: peer1 is disconnected
    Peer4->>RS: update status: lost connection to peer1

    Peer4->>MS: relay this message to peer1
    MS->>Peer1: relay this message to peer1
    Peer4->>MS: relay this message to peer2
    MS->>Peer2: relay this message to peer2
    Peer4->>MS: relay this message to peer3
    MS->>Peer3: relay this message to peer3
    Peer4->>MS: relay this message to peer5
    MS->>Peer5: relay this message to peer5
```

## Definitions

```typescript
type Address = string

// A route is a list of peer ids.
type Route = Address[]

// A list of all the paths that need to be covered to broadcast the network
type PeerRoutingTable = Route[]
```

## Messaging service

To establish a P2P webrtc connection, peers will exchange signals with each other using the messaging service. This service will act as a fallback when no P2P route is available to deliver a message.

This service has same level of trust than any peer in the network, this means it has no specific authentication requirements, and any trust feature has to be built in the message itself. That been said implementors may choose to add some extra validation when doing high level clustering (like [real-time clustering of users into Islands (ADR-35)](/adr/ADR-35)), for clusters to remain isolated.

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
  timestamp: number
  room: string
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

Reference implementation:

```typescript
type Route = string[] | "server"
type PeerRoutingTable = Map<string, Route>

function calculateRoutingTables(mesh: Map<string, Set<string>>) {
  const routingTables = new Map<string, PeerRoutingTable>()

  const getOrCreateRoutingTable = (peerId: string) => {
    let table = routingTables.get(peerId)
    if (!table) {
      table = new Map<string, Route>()
      routingTables.set(peerId, table)
    }
    return table
  }

  function calculateRouteBeetwen(fromPeer: string, toPeer: string, _excluding: string[]): Route {
    const excluding = new Set<string>(_excluding)

    const calculatedRoutes = getOrCreateRoutingTable(fromPeer)

    const calculatedRoute = calculatedRoutes.get(toPeer)
    if (calculatedRoute) {
      return calculatedRoute
    }

    let route: Route = "server"

    const fromPeerConnections = mesh.get(fromPeer)
    if (!fromPeerConnections) {
      route = "server"
    } else if (fromPeerConnections?.has(toPeer)) {
      route = []
    } else {
      for (const p of fromPeerConnections) {
        if (excluding.has(p)) {
          continue
        }
        let relayedRoute = calculateRouteBeetwen(p, toPeer, [p, ..._excluding])
        if (relayedRoute !== "server") {
          relayedRoute = [p, ...relayedRoute]
          if (route === "server" || route.length > relayedRoute.length) {
            route = relayedRoute
          }
        }
      }
    }

    calculatedRoutes.set(toPeer, route)

    // NOTE: routes are bidirectional
    getOrCreateRoutingTable(toPeer).set(fromPeer, route === "server" ? route : Array.from(route).reverse())
    return route
  }

  const peers = new Set<string>()

  for (const [peer, connections] of mesh) {
    peers.add(peer)
    for (const connection of connections) {
      peers.add(connection)
    }
  }

  for (const peerFrom of peers) {
    for (const peerTo of peers) {
      if (peerFrom === peerTo) {
        continue
      }

      calculateRouteBeetwen(peerFrom, peerTo, [])
    }
  }

  return routingTables
}
```

## Packet

A packet contains a source (peer id) and a target specifying to whom the packet is for and the route to follow to reach it.

```typescript
type Packet = {
  source: Address
  target: Route[]
}
```

## Peer

Each time a package needs to be sent, then the peer will create it using its own paths as routing table and will make the network to obey that flow.

```json
{
  "source": "peer1",
  "target": [["peer2", "peer3"]]
}
```

This means each peer will check the `target` field, always the message will be processed, and then it will be relayed in the way the route value indicates.

Notice the peer relaying the message is not expected to remove itself either as a recipent or as a hop in the route, since this will require encoding the package again.

# Benefits

- Since there is a specific routing table for each message, there is no need to expire message or count hops. If a route is cut, the message will not be delivered by the mesh, this means the message should be relayed using the messaging service (if reliable) or discarded (if unreliable).
- The messaging service fallback provide a safety guarantee against network cluster partitions.
- A given implementation can be optimized by suggesting peers to connect to certain others in order to avoid clustering and minimize messaging service usage. This is out of the scope for this document.
- Since the routing service will know the status of the mesh at all times, it's easy to graph and debug network problems.

# Competition (alternatives)

- One simple solution using a P2P mesh, in which peers broadcast to others, and upon receiving a message, they relay to their connections. The problem with this solution is there is the possibility of messages going through the network after the same message is delivered, which implies the need to build a mechanism to discard old messages (using time or hops). Another problem is the possibility of clusters in the mesh, which may cause certain group of peers to not see the ones in another group (partitioned).

# Non-goals

- The route representation is not as efficient as it could be, since it uses `Address` (string) as a peer identification. This should be possible to improve, by assigning a numeric alias to every peer. However, detailing how to do that is out of the scope of this document, and doesn't change the overall proposed solution.

# Key dependencies and Open questions

- Why not let each peer calculate the best routing table, by broadcasting each peer status to the network?
  - This solution will consume a lot of resources from each client, since the table needs to be updated (or verified) every time there is a change.
  - This solution is somehow more difficult to debug, since routing tables have no source of truth, and different peers may build them differently.
