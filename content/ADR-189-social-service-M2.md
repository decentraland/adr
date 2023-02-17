---
layout: adr
adr: 189
title: Social service M2
date: 2023-02-08
status: Draft # pick one of these
type: RFC # pick one of these
spdx-license: CC0-1.0
authors:
  - jmoguilevsky
  - agusaldasoro
---

## Abstract

The goal of this milestone is to stop leveraging Matrix to handle friend requests amongst users. To do this the service will need to replace not only save the friendship interactions but will also need to have some mechanism to be able to notify in real time of the interactions to online users.

## Context, Reach & Prioritization

Currently, all friendship events are being stored in both Matrix and the Social service, to avoid this duplication of information this RFC proposes to start handling friendship requests directly on the Social service and stop storing the information in Matrix. The benefits of this proposal include:

- Downscale the load on Matrix
  - The friendships events (Request, Accept, Delete, etc.)
  - Prevent creating rooms when a friendship hasn't been established
- Be able to apply friend request policies (i.e. prevent spamming, max amount of friends, blocking, etc.)
- Extend the friendship API to know the pending friend requests a user has

Also, this new approach will need to be able to notify the users in real-time about the new friendship events, to do this a communication system will need to be established between the client and the server either (the technical specification of this system will be explored later).

## Solution Space Exploration

There are two main approaches:

### Websocket / Long polling

Websocket inherently comes with the benefit of establishing a bidirectional connection, enabling more features for the future (i.e. presence). Another big plus of using WebSocket is that the client can leverage protobuff and RPC for communication between the server and the client.
On the other hand, Websocket + RPC implies that the Social server will need to be the first implementation of RPC-rust which is not yet a production-tested product.

### Server-Sent Event (SSE)

This solution doesn't imply a constant connection between the server and the client and allows the existence of a notification system, it's cheap for the server and the client. The biggest problem with this solution is that there isn't an existent transport in unity for SSE, and in the future when presence is implemented there might need to be a big refactor and a replacement of the technology.

## Specification

Due to the benefits explained over the SSE solution, Websocket is the solution that will be further explored in this document.

The new flow for a friendship will be the following:

```mermaid
sequenceDiagram
    participant User 1
    participant User 2
    participant Social service
    participant Matrix

    User 1 ->> Social service: Add friend (new friend request)
    Social service ->>  User 2: New request from user 1
    User 2 ->> Social service: Accept friendship
    Social service ->> Matrix: create room
    Social service -->>+ User 1: New FriendshipId: roomId
    Social service -->>+ User 2: New FriendshipId: roomId
```

This new flow implies that rooms in Matrix will not be created until the friendship is established. This does not make the opposite true, if the friendship ends the room won't be destroyed (to prevent the history from being lost).

Now, when a user logs in to decentraland, the friendship requests will also be obtained from the social service instead of the matrix sdk.

First, the client will need to log in via HTTP, then establish a connection with the server, once correctly established, the server will then send two messages one with the current friends and another with the pending friend requests.

```mermaid
sequenceDiagram
    participant User 1
    participant Social service
    participant Matrix

    User 1 ->>+ Social service: Login
    Social service ->>+ Matrix: Login
    Matrix -->>- Social service: bearer token
    Social service -->>- User 1: bearer token
    User 1 ->>+ Social service: Connect via Websocket (token)
    Social service ->> User 1: Friends
    Social service ->> User 1: Friend Requests
    loop  Connection messages examples
    User 1 ->> Social service: Friend event (ACCEPT, DELETE, etc.)
    Social service ->> User 1: Friend event (ACCEPT, DELETE, etc.)
    end
    User 1 ->> Social service: Disconnect WebSocket
    Social service ->>- User 1: Disconnect WebSocket
```

## Implementation

### Unity Renderer changes

Given that Browser-interface is going to be slowly migrated into unity's codebase, the implementation of this feature will be done directly on unity's side too. Since this feature includes friends and friend requests, all of the code needed to handle friends and friendship requests will also be moved to unity, decoupling the dependency on Browser-interface. Still, channels, presence, and messaging will stay on the Browser interface side, but within time they will also be migrated to unity and will be able to leverage the new communication system.

To prevent migrating all the code into unity-renderer's code and adding a lot of logic, this ADR proposes to add a new library in C# that will handle the logic around friendships and modify the logic in unity renderer to become more of an orchestrator of events.

An example of a difference between the current implementation and the proposal is the following:

#### Current:

```mermaid
sequenceDiagram
    participant Renderer
    participant Browser interface
    participant Matrix client

    Renderer ->>+ Browser interface: Get friends
    Browser interface ->> Matrix client: Get friends
    Matrix client -->> Browser interface: friends ids []
    Browser interface ->> Browser interface: Calculate missing profiles
    Browser interface ->> Renderer: Add profiles to catalog(Profiles [])
    Browser interface -->>- Renderer: Friends []
```

#### Proposal:

```mermaid
sequenceDiagram
    participant Renderer
    participant Browser interface
    participant C# Social client

    Renderer ->>+ C# Social client: Get friends
    C# Social client -->>- Renderer: Friends list
    Renderer ->>+ Browser interface: Get missing profiles
    Browser interface -->>- Renderer: Profiles[]
    Renderer ->> Renderer: Store profiles in catalog
```

In this example, there are two main responsibilities of the flow:

1. Obtaining the friendships list
1. Storing the profiles in the catalog (to be able to render those friends)

It can be seen that in the first example it's the browser interface's responsibility to know what profiles are missing and then send them to unity, making the browser interface the information orchestrator, in this new approach, Renderer is the orchestrator.

### Browser interface changes

This new structure will also imply changes on the browser interface side. First, all of the friendship logic will be deleted, maintaining only the necessary state so that the channels and messaging code can still function without any bugs. What will be deleted are the interactions with Unity around storing the friendships, friendship requests, and the logic for fetching profile information before sending the friends.

The biggest impact on the Browser interface side will be in the Friends sagas, in the functions `refreshFriends`, and `handleIncomingFriendshipUpdateStatus`, and all the logic for the client configuration will be migrated to the new implementation on the renderer's side.

## Risk analysis

Description of risk — Summary description of the risk—easy to understand.

Probability of occurrence — Estimate the probability that this risk will materialize (HIGH-MEDIUM-LOW).

Severity — The intensity of undesirable impact on the project—if the risk materializes (HIGH-MEDIUM-LOW)..

Action — The contingent response if the risk materializes.

Loss Size — Given in hours or days, this is a measure of the negative impact on the project.

Risk Exposure — Given in hours or days, this is a product of probability and loss size.

Priority (optional) — This is either an independent ranking or the product of probability and severity. Typically, a higher-severity risk with high probability has higher relative priority (1-3) 1 being the higher.

| Description of risk                                                                | Probability of occurrence                       | Severity | Mitigation                                                                                                                                                                    | Loss Size                                                                                                                                                   | Risk Exposure | Priority |
| ---------------------------------------------------------------------------------- | ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| Rust-RPC can’t handle the expected load                                            | Low                                             | High     | Invest time in developing the framework to make it more performant                                                                                                            | If this problem gets to prod, users might be impacted by not receiving all expected messages. Or in the worst case, take down the social service altogether | Medium        | 1        |
| Rust RPC has internal bugs                                                         | Medium                                          | High     | Invest time in developing the framework to reduce bugs                                                                                                                        | If this problem gets to prod, users might be impacted by not receiving all expected messages. Or in the worst case, take down the social service altogether | High          | 1        |
| Difficulties integrating the new C# library into Unity-renderer                    | Medium (first-time something like this is done) | Low      | Invest more in development time and involvement from the Unity team                                                                                                           | This has no impact on the user. But can have a big impact on delaying the project                                                                           | Low           | 2        |
| Unkown internal dependency on Browser-interface around the Friends sagas/selectors | Medium/Low                                      | High     | Depending on the type of dependency, this can either imply more migration to C#, or a refactor internally in Browser-interface that can have a big impact in development time | This can be mitigated with a good testing plan, to prevent missing an existing use case.                                                                    | Low           | 2        |
