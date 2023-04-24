---
layout: adr
adr: 219
title: Reserved & Static Entities
date: 2023-04-19
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
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

### RootEntity

The `Transform` component of the RootEntity cannot be modified by any system. All updates coming from the scene MAY be ignored or have no effect.

The `UiCanvasInformation` component of the RootEntity MUST be set by the renderer to inform the scene about the current canvas size and the current UI scale. This component is described in the [ADR-124](/adr/ADR-124)

The `EngineInformation` component of the RootEntity MUST be set by the renderer to inform the scene about information of the engine.

### PlayerEntity

The `Transform` component can be READ/WRITE from the scene. Under normal circumstances, the `Transform` updates will be ignored by the renderer, but it is possible to override the player position when the scene is in control of the `PlayerEntity`, this behavior is yet to be formalized.

### CameraEntity

The `Transform` component can be READ/WRITE from the scene. Under normal circumstances, the `Transform` updates will be ignored by the renderer, but it is possible to override the camera position when the scene is in control of the `CameraEntity`, this behavior is yet to be formalized.

The Cinematic Camera will be implemented applying components to the `CameraEntity`. The Cinematic Camera is still in the design phase.

The `PointerLocked` component (READ ONLY) presence signals the status of the pointer-locking of the renderer.

The `WindowIdle` component (READ ONLY) presence signals if the renderer is in background-mode or it is actively rendering.

The `CameraMode { mode = ThirdPerson/FirstPerson }` component is used to get the current camera mode; it is only set from the Renderer.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
