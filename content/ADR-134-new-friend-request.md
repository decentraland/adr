---
adr: 134
date: 2022-11-02
title: Technical Assessment for the new Friend Request
authors:
  - sandrade-dcl
  - lorux0
status: Draft
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
- dServices: for the creation of new functionalities required such as obtaining the info of the received and sent friend requests from backend to kernel (dates, profile pictures, mutual friends, etc.)…

More in detail the different responsibilities will be covered in the analysis of each part of the feature. A tag to the respective team will be placed next to each functionality.

## Approach
For this to work we need to synchronize the information between the Renderer, Kernel and Matrix servers.

Due to the current architecture implemented in the backend side, the idea would be to use always Kernel as a bridge between the Renderer and the Matrix server. So any communication needed between both sides will be done through messages in Kernel↔Renderer.

In terms of needed communications, we have identified the next main dependencies between Client and Backend:

### Send a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: the user send a friend\nrequest from the pop-up
renderer->kernel: RequestFriendship(requestFriendshipPayload{messageId:'<unique-id>', userId:'0x...', messageBody='hello!'})
note right of kernel: ask the server to create\nthe friend request.
note left of kernel: in case of success
kernel-->renderer: AddUserProfilesToCatalog(addUserProfilesPayload)
kernel-->renderer: RequestFriendshipConfirmation(requestFriendshipConfirmationPayload)
note left of renderer: create a new entry in\nthe SENT requests list
note left of kernel: in case of error
kernel-->renderer: RequestFriendshipError(requestFriendshipErrorPayload)
note left of renderer: show the error
```

```
requestFriendshipPayload {
    messageId: string, // An unique id to handle the renderer<->kernel communication when the server send a response. Kernel must send back to the renderer the same messageId on the response.
    userId: string,
    messageBody: string
}
```

```
requestFriendshipConfirmationPayload{
    messageId: string,
    friendRequest: friendRequestPayload
}
```

```
requestFriendshipErrorPayload{
    messageId: string,
    errorCode: int (refer to listOfErrorCodes)
}
```

## Cancel a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: the user cancels a friend\nrequest from the list
renderer->kernel: CancelFriendship(cancelFriendshipPayload{messageId:'<unique-id>', friendRequestId: '<any id>'})
note right of kernel: ask the server to cancel\nthe friend request.
note left of kernel: in case of success
kernel-->renderer: CancelFriendshipConfirmation(cancelFriendshipConfirmationPayload)
note left of renderer: remove the entry from\nthe SENT requests list
note left of kernel: in case of error
kernel-->renderer: CancelFriendshipError(cancelFriendshipErrorPayload)
note left of renderer: show the error
```

```
cancelFriendshipPayload {
    messageId: string,
    friendRequestId: string
}
```

```
cancelFriendshipConfirmationPayload{
    messageId: string,
    friendRequestId: string
}
```

```
cancelFriendshipErrorPayload{
    messageId: string,
    errorCode: int (refer to listOfErrorCodes)
}
```

## Receive a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: during the session
note right of kernel: an user send us a\nfriend request
kernel-->renderer: AddUserProfilesToCatalog(addUserProfilesPayload)
kernel->renderer: AddFriendRequest(friendRequestPayload)
note left of renderer: create a new entry in\nthe RECEIVED requests list
note left of renderer: add a new entry in\nthe notifications panel
```

## Accept a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: the user accept a friend\nrequest from the pop-up
renderer->kernel: AcceptFriendship(acceptFriendshipPayload{messageId:'<unique-id>', friendRequestId: '<any id>'})
note right of kernel: ask the server to accept\nthe friend request.
note left of kernel: in case of success
kernel-->renderer: AcceptFriendshipConfirmation(acceptFriendshipConfirmationPayload)
note left of renderer: remove the new entry from\nthe RECEIVED requests list
note left of renderer: add a new entry in\nthe notifications panel
note left of kernel: in case the friend request\nhas a non-empty message body
note right of kernel: the message of the request must be\nregistered as part of the messages\nhistory of that user
kernel-->renderer: Add the chat message and increase the unseen\nnotifications counter for that specific user
note left of renderer: display the unseen\nmessage as usual
note left of kernel: in case of error
kernel-->renderer: AcceptFriendshipError(acceptFriendshipErrorPayload)
note left of renderer: show the error
```

```
acceptFriendshipPayload {
    messageId: string,
    friendRequestId: string
}
```

```
acceptFriendshipConfirmationPayload{
    messageId: string,
    friendRequestId: string
}
```

```
acceptFriendshipErrorPayload{
    messageId: string,
    errorCode: int (refer to listOfErrorCodes)
}
```

## Reject a Friend Request
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
note left of renderer: the user reject a friend\nrequest from the pop-up
renderer->kernel: RejectFriendship(rejectFriendshipPayload{messageId:'<unique-id>', friendRequestId: '<any id>'})
note right of kernel: ask the server to reject\nthe friend request.
note left of kernel: in case of success
kernel-->renderer: RejectFriendshipConfirmation(rejectFriendshipConfirmationPayload)
note left of renderer: remove the new entry from\nthe RECEIVED requests list
note left of kernel: in case of error
kernel-->renderer: RejectFriendshipError(rejectFriendshipErrorPayload)
note left of renderer: show the error
```

```
rejectFriendshipPayload {
    messageId: string,
    friendRequestId: string
}
```

```
rejectFriendshipConfirmationPayload{
    messageId: string,
    friendRequestId: string
}
```

```
rejectFriendshipErrorPayload{
    messageId: string,
    errorCode: int (refer to listOfErrorCodes)
}
```

## Get Friend Request list
In this case we are modifying the payloads of the existing flow:
```mermaid
sequenceDiagram
  participant renderer
  participant kernel
  
renderer->kernel: GetFriendRequests(getFriendRequestsPayload{sentLimit:50, sentSkip:0, receivedLimit:50, receivedSkip:0})
note right of kernel: request the first (50)\nsent/received requests\nto the server
kernel-->renderer: AddUserProfilesToCatalog(addUserProfilesPayload)
note left of renderer: needed to fill\nin the ui info later
kernel-->renderer: AddFriendRequests(addFriendRequestsPayload)
kernel-->renderer: UpdateUserPresence(userPresencePayload)
note left of renderer: show online/offline\nstatus of each request
note right of kernel: register that th user\nseen requests with\nthe current timestamp
note left of renderer: the users clicks on\n"show more requests"
renderer->kernel: GetFriendRequests(getFriendRequestsPayload{sentLimit:30, sentSkip:50, receivedLimit:30, receivedSkip:50})
note right of kernel: requests the next 30\nfriend requests to server
kernel-->renderer: AddUserProfilesToCatalog(addUserProfilesPayload)
kernel-->renderer: AddFriendRequests(addFriendRequestsPayload)
kernel-->renderer: UpdateUserPresence(userPresencePayload)
```

```
getFriendRequestsPayload {
    messageId: string,
    sentLimit:int: max amount of entries to receive
    sentSkip:int: the amount of sent requests to skip
    receivedLimit:int: max amount of entries to receive
    receivedSkip:int: the amount of received requests to skip
}
```

```
addFriendRequestsPayload {
    messageId: string,
    requestedTo: friendRequestPayload[],
    requestedFrom: friendRequestPayload[],
    totalReceivedFriendRequests: int, //total amount of friend requests received
    totalSentFriendRequests: int //total amount of friend requests sent
}
```

### Common Payloads
```
friendRequestPayload {
   friendRequestId: string,
   timestamp: long,
   from: string,
   to: string,
   messageBody: string
}
```

```
listOfErrorCodes: {
    tooManyRequestsSent = 0,
    notEnoughTimePassed = 1,
    blockedUser = 2,
    nonExistingUser = 3,
    invalidRequest = 4,
    unknown = 5
}
```
