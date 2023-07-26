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


## Solution Space Exploration

Use Redis to store all the connected users, so every time a new user connects to the social service they can retrieve all the friends that are online. Then they can subscribe to all status updates so know when a friend connects or disconnects.

This is a PoC so handling different status of presence is out of the scope, the idea is to migrate the same functionality that currently Matrix has to the Social Server.

## Specification

New messages added to the RPC Websocket server:

```
rpc SetPresenceStatus(StatusPayload) returns (StatusResponse) {}
rpc GetOnlineFriends(Payload) returns (stream UsersResponse) {}
rpc SubscribeFriendshipPresenceUpdates(Payload) returns (stream SubscribeFriendshipPresenceUpdatesResponse) {}
```

As the current social service doesn't implement itself authentication, there is no way to automatically identify online users. Doing that is the correct solution, but it's out of scope for this PoC.

So, the proposed solution here isthat when a user wants to be set as active in presence, then they will send the message `SetPresenceStatus` with the status online, so it will be visible. The same if they want to appear offline.

Note that marking a user as disconnected when loosing the connection to the server is out of the scope too, as for that it's needed to have a way to identify the user address from the connection.

That way, Redis will have cached a set with all the connected users, so when a user asks for `GetOnlineFriends` then the service filters out only the friends from that set, and send them to the final user.

The same way, when a user triggers a change of `SetPresenceStatus` then all of their friends that are connected to `SubscribeFriendshipPresenceUpdates` will be notified.


## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
