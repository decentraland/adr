---
layout: adr
adr: 245
title: Player Components
date: 2023-08-22
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
- leanmendoza
- robtfm
- menduz
---

## Abstract

This ADR proposes the implementation of player data components in SDK7 to enhance the information retrieval and management of player entities. The goal is to improve the real-time player data experience by reserving specific entities for players, optimizing data updates, and ensuring every scene receives player data components.

## Context

In SDK6, retrieving player information involved an async function, which provided data from the closest tick, resulting in latency between the actual player state and the received data. SDK7 introduces a new approach to address this limitation by reserving entities specifically for player data. Entities 0, 1, and 2 are reserved for the root scene, current camera, and current player, respectively, leaving 509 entities available for further optimizations.

## Proposal

The proposal consists of the following key points:
- Reserving Entities: Entities numbered 32 to 256 will be reserved for storing player data components. This reservation ensures that sufficient entities are available to accommodate player data. When a player disconnects from the room, the entity MUST be deleted, and a new generation for the entity number will be used. This ensures a session of up to 14.680.064 unique players.
- Player Data Components: A new set of player data components will be introduced, containing essential information about the player, such as position(Transform), wearables, identity, base avatar properties, and emote commands. 
- Scene Inclusion: Every scene in SDK7 MUST receive player data components. This inclusion ensures that each scene has access to real-time player data, which is vital for smooth interactions and gameplay experiences.
- Transform Updates: active parcel scenes (the one where each player is) and global scenes MUST receive real-time players `Transform` updates. Non-active parcel scenes MAY have no `Transform` of the player outside of them. Exception: the primary player `Transform` MUST be present in all scenes.

# Player Data Components

- PBAvatarBase a LWW component
```proto
// AvatarCustomizations sets all modifiers over the avatar's apparence.
message PBAvatarBase {
  decentraland.common.Color3 skin_color = 1;
  decentraland.common.Color3 eyes_color = 2;
  decentraland.common.Color3 hair_color = 3;
  string body_shape_urn = 4;
  string name = 5;
}
```

- PBAvatarEquippedData a LWW component
```proto
// AvatarEquipData is used to read the information about the avatar's owneables.
// this component is written by the engine using the communications transports' data.
message PBAvatarEquippedData {
  repeated string wearable_urns = 1;
  repeated string emotes_urns = 2;
}
```

- PBPlayerIdentityData a LWW component
```proto
// PlayerIdentityData is used to read the information about the avatar's identity.
// this component is written by the engine using the communications transports' data.
message PBPlayerIdentityData {
  string address = 1; // ethereum address of this player
  bool is_guest = 3;
}
```

- PBPlayerIdentityData a GOS component
```proto
// AvatarEmoteCommand is a grow only value set, used to signal the renderer about
// avatar emotes playback.
message PBAvatarEmoteCommand {
  message EmoteCommand {
    string emote_urn = 1;
    bool loop = 2;
  }

  EmoteCommand emote_command = 1;
}
```

# Conclusion

By implementing player data components and reserving entities for players in SDK7, we aim to enhance the real-time player data experience and streamline the retrieval and management of player information. This proposal sets the foundation for better player interactions and gameplay experiences within the SDK7 ecosystem.

## RFC 2119 and RFC 8174

> The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "
> SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL"
> in this document are to be interpreted as described in RFC 2119 and RFC 8174.