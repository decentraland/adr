---
layout: adr
adr: 219
title: Reserved & Static Entities
date: 2023-04-19
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
  - kuruk-mm
  - pravusjif
---

## Abstract

This ADR defines a set of 512 reserved entities that will be used to facilitate communication between the renderer and the scenes.

## Context, Reach & Prioritization

In order to facilitate communication between the renderer and the scenes, a special number of reserved entities are needed. These entities hold no special logic compared to other entities, but they have static IDs that systems can use to share information about the renderer, player, camera, etc.

## Specification

We will reserve 512 static entities numbers, starting at 0. The "0" entity will be the root entity of the scenes, and all other entities will be parented to it by default.

Three static entities are reserved at the moment:

- `RootEntity = 0`
- `PlayerEntity = 1`
- `CameraEntity = 2`

All the components presented in this document MUST be updated at the physics phase of each tick as per [ADR-148](/adr/ADR-148).

### RootEntity

The `Transform` component (READ ONLY) of the RootEntity cannot be modified by any system. All updates coming from the scene are ignored and have no effect.

The `UiCanvasInformation` component (READ ONLY) of the RootEntity MUST be set by the renderer to inform the scene about the current canvas size and the current UI scale. This component is described in the [ADR-124](/adr/ADR-124).

The `EngineInformation` component (READ ONLY) of the RootEntity contains information about the current frame number, tick number and total elapsed time counters. The component MUST be updated by the renderer each frame.

The `RealmInformation` component (READ ONLY) of the RootEntity contains information about the current realm: base URL, realm name, network ID, comms adapter, preview status, room info.

The `PrimaryPointerInformation` component (READ ONLY) of the RootEntity contains screen coordinates, screen delta, and world ray direction for the pointer.

### PlayerEntity

The `Transform` component (READ ONLY) of the PlayerEntity is updated by the renderer and cannot be modified by any system. All updates coming from the scene are ignored and have no effect.

The `AvatarBase` component (READ ONLY) of the PlayerEntity contains player name, body shape URN, skin color, eyes color, hair color.

The `AvatarEquippedData` component (READ ONLY) of the PlayerEntity contains lists of wearable URNs and emote URNs.

The `PlayerIdentityData` component (READ ONLY) of the PlayerEntity contains player address and guest status.

### CameraEntity

The `Transform` component (READ ONLY) of the CameraEntity is updated by the renderer and cannot be modified by any system. All updates coming from the scene are be ignored and have no effect.

The `PointerLock` component (READ & WRITE) presence signals the status of the pointer-locking of the renderer.

The `CameraMode` component (READ ONLY) is updated by the renderer with the current camera mode.

The `MainCamera` component (READ & WRITE) contains any virtual camera entity reference. In conjunction with the `VirtualCamera` component put on the referenced entity, cinematic sequences can be achieved.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
