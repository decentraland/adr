---
layout: adr
adr: 286
title: Voice chat areas
date: 2025-07-31
status: Living
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

Scenes often require localized, ad-hoc voice communication between players who are physically near each other within a specific in-game space — for example, social hubs, games like speed dating, art exhibits, or impromptu stage areas. The current voice system only supports Community Voice Chat (with moderators and persistent rooms) or Private Conversations, which are either too global or too exclusive for these use cases.

## Decision

We are introducing a new type of Avatar Modifier Area called a Voice Chat Area, which automatically places players into a temporary, scoped LiveKit room when they are standing inside a defined 3D region. These areas provide private, ephemeral voice chat spaces where everyone can speak freely without moderation.

## Abstract

A Voice Chat Area is a volume in the scene that automatically joins players into a dedicated voice room when entered and removes them when exited. These rooms are:

- Ephemeral (only exist when 2+ people are inside)
- Private (not accessible from outside)
- Equal-access (no moderation; open mic format)

This ADR specifies the data model, runtime behavior, UI integration, and constraints for implementing Voice Chat Areas.

## Motivation

- Support natural, proximity-based audio conversations within specific scene areas.

- Enable immersive use cases like speed dating, stage performances, open mic corners.

- Avoid eavesdropping and ensure conversations are scoped to what players see.


## Room Lifecycle

A new LiveKit room is instantiated on-demand only if two or more users are present in the area.

- Rooms are ephemeral and are destroyed when fewer than two participants remain.
- Room identifiers do not persist — each room instance can have a new ID.

## Microphone Behavior

Upon joining, the player's mic is automatically muted by default.

Players must manually unmute to speak, to prevent accidental broadcast. This is to avoid the situation where a player accidentally unmutes their mic and starts talking to the world, which is not what we want.

## Design Constraints

### Privacy

- No eavesdropping — players outside the volume cannot hear or join the conversation.

- Participants should feel safe that the conversation is limited to visible, present users.

### Exclusivity

- A player cannot be in multiple voice chats simultaneously:

- No overlapping Voice Chat Areas.

- No joining while in a Private or Community Chat.

- Attempts to join while already in a call must trigger a prompt to leave first.


## Engine Responsibilities

- Monitor player position relative to all VoiceChatArea volumes.

- Manage joining/leaving LiveKit rooms automatically based on presence.

- Avoid resource waste by not persisting empty rooms.

- Synchronize user presence lists with UI updates in real-time.


## Scalability

- Unlimited number of VoiceChatAreas can exist in a scene.

- Only active areas with multiple users consume backend voice resources.

- LiveKit’s built-in user limits (e.g., ~256 per room) apply.

## Excluded IDs

As in other avatar modifier areas, the `excludeIds` field can be used to exclude specific players from the area. This could be useful for creators or eventually scene admins to exclude toxic players from joining the voice conversation.



## Serialization

```yaml

```

```protobuf

```

## Semantics

### Example

Voice chat area:

```ts
const entity = engine.addEntity()

AvatarModifierArea.create(entity, {
	area: Vector3.create(4, 3, 4),
	modifiers: [AvatarModifierType.AMT_VOICE_CHAT],
	excludeIds: []
})

Transform.create(entity, {
	position: Vector3.create(8, 0, 8),
})
```

