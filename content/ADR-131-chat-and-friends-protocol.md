---
layout: doc
adr: 131
date: 2022-11-16
title: Chat and Friends protocol
description: Document with chat and friends protocol definitions
type: RFC
status: Review
spdx-license: CC0-1.0
authors:
  - guidota
---

# Abstract

Most communications between Renderer and Kernel use a JSON-based mechanism that we want to replace with RPC and a protocol.
Chat and Friends features use that mechanism, and fixing or extending the functionality can be very hard to define and maintain.
In this RFC, the interactions will be reviewed, and a protocol for those features will be defined.

# Need

Nowadays, communication flows are very hard to document, fix, extend, or even maintain. Changing a single field in a message can break the whole feature or the user session.
Also, JSON-based message deserialization creates objects that then would be deleted by the Garbage Collector, affecting Explorer stability when there are plenty of them.

# Approach

First of all, every feature flow should be identified to define the messages between Renderer and Kernel, then:

- Review messages that are not Request-Response based.
- Add chat and friends definitions to Decentraland Protocol (@dcl/protocol).
- Implement RPC Server on Kernel.
- Implement RPC Client on Renderer.

## API definitions

It's worth noting that real-time updates like chat messages or friend requests would be streamed, instead of using a request-response call.

Work in progress: once the APIs are well defined, message definitions should be added.

### Chat API

Currently, Kernel is initializing chat & friends when the renderer is loaded. This behavior can be changed by adding an initialization request.

```protobuf
service ChatAPIService {
  rpc Initialize(InitializeRequest) returns InitializeResponse
  rpc SendMessage(SendMessageRequest) returns SendMessageResponse {}

  // streams
  rpc ReceiveMessages(ReceiveMessageRequest) returns (stream ChatMessage)
}
```

### Channels API

```protobuf
service ChannelsAPIService {
  // actions
  rpc CreateChannel(CreateChannelRequest) returns CreateChannelResponse {}
  rpc JoinOrCreateChannel(JoinOrCreateChannelRequest) returns JoinOrCreateChannelResponse {}
  rpc LeaveChannel(LeaveChannelRequest) returns LeaveChannelResponse {}
  rpc MuteChannel(MuteChannelRequest) returns MuteChannelResponse {}
  rpc MarkChannelMessagesAsSeen(MarkChannelMessagesAsSeenRequest) returns MarkChannelMessagesAsSeenResponse {}

  // queries
  rpc GetChannels(GetChannelsRequest) returns GetChannelsResponse {}
  rpc GetJoinedChannels(GetJoinedChannelsRequest) returns GetJoinedChannelsResponse {}
  rpc GetChannelMessages(GetChannelMessagesRequest) returns (stream GetChannelMessagesResponse {})
  rpc GetUnseenMessagesByChannel(GetUnseenMessagesByChannelRequest) returns (stream GetUnseenMessagesByChannelResponse {})

  // streams
  rpc GetChannelInfo(GetChannelInfoRequest) returns (stream GetChannelInfoResponse {})
  rpc GetChannelMembers(GetChannelMembersRequest) returns (stream GetChannelMembersResponse {})
}

```

### Friends API

```protobuf
service FriendsAPIService {
  // actions
  rpc MarkMessagesAsSeen(MarkMessagesAsSeenRequest) returns MarkMessagesAsSeenResponse {}
  rpc UpdateFriendshipStatus(UpdateFriendshipStatusRequest) returns UpdateFriendshipStatusResponse {}
  rpc RequestFriendship(RequestFriendshipRequest) returns RequestFriendshipResponse {}
  rpc CancelFriendship(CancelFriendshipRequest) returns CancelFriendshipResponse {}
  rpc AcceptFriendship(AcceptFriendshipRequest) retruns AcceptFriendshipResponse {}
  rpc RejectFriendship(RejectFriendshipRequest) returns RejectFriendshipResponse {}

  // queries
  rpc GetFriends(GetFriendsRequest) returns GetFriendsResponse {}
  rpc GetFriendsWithDirectMessages(GetFriendsWithDirectMessagesRequest) returns GetFriendsWithDirectMessagesResponse {}
  rpc GetPrivateMessages(GetPrivateMessagesRequest) returns (stream GetPrivateMessagesResponse {})
  rpc GetFriendRequests(GetFriendRequestsRequest) returns (stream GetFriendRequestsResponse {})
}

```

# Benefit

De/serializing JSON can be very slow and waste much time collecting the garbage. Using Decentraland protocol and RPC would improve performance and maintainability.
Also, developers would be talking in the same language and would not have to replicate definitions on both sides, making it reliable and secure.
In the same direction, these features can be extracted in the future into a service that would not run in the Kernel, simplifying code and improving performance.

# Competition

Do nothing and continue using the JSON implementation with the before-mentioned issues for performance and maintainability.

---
