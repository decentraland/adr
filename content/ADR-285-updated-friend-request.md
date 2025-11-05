---
layout: adr
adr: 285
title: Friend Request Protocol V2
date: 2025-07-25
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - kevinszuchet
---

## Abstract

This specification defines the updated friend request protocol for Decentraland,
replacing the previous implementation described in
[ADR-137](https://adr.decentraland.org/adr/ADR-137-new-friend-request.md).
The new protocol leverages the existing Social Service infrastructure and follows
the established patterns for real-time communication, providing a more robust and
maintainable solution for managing friendship relationships between users.

The complete protocol definition can be found in the
[Decentraland Protocol repository](https://github.com/decentraland/protocol/blob/experimental/proto/decentraland/social_service/v2/social_service_v2.proto).

## Context

The original friend request implementation described in ADR-137 was designed to work
with Matrix as the underlying communication system. However, as outlined in
[ADR-208](https://adr.decentraland.org/adr/ADR-208-private-chat.md), Decentraland
has moved away from Matrix due to its complexity and cost. The current Social
Service implementation provides a more efficient and scalable solution for managing
social interactions.

This updated protocol leverages the existing Social Service infrastructure, which
already handles friendship management through the `UpsertFriendship` RPC call and
real-time updates via WebSocket subscriptions. The implementation follows the same
patterns established for private voice chats in
[ADR-284](https://adr.decentraland.org/adr/ADR-284-private-voice-chat.md).

## Specification

This section specifies the interaction between the Explorer and the Social Service
for managing friend requests, following the established patterns for real-time
communication.

### Sending a Friend Request

Sending a friend request is done by performing the `UpsertFriendship` RPC call with
the `request` action to the Social Service. The request includes the target user's
address and an optional message.

```mermaid
sequenceDiagram
  participant U1 as Requester
  participant SS as Social Service

  U1->>SS: UpsertFriendship(request: { user: "0x...", message: "Hello!" })
  alt User is blocked or invalid
    SS-->>U1: InvalidFriendshipAction error
  else Request is successful
    SS-->>U1: Accepted response with friendship details
  end
```

The RPC call is specified in the protocol as:

```protobuf
message UpsertFriendshipPayload {
  message RequestPayload {
    User user = 1;
    optional string message = 3;
  }
  message AcceptPayload { User user = 1; }
  message RejectPayload { User user = 1; }
  message DeletePayload { User user = 1; }
  message CancelPayload { User user = 1; }

  oneof action {
    RequestPayload request = 1;
    AcceptPayload accept = 2;
    RejectPayload reject = 4;
    DeletePayload delete = 5;
    CancelPayload cancel = 6;
  }
}

message UpsertFriendshipResponse {
  message Accepted {
    string id = 1;
    int64 created_at = 2;
    FriendProfile friend = 3;
    optional string message = 4;
  }

  oneof response {
    Accepted accepted = 1;
    InvalidFriendshipAction invalid_friendship_action = 2;
    InternalServerError internal_server_error = 3;
    InvalidRequest invalid_request = 4;
  }
}

rpc UpsertFriendship(UpsertFriendshipPayload) returns
(UpsertFriendshipResponse) {}
```

### Accepting a Friend Request

Accepting a friend request is done by performing the `UpsertFriendship` RPC call
with the `accept` action to the Social Service with the requester's address.

```mermaid
sequenceDiagram
  participant U2 as Recipient
  participant SS as Social Service

  U2->>SS: UpsertFriendship(accept: { user: "0x..." })
  alt Request doesn't exist or user is blocked
    SS-->>U2: InvalidFriendshipAction error
  else Request is accepted successfully
    SS-->>U2: Accepted response with friendship details
  end
```

### Rejecting a Friend Request

Rejecting a friend request is done by performing the `UpsertFriendship` RPC call
with the `reject` action to the Social Service with the requester's address.

```mermaid
sequenceDiagram
  participant U2 as Recipient
  participant SS as Social Service

  U2->>SS: UpsertFriendship(reject: { user: "0x..." })
  alt Request doesn't exist or user is blocked
    SS-->>U2: InvalidFriendshipAction error
  else Request is rejected successfully
    SS-->>U2: Accepted response with friendship details
  end
```

### Canceling a Friend Request

Canceling a sent friend request is done by performing the `UpsertFriendship` RPC
call with the `cancel` action to the Social Service with the recipient's address.

```mermaid
sequenceDiagram
  participant U1 as Requester
  participant SS as Social Service

  U1->>SS: UpsertFriendship(cancel: { user: "0x..." })
  alt Request doesn't exist or user is blocked
    SS-->>U1: InvalidFriendshipAction error
  else Request is canceled successfully
    SS-->>U1: Accepted response with friendship details
  end
```

### Deleting a Friendship

Deleting an existing friendship is done by performing the `UpsertFriendship` RPC
call with the `delete` action to the Social Service with the friend's address.

```mermaid
sequenceDiagram
  participant U1 as User
  participant SS as Social Service

  U1->>SS: UpsertFriendship(delete: { user: "0x..." })
  alt Friendship doesn't exist or user is blocked
    SS-->>U1: InvalidFriendshipAction error
  else Friendship is deleted successfully
    SS-->>U1: Accepted response with friendship details
  end
```

### Getting Friend Requests

Retrieving pending friend requests is done through separate RPC calls for sent and
received requests.

#### Getting Pending Friend Requests

```mermaid
sequenceDiagram
  participant U as User
  participant SS as Social Service

  U->>SS: GetPendingFriendshipRequests(pagination: { limit: 50, offset: 0 })
  SS-->>U: PaginatedFriendshipRequestsResponse with received requests
```

```protobuf
message GetFriendshipRequestsPayload {
  optional Pagination pagination = 1;
}

message FriendshipRequestResponse {
  FriendProfile friend = 1;
  int64 created_at = 2;
  optional string message = 3;
  string id = 4;
}

message FriendshipRequests {
  repeated FriendshipRequestResponse requests = 1;
}

message PaginatedFriendshipRequestsResponse {
  oneof response {
    FriendshipRequests requests = 1;
    InternalServerError internal_server_error = 2;
  }
  optional PaginatedResponse pagination_data = 3;
}

rpc GetPendingFriendshipRequests(GetFriendshipRequestsPayload) returns
(PaginatedFriendshipRequestsResponse) {}
```

#### Getting Sent Friend Requests

```mermaid
sequenceDiagram
  participant U as User
  participant SS as Social Service

  U->>SS: GetSentFriendshipRequests(pagination: { limit: 50, offset: 0 })
  SS-->>U: PaginatedFriendshipRequestsResponse with sent requests
```

```protobuf
rpc GetSentFriendshipRequests(GetFriendshipRequestsPayload) returns
(PaginatedFriendshipRequestsResponse) {}
```

### Getting Friends List

Retrieving the user's current friends list is done through the `GetFriends` RPC call.

```mermaid
sequenceDiagram
  participant U as User
  participant SS as Social Service

  U->>SS: GetFriends(pagination: { limit: 50, offset: 0 })
  SS-->>U: PaginatedFriendsProfilesResponse with friends list
```

```protobuf
message GetFriendsPayload {
  optional Pagination pagination = 1;
}

message PaginatedFriendsProfilesResponse {
  repeated FriendProfile friends = 1;
  PaginatedResponse pagination_data = 2;
}

rpc GetFriends(GetFriendsPayload) returns (PaginatedFriendsProfilesResponse) {}
```

### Getting Mutual Friends

Retrieving mutual friends between two users is done through
the `GetMutualFriends` RPC call.

```mermaid
sequenceDiagram
  participant U1 as User
  participant SS as Social Service

  U1->>SS: GetMutualFriends(user: "0x...", pagination: { limit: 50, offset: 0 })
  SS-->>U1: PaginatedFriendsProfilesResponse with mutual friends
```

```protobuf
message GetMutualFriendsPayload {
  User user = 1;
  optional Pagination pagination = 2;
}

rpc GetMutualFriends(GetMutualFriendsPayload)
returns (PaginatedFriendsProfilesResponse) {}
```

### Getting Friendship Status

Checking the friendship status between two users is done by performing the
`GetFriendshipStatus` RPC call.

```mermaid
sequenceDiagram
  participant U1 as User
  participant SS as Social Service

  U1->>SS: GetFriendshipStatus(user: "0x...")
  SS-->>U1: GetFriendshipStatusResponse with status
```

```protobuf
message GetFriendshipStatusPayload {
  User user = 1;
}

enum FriendshipStatus {
  REQUEST_SENT = 0;
  REQUEST_RECEIVED = 1;
  CANCELED = 2;
  ACCEPTED = 3;
  REJECTED = 4;
  DELETED = 5;
  BLOCKED = 6;
  NONE = 7;
  BLOCKED_BY = 8;
}

message GetFriendshipStatusResponse {
  message Ok {
    FriendshipStatus status = 1;
    optional string message = 2;
  }

  oneof response {
    Ok accepted = 1;
    InternalServerError internal_server_error = 2;
    InvalidRequest invalid_request = 3;
  }
}

rpc GetFriendshipStatus(GetFriendshipStatusPayload) returns
(GetFriendshipStatusResponse) {}
```

### Subscribing to Friendship Updates

Subscribing to friendship updates is critical for real-time friend request
management. This subscription is done by performing the
`SubscribeToFriendshipUpdates` RPC call to the Social Service.

```mermaid
sequenceDiagram
  participant U1 as User 1
  participant U2 as User 2
  participant SS as Social Service

  U1->>SS: Subscribe to friendship updates
  U2->>SS: Subscribe to friendship updates

  alt Friend request sent by U1
    U1->>SS: UpsertFriendship(request: { user: U2, message: "Hello!" })
    SS-->>U2: FriendshipUpdate(request: RequestResponse)
  else Friend request accepted by U2
    U2->>SS: UpsertFriendship(accept: { user: U1 })
    SS-->>U1: FriendshipUpdate(accept: AcceptResponse)
  else Friend request rejected by U2
    U2->>SS: UpsertFriendship(reject: { user: U1 })
    SS-->>U1: FriendshipUpdate(reject: RejectResponse)
  else Friend request canceled by U1
    U1->>SS: UpsertFriendship(cancel: { user: U2 })
    SS-->>U2: FriendshipUpdate(cancel: CancelResponse)
  else Friendship deleted by U1
    U1->>SS: UpsertFriendship(delete: { user: U2 })
    SS-->>U2: FriendshipUpdate(delete: DeleteResponse)
  else User U2 blocked by U1
    U1->>SS: BlockUser(user: U2)
    SS-->>U2: FriendshipUpdate(block: BlockResponse)
  end
```

```protobuf
message FriendshipUpdate {
  message RequestResponse {
    FriendProfile friend = 1;
    int64 created_at = 2;
    optional string message = 3;
    string id = 4;
  }
  message AcceptResponse { User user = 1; }
  message RejectResponse { User user = 1; }
  message DeleteResponse { User user = 1; }
  message CancelResponse { User user = 1; }
  message BlockResponse { User user = 1; }

  oneof update {
    RequestResponse request = 1;
    AcceptResponse accept = 2;
    RejectResponse reject = 3;
    DeleteResponse delete = 4;
    CancelResponse cancel = 5;
    BlockResponse block = 6;
  }
}

rpc SubscribeToFriendshipUpdates(google.protobuf.Empty) returns
(stream FriendshipUpdate) {}
```

### Subscribing to Friend Connectivity Updates

Subscribing to friend connectivity updates provides real-time information about
friends' online status.

```mermaid
sequenceDiagram
  participant U as User
  participant SS as Social Service

  U->>SS: Subscribe to friend connectivity updates
  alt Friend goes online/offline/away
    SS-->>U: FriendConnectivityUpdate(friend: {...}, status: ONLINE/OFFLINE/AWAY)
  end
```

```protobuf
enum ConnectivityStatus {
  ONLINE = 0;
  OFFLINE = 1;
  AWAY = 2;
}

message FriendConnectivityUpdate {
  FriendProfile friend = 1;
  ConnectivityStatus status = 2;
}

rpc SubscribeToFriendConnectivityUpdates(google.protobuf.Empty) returns
(stream FriendConnectivityUpdate) {}
```

### Blocking and Unblocking Users

The protocol also supports blocking and unblocking users, which affects friend
request functionality.

#### Blocking a User

```mermaid
sequenceDiagram
  participant U1 as Blocker
  participant SS as Social Service

  U1->>SS: BlockUser(user: "0x...")
  alt User doesn't exist
    SS-->>U1: ProfileNotFound error
  else User is blocked successfully
    SS-->>U1: BlockUserResponse with blocked user profile
  end
```

```protobuf
message BlockUserPayload {
  User user = 1;
}

message BlockUserResponse {
  message Ok {
    BlockedUserProfile profile = 1;
  }

  oneof response {
    Ok ok = 1;
    InternalServerError internal_server_error = 2;
    InvalidRequest invalid_request = 3;
    ProfileNotFound profile_not_found = 4;
  }
}

rpc BlockUser(BlockUserPayload) returns (BlockUserResponse) {}
```

#### Unblocking a User

```mermaid
sequenceDiagram
  participant U1 as Unblocker
  participant SS as Social Service

  U1->>SS: UnblockUser(user: "0x...")
  alt User doesn't exist
    SS-->>U1: ProfileNotFound error
  else User is unblocked successfully
    SS-->>U1: UnblockUserResponse with unblocked user profile
  end
```

```protobuf
message UnblockUserPayload {
  User user = 1;
}

message UnblockUserResponse {
  message Ok {
    BlockedUserProfile profile = 1;
  }

  oneof response {
    Ok ok = 1;
    InternalServerError internal_server_error = 2;
    InvalidRequest invalid_request = 3;
    ProfileNotFound profile_not_found = 4;
  }
}

rpc UnblockUser(UnblockUserPayload) returns (UnblockUserResponse) {}
```

#### Getting Blocked Users

Retrieving the list of blocked users is done through the `GetBlockedUsers` RPC call.

```mermaid
sequenceDiagram
  participant U as User
  participant SS as Social Service

  U->>SS: GetBlockedUsers(pagination: { limit: 50, offset: 0 })
  SS-->>U: GetBlockedUsersResponse with blocked users list
```

```protobuf
message GetBlockedUsersPayload {
  optional Pagination pagination = 1;
}

message GetBlockedUsersResponse {
  repeated BlockedUserProfile profiles = 1;
  PaginatedResponse pagination_data = 2;
}

rpc GetBlockedUsers(GetBlockedUsersPayload)
returns (GetBlockedUsersResponse) {}
```

#### Getting Blocking Status

Checking the blocking status between users is done
through the `GetBlockingStatus` RPC call.

```mermaid
sequenceDiagram
  participant U as User
  participant SS as Social Service

  U->>SS: GetBlockingStatus()
  SS-->>U: GetBlockingStatusResponse with blocking information
```

```protobuf
message GetBlockingStatusResponse {
  repeated string blocked_users = 1;
  repeated string blocked_by_users = 2;
}

rpc GetBlockingStatus(google.protobuf.Empty)
returns (GetBlockingStatusResponse) {}
```

#### Subscribing to Block Updates

```mermaid
sequenceDiagram
  participant U as User
  participant SS as Social Service

  U->>SS: Subscribe to block updates
  alt User is blocked/unblocked
    SS-->>U: BlockUpdate(address: "0x...", is_blocked: true/false)
  end
```

```protobuf
message BlockUpdate {
  string address = 1;
  bool is_blocked = 2;
}

rpc SubscribeToBlockUpdates(google.protobuf.Empty) returns
(stream BlockUpdate) {}
```

## Client Responsibilities

The client implementation carries the crucial task of maintaining friend request
functionality and respecting user-defined social settings.

### Real-time Updates Management

The client must maintain a subscription to friendship updates to receive real-time
notifications about friend request changes. This subscription should be established
upon connecting to the Social Service and maintained throughout the session.

### Error Handling

The client must handle various error scenarios gracefully.
All error types are defined in the
[`decentraland/social_service/errors.proto`](https://github.com/decentraland/protocol/blob/experimental/proto/decentraland/social_service/errors.proto)
file and include:

- **InvalidFriendshipAction**: Display appropriate error messages when friendship
  actions are not allowed (e.g., blocked users, invalid requests)
- **InternalServerError**: Implement retry logic for server errors
- **InvalidRequest**: Validate input data before sending requests
- **ProfileNotFound**: Handle cases where target users don't exist
- **ConflictingError**: Handle conflicts when multiple operations are attempted simultaneously
- **ForbiddenError**: Handle permission-related errors
- **NotFoundError**: Handle cases where requested resources don't exist

### State Management

The client must maintain local state for:

- Pending friend requests (both sent and received)
- Current friends list
- Mutual friends with other users
- Blocked users list
- Friendship status with other users
- Friend connectivity status (online/offline/away)

### Blocking Integration

The client must respect blocking functionality when displaying friend requests and
managing friendships. This includes:

- Filtering blocked users from friend request lists
- Preventing actions with blocked users
- Respecting blocking status when managing friendships

## Migration from ADR-137

This updated protocol replaces the previous implementation described in ADR-137.
Key changes include:

1. **Unified RPC Interface**: All friendship actions now use the `UpsertFriendship`
   RPC call with different action types
2. **Real-time Updates**: WebSocket-based subscription system replaces the previous
   notification mechanism
3. **Enhanced Error Handling**: More specific error types and better error handling
4. **Blocking Support**: Integrated blocking functionality that affects friend
   request behavior
5. **Connectivity Features**: Real-time friend online status tracking

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
> "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
> "OPTIONAL" in this document are to be interpreted as described in RFC 2119
> and RFC 8174.
