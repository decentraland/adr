---
adr: 137
date: 2022-11-02
title: Technical Assessment for the new Friend Request
authors:
  - sandrade-dcl
  - lorux0
status: Final
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-1
---

## Need
This is a technical proposal for the needs described here: [PRD: New Friend Requests](https://www.notion.so/PRD-New-Friend-Requests-188555225272448f91f3eea5e84f1cd3)

The intention of this document is:

- Identifying which teams will be involved and what responsibilities they’ll cover.
- Dividing the new functionality in smaller tasks that will be estimated accordingly in order to create a development roadmap.
- Finding possible corner cases in order to preemptively identify and solve them.
- Reaching a consensus between different affected teams in terms of defining the different functionalities and flows.

### Involved teams
This initiative will require a cross team effort that will include the following teams:

- Explorer: for the UI, UI functionalities and integration with Kernel.
- dServices: for the creation of new functionalities required such as obtaining the info of the received and sent friend requests from backend to kernel (dates, profile pictures, mutual friends, etc.).

In more detail the different responsibilities will be covered in the analysis of each part of the feature. A tag to the respective team will be placed next to each functionality.

## Approach
For this to work we need to synchronize the information between the Renderer, Kernel and Matrix servers.

Due to the current architecture implemented in the backend side, the idea would be to use always Kernel as a bridge between the Renderer and the Matrix server. So any communication needed between both sides will be done through messages in Kernel↔Renderer.

In terms of needed communications, we have identified the next main dependencies between Client and Backend:

## Send a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: The user sends a friend request from the pop-up.
renderer->kernel: GetFriendRequests(SendFriendRequestPayload{ userId:'0x...', messageBody='hello!' })
note right of kernel: Ask the server to create the friend request.
kernel-->renderer: AddUserProfilesToCatalog(addUserProfilesPayload)
kernel-->renderer: SendFriendRequestReply({ message: { reply: SendFriendRequestReplyOk | error: int }})
note left of renderer: In case of success, create a new entry in the SENT requests list.
note left of renderer: In case of error, show the error.
```

```
SendFriendRequestPayload {
  string user_id = 1;
  string message_body = 2;
}
```

```
SendFriendRequestReplyOk {
  FriendRequestInfo friend_request = 1; // Friend request info on the request you've sent to a user
}
```

```
SendFriendRequestReply {
  oneof message {
    SendFriendRequestReplyOk reply = 1;
    FriendshipErrorCode error = 2;
  }
}
```

## Cancel a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: The user cancels a friend request from the list.
renderer->kernel: CancelFriendRequest(CancelFriendRequestPayload{ friendRequestId: '<id>' })
note right of kernel: Ask the server to cancel the friend request.
kernel-->renderer: CancelFriendRequestReply({ message: { reply: CancelFriendRequestReplyOk | error: int }})
note left of renderer: In case of success, remove the entry from the SENT requests list.
note left of renderer: In case of error, show the error.
```

```
CancelFriendRequestPayload {
  string friend_request_id = 1;
}
```

```
CancelFriendRequestReplyOk {
  FriendRequestInfo friend_request = 1; // Friend request info on the request you've canceled
}
```

```
CancelFriendRequestReply {
  oneof message {
    CancelFriendRequestReplyOk reply = 1;
    FriendshipErrorCode error = 2;
  }
}
```

## Accept a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: The user accepts a friend request from the pop-up.
renderer->kernel: AcceptFriendRequest(AcceptFriendRequestPayload{ friendRequestId: '<id>'})
note right of kernel: Ask the server to accept the friend request.
kernel-->renderer: AcceptFriendRequestReply({ message: { reply: AcceptFriendRequestReplyOk | error: int }})
note left of renderer: In case of success, add a new entry in the notifications panel and remove the new entry from the RECEIVED requests list.
note left of renderer: In case of error, show the error.
note right of kernel: In case of success, if the friend request has a non-empty message body, it must be registered as part of the messages history of that user.
kernel-->renderer: Add the chat message and increase the unseen notifications counter for that specific user.
note left of renderer: Display the unseen message as usual.
```

```
AcceptFriendRequestPayload {
  string friend_request_id = 1;
}
```

```
AcceptFriendRequestReplyOk {
  FriendRequestInfo friend_request = 1;
}
```

```
AcceptFriendRequestReply {
  oneof message {
    AcceptFriendRequestReplyOk reply = 1;
    FriendshipErrorCode error = 2;
  }
}
```

## Reject a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: The user rejects a friend request from the pop-up.
renderer->kernel: RejectFriendRequest(RejectFriendRequestPayload{ friendRequestId: '<id>'})
note right of kernel: Ask the server to reject the friend request.
kernel-->renderer: RejectFriendRequestReply({ message: { reply: RejectFriendRequestReplyOk | error: int }})
note left of renderer: In case of success, remove the new entry from the RECEIVED requests list.
note left of renderer: In case of error, show the error.
```

```
RejectFriendRequestPayload {
  string friend_request_id = 1;
}
```

```
RejectFriendRequestReplyOk {
  FriendRequestInfo friend_request = 1;
}
```

```
RejectFriendRequestReply {
  oneof message {
    RejectFriendRequestReplyOk reply = 1;
    FriendshipErrorCode error = 2;
  }
}
```

## Get Friend Request List
In this case we are modifying the payloads of the existing flow:
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
renderer->kernel: GetFriendRequests(GetFriendRequestsPayload{ sentLimit: 50, sentSkip: 0, receivedLimit: 50, receivedSkip: 0 })
note right of kernel: Request the first (50) sent/received requests to the server.
kernel-->renderer: AddUserProfilesToCatalog(addUserProfilesPayload)
note left of renderer: Needed to fill in the UI info later.
kernel-->renderer: GetFriendRequestsReply({ message: { reply: GetFriendRequestsReplyOk | error: int }})
kernel-->renderer: UpdateUserPresence(userPresencePayload)
note left of renderer: Show online/offline status of each request.
note left of renderer: The user clicks on "show more requests".
renderer->kernel: GetFriendRequests(GetFriendRequestsPayload{sentLimit: 30, sentSkip: 50, receivedLimit: 30, receivedSkip: 50})
note right of kernel: Requests the next 30 friend requests to server.
kernel-->renderer: AddUserProfilesToCatalog(addUserProfilesPayload)
kernel-->renderer: GetFriendRequestsReply({ message: { reply: GetFriendRequestsReplyOk | error: int }})
kernel-->renderer: UpdateUserPresence(userPresencePayload)
```

```
GetFriendRequestsPayload {
  int32 sent_limit = 1; // Max amount of entries of sent friend requests to request
  int32 sent_skip = 2; // The amount of entries of sent friend requests to skip
  int32 received_limit = 3; // Max amount of entries of received friend requests to request
  int32 received_skip = 4; // The amount of entries of received friend requests to skip
}
```

```
GetFriendRequestsReplyOk {
  repeated FriendRequestInfo requested_to = 1; // Friend request info on the requests you've sent to users
  repeated FriendRequestInfo requested_from = 2; // Friend request info on the requests you've received from users
  int32 total_received_friend_requests = 3; // Total amount of friend requests received
  int32 total_sent_friend_requests = 4; // Total amount of friend requests sent
}
```

```
GetFriendRequestsReply {
  oneof message {
    GetFriendRequestsReplyOk reply = 1;
    FriendshipErrorCode error = 2;
  }
}
```

## Common Payloads
```
FriendRequestInfo {
  string friend_request_id = 1;
  uint64 timestamp = 2;
  string from = 3;
  string to = 4;
  optional string message_body = 5;
}
```

```
FriendshipErrorCode {
  FEC_TOO_MANY_REQUESTS_SENT = 0; // Any uncategorized friend request related error
  FEC_NOT_ENOUGH_TIME_PASSED = 1;
  FEC_BLOCKED_USER = 2;
  FEC_NON_EXISTING_USER = 3;
  FEC_INVALID_REQUEST = 4;
  FEC_UNKNOWN = 5;
}
```
