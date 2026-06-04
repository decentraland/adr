---
adr: 280
date: 2025-09-18
title: Avatar Locomotion Control
authors:
  - adr-wg
status: Draft
type: Standards Track
spdx-license: CC0-1.0
---

## Abstract

This ADR defines SDK7 components to control player locomotion parameters. It focuses on the protocol and semantics exposed by the SDK, providing a common contract for multiple engine implementations. Engines are free to implement internal movement controllers and animation systems as they see fit, as long as they honor the behavior specified here.

## Component description

A new component is introduced and MUST be associated with player entities (see ADR-245):

AvatarLocomotion: Allows scenes to parametrize baseline movement capabilities (e.g., walk/jog/run speeds, jump, landing cooldown). Values may change dynamically (e.g., temporary boosters).

These controls are intended for the local player only within the scope of the scene instance. Scenes MUST NOT directly modify other remote players.

## Serialization

```yaml
parameters:
  COMPONENT_NAME: core::AvatarLocomotion
  CRDT_TYPE: LastWriteWin-Element-Set
```

```protobuf
// Parametrizes baseline locomotion for the player controlled by this scene instance.
message PBAvatarLocomotion {
  // Movement speeds in meters/second. If unset, the engine MUST use the user's preference/defaults.
  optional float walk_speed = 1;
  optional float jog_speed = 2;
  optional float run_speed = 3;

  // Jump capabilities. Heights are in meters; lengths are horizontal travel in meters.
  optional float jump_height = 4;
  optional float run_jump_height = 5;
  optional float jump_max_length = 6;
  optional float run_jump_max_length = 7;

  // Cooldown after a hard landing, in seconds.
  optional float landing_cooldown_seconds = 8;
}
```


Notes:
- Component numbers are intentionally not assigned here; see ADR-165 for allocation.
- Fields are OPTIONAL. Unset fields MUST fall back to engine/user defaults.
- For all parameters, there must be a minimum and maximum value. The minimum value should always be 0, as we don't want to allow negative values and maximum values are engine-specific.
- Speeds are expressed as meters per second.
- Lengths and heights are expressed as meters.
- Durations are expressed as seconds.

## Semantics

### Scope and authority

- Scenes MAY write `AvatarLocomotion` only for the local player entity exposed to that scene (ADR-245). Scenes MUST NOT mutate locomotion of other players.
- A scene's authority is limited to the parcels it owns (ADR-192). Engines MUST ensure scenes cannot affect players outside scene bounds.
- If smart wearables or other sources provide locomotion changes, the precedence MUST be: Active parcel scene > Global scenes > Smart wearables > Engine defaults.

### Application timing

- Engines MUST apply changes to effective locomotion during the scene-to-renderer synchronization tick as defined by ADR-148. New values SHOULD take effect by the next movement update.
- It's recommended that each engine tempo-scales locomotion clips so that animation stride matches movement speed. This is not required and engines are free to implement it or not.

### Valid ranges and clamping

- All speeds, lengths and heights MUST be finite, non-negative numbers.
- Engines MAY impose implementation-specific maxima (e.g., anti-teleport thresholds).

### Networked players

- Locomotion set by a scene instance applies only to that local player. Engines MAY propagate effective locomotion parameters over their networking layer to improve remote prediction, but this ADR does not mandate a wire format.

### Usecase examples

- Temporary booster: If the player collects an item in the scene, it sets `run_speed` to a higher value for 10 seconds; after expiry, it deletes the component from the avatar to restore defaults.
- Wearable bonuses: A scene creator grats a special jump height bonus to players who are wearing a wearable that was created by the scene creator.


## Use from SDK7 (TypeScript)

```ts
// Pseudocode, actual API names follow SDK7 conventions
import { engine, Entity, AvatarLocomotion, AvatarLocomotionAnimations } from '@dcl/sdk/ecs'

const me: Entity = engine.PlayerEntity

// Grant a speed boost
AvatarLocomotion.createOrReplace(me, {
  jog_speed: 3.5,
  run_speed: 6.0,
  run_jump_height: 2.0
})
```
