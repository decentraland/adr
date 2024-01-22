---
layout: adr
adr: 246
title: POC Presence in Social Service
date: 2023-07-26
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - agusaldasoro
---

## Abstract

The current presence handling system in Matrix has many problems, from performance to functionality. The information is not always accurate, real-time updates do not always arrive correctly, and it often has to be disabled for performance reasons. To add new features to presence, it is necessary to migrate the system to the Social service and implement its own status notification system.

The new system will be more reliable, efficient, and scalable, and it will allow to add new features to presence in the future.

This documents presents a PoC of the implementation for the Presence Notifications in Social Service.

## Context, Reach & Prioritization

Doing this PoC is necessary to understand the effort estimation of migrating Presence feature from Synapse to the Social Service.

The feature needed is to broadcast to all user's friends the position, realm and status (online/offline).

## Solution Space Exploration

Use Redis to store all the connected users, so every time every other user connects to the social service they can retrieve all the friends that are online. Then they can subscribe to all status updates so know when a friend connects or disconnects.

This is a PoC so handling different status of presence is out of the scope, the idea is to migrate the same functionality that currently Matrix has to the Social Server.

The proposed solution leverages the power of Redis, an in-memory data structure store, to enhance real-time data processing capabilities. It involves the following steps:

1. Loading Initial Data:
Upon service initialization, all relevant data from Redis is fetched and loaded into memory. This step ensures that the application starts with the most up-to-date information in memory.

2. Subscribing to Redis Changes:
To stay updated in real-time, the application subscribes to Redis channels for relevant sets. This subscription allows the application to receive notifications whenever a change occurs in the Redis sets.

3. Handling User Updates:
When the application receives an update from a user, it proceeds with the following actions:

a. Saving in Memory:
The received update is immediately saved in the application's in-memory data structures. This step allows the application to respond rapidly to user requests and provide real-time updates for other users.

b. Saving in Redis:
The update is also stored in the appropriate Redis set. By doing so, the data is safely persisted to handle potential crashes or restarts, ensuring data integrity.

3. Handling Redis Updates:
In case the application receives an update from Redis, it proceeds with the following actions:

a. Saving in Memory:
Similar to user updates, updates received from Redis are stored in the application's in-memory data structures. This approach maintains consistency between in-memory and Redis data.

The proposed solution utilizes Redis sets to represent various states. Redis sets provide efficient membership checking, intersection, and union operations. As the number of states increases, distinct sets can be employed to handle each state independently, promoting modularity and scalability.

5. Handling disconnections:
Efficiently track online users using Redis and in-memory timestamps. Store user status with the latest timestamp in both Redis and memory. When retrieving online users, remove entries older than 5 minutes from Redis and memory. Ensures real-time accuracy, low latency, and data consistency for a seamless user experience. Highly scalable for varying user loads.

## Specification

The current authentication flow relies on the client to obtain the Matrix Token by themselves, so the ideal would be that when migrating the Presence Feature from Synapse to the Social service, the Authentication Flow should be implemented in the Social Service as discussed in [ADR-143](https://adr.decentraland.org/adr/ADR-143).

As this is a PoC, the focus will be unblocking the project and reduce any risk that can be found. In that line, the PoC doesn't include any change on the Authentication Flow and the current one is the one that's going to be used.

So, the changes in this PoC include the following messages in the RPC Websocket server:

```
rpc PositionHeartbeat(PositionPayload) returns (PositionResponse) {}
rpc GetOnlineFriends(Payload) returns (stream UsersResponse) {}
rpc SubscribeFriendshipPresenceUpdates(Payload) returns (stream SubscribeFriendshipPresenceUpdatesResponse) {}
```

As the current social service doesn't implement itself authentication, there is no way to automatically identify online users. Doing that is the correct solution, but it's out of scope for this PoC.

So, the proposed solution here is that all the users will send a heartbeat to the social service every 30 seconds using the message `PositionHeartbeat` which includes the coordenates and the realm. So, when a heartbeat arrives to the social service, that means that the user is online. The same way if the service stops receiving updates from an online user after 2 minutes, then the user will start appearing ofline.

That way, Redis will have cached a set with all the connected users, so when a user asks for `GetOnlineFriends` then the service filters out only the friends from that set, and send them to the final user. That set will have a TTL of 2 minutes, so if no new update has arrived then the status of the user will change to offline (notifying the corresponding friends connected to `SubscribeFriendshipPresenceUpdates`).

The same way, when a user triggers a change of `PositionHeartbeat` then all of their friends that are connected to `SubscribeFriendshipPresenceUpdates` will be notified.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
