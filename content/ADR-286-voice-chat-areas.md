---
layout: adr
adr: 286
title: Scene Voice Chat
date: 2025-08-20
status: Living
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

Scenes often require localized, ad-hoc voice communication between players — for example, social hubs, use cases like speed dating, or impromptu stage areas. The current voice system only supports Community Voice Chat (with moderators and persistent rooms) or Private Conversations, which require that the players first become friends. This is not ideal for more spontaneous use cases.

## Decision

We are introducing a means for the scene to assign players to a group voice chat. Scenes can use any logic they want to determine which players are in a voice chat.

The creation and management of voice chat rooms is handled by a backend service, each explorer can use the new provided functions to join and leave voice chat rooms.

In these voice chats everyone can speak freely without moderation.

## Motivation

- Support natural audio conversations within specific scene areas.

- Enable immersive use cases like speed dating, stage performances, open mic corners, etc.


## Design Constraints

### Privacy

— Althought there will always be ways for players to eavesdrop on a voice chat, each explorer should display the list of players who are taking part in the conversation. Thanks to that, players can be sure of the privacy of their conversation.


### Exclusivity

- A player cannot be in multiple voice chats simultaneously. If the scene assigns a player to a voice chat, the player will be disconnected from any other voice chat they were in.

- No joining while in a Private or Community Voice Chat.

- Voice chats are exclusive to each scene. A single voice chat can't span players from different scenes.

- Players should be ablele to see a video stream from a scene while in a voice chat. We don't want more than one channel where the player can speak, but they should be able to consume other streams passively. For example, a scene might stream music while the player is in a voice chat.


## Connect and disconnect from a voice chat

We'll introduce two new functions to connect and disconnect from a voice chat: `ConnectToVoiceChat()` and `DisconnectFromVoiceChat()`.

The function `ConnectToVoiceChat()` will pass a room ID. The room ID is a unique identifier for each voice chat managed by the scene. Players who are in the same voice chat will be able to hear each other.

The function `DisconnectFromVoiceChat()` doesn't need to pass a room ID, since the player will be disconnected from the voice chat they are currently in.

There is no limit to the amount of room IDs that a scene can handle. On the backend, only active voice chats with multiple users consume voice resources.
The backend will handle the connection to the voice chat room and the disconnection from the voice chat room.

We want to allow scenes to be able to hard-code the room ID in the scene. This is useful for scenes that have a fixed number of voice chats.

```ts
triggerEventsSystem.OnTriggerEnter(
    {
      entity: myTrigger,
      opts: {
        layer: Player
      }
    },
    function () {
      ConnectToVoiceChat(1)
    }
  )
  
  triggerEventsSystem.OnTriggerLeave(
    {
      entity: myTrigger,
      opts: {
        layer: Player
      }
    },
    function () {
      DiconnectFromVoiceChat()
    }
  )
```

In this example, a trigger area is conencting to a hardcoded room number *1*. The scene could have N trigger areas, each with its own separate room number ID hardcoded. 

If on the other hand, the scene would have to query the backend to know what room IDs are available, it would be a lot more complex for the scene to coordinate this simple use case. It would need to sync information between players to know which ID is being assigned to which trigger area and pick the right one.

### Query open rooms

For more advanced use cases, the scene could query the backend to know what room IDs are available for this scene. This would allow the scene to have a dynamic number of voice chats based on whatever logic they want.

We'll introduce a new function to query the backend to know what room IDs are available for this scene: `GetAvailableVoiceChatRooms()`.

This function will return a promise that will resolve to an array of room IDs and the list of users in each room.

```ts	
const await availableRooms = GetAvailableVoiceChatRooms()

if (availableRooms.length > 0) {
  ConnectToVoiceChat(availableRooms[0])
}

```

The scene could use this function to know what room IDs are available and connect to the first one.


### Disconnect from a voice chat






## Serialization

```yaml

```

```protobuf

```

## Semantics

### Example

Voice chat area:

```ts
triggerEventsSystem.OnTriggerEnter(
    {
      entity: myTrigger,
      opts: {
        layer: Player
      }
    },
    function () {
      ConnectToVoiceChat(1)
    }
  )
  
  triggerEventsSystem.OnTriggerLeave(
    {
      entity: myTrigger,
      opts: {
        layer: Player
      }
    },
    function () {
      DiconnectFromVoiceChat(1)
    }
  )
```

