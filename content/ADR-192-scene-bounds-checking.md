---
layout: adr
adr: 192
title: Scene Bounds Checking
date: 2023-03-02
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - pravusjif
---

## Abstract

This document describes the solution implemented for checking entities and meshes against their scene bounds and how the current reference client (Unity) reacts to the inside/outside scene bounds status, in preview mode and in production.

## Needs

The Decentraland reference client loads contiguous scenes from different creators instead of isolated scenes, and because of that, it's completely possible for a creator to instantiate or move entities outside their scene bounds, thus occupying LAND they don't own or bothering the experiences happening in neighbouring scenes.

That's why the client has to detect when an entity or its visual components (meshes) get outside their scene bounds and react as soon as possible:
- Detect an entity instantiated/moving inside/outside its scene bounds
- Detect an entity mesh instantiated/moving inside/outside its scene bounds
- React applying some kind of effect to the affected entities/meshes

There's an important difficulty regarding the scene bounds checking that makes it a problem more difficult to solve than it seems at first sight, and that is the existence of "irregular-shaped scenes": scenes that consist of 3 or more parcels that are not "in line" (e.g. "L-shaped" scenes).

Some examples of these kind of irregular-shaped scenes are:
<figure>
  <img src="/resources/ADR-192/irregular-shaped-scene-example-1.png" />
  <img src="/resources/ADR-192/irregular-shaped-scene-example-2.png" />
</figure>

## Solutions explored with no success
### Discarding out-of-bounds pixels in Shader

A proposed solution to inform the shader currently used to render all meshes in-world about every rendered mesh's scene world bound limits and discard the pixels that get outside those limits.
Since that would only affect visual components, non-visual components (e.g. AudioSource component) would be handled with localized checks.

A POC was implemented successfully but the final results showed degraded performance due to having to disable other rendering optimizations (draw call optimizations, SRP Batcher) to enable the shader approach, this was documented at https://github.com/decentraland/unity-renderer/issues/3494#issuecomment-1331867872 .

### Using native collision triggers per parcel

A proposed solution for having 1 trigger collider for every parcel and a collider on every entity (that would dynamically re-shape based on the visual components attached to the entity), then based on the collisions between the entity collider and the parcel triggers the system would apply the desired effect on entities entering/exiting the scene bounds.

A couple of POCs were implemented successfully, but having to use MeshColliders to deal with "irregular-shaped" scenes (e.g. "L-shaped" scenes) degraded performance a lot and the approach proved to be unusable, this was documented at https://github.com/decentraland/unity-renderer/issues/2433 .

## Current solution implementation
explorer version: [1.0.98702-20230404101340.commit-ffe898a](https://github.com/decentraland/unity-renderer/pull/4838)

### SDK6 Scene Boundaries Checker

for SDK6 scenes a [SceneBoundariesController](https://github.com/decentraland/unity-renderer/blob/05c9abdbf1e55bf33817e890ce56d65fb51dd66a/unity-renderer/Assets/Scripts/MainScripts/DCL/WorldRuntime/SceneBoundariesController/SceneBoundsChecker.cs) object has a dynamic collection of entities to be checked against their scene bounds and runs frequently traversing that collection evaluating each one of those entities and then removing them from the collection.

The entities to be checked are added to the SBC collection based on certain events like being moved, or having its mesh updated.

If the entity changes its out-of-bounds state then it's affected by the system:
- Is out of scene bounds: the relevant components are disabled (production) or the visual components are covered by a red wireframe (preview mode)
- Is inside scene bounds: the relevant components are enabled (production) or the visual components red wireframe is removed (preview mode)

This implementation has a CPU Throttling optimization to avoid running the SBC too frequently.

More implementation details can be found at markdown document in the unity-renderer repo docs: https://github.com/decentraland/unity-renderer/blob/88d73d42e42fd2990c81614c22947c1887b0df28/docs/scene-boundaries-checking.md

### SDK7 Scene Bounds Checker

Following the ECS pattern, the current implemented solution for SDK7 scenes relies on having:
- An [ECS Scene Bounds Checker system](https://github.com/decentraland/unity-renderer/blob/88d73d42e42fd2990c81614c22947c1887b0df28/unity-renderer/Assets/DCLPlugins/ECS7/Systems/SceneBoundsCheckerSystem/ECSSceneBoundsCheckerSystem.cs)
- An [internal ECS Component](https://github.com/decentraland/unity-renderer/blob/88d73d42e42fd2990c81614c22947c1887b0df28/unity-renderer/Assets/DCLPlugins/ECS7/InternalECSComponents/Interfaces/InternalECSComponentModels.cs#L78~L87) to track the SBC relevant data on the relevant entities, that is attached when relevant components are attached to an entity.

The Scene Bounds Checker (SBC) System runs through every entity with the `InternalSceneBoundsCheck` component and if that component's data has changed since the last check then the system evaluates either the entity's world position or its mesh bounds (if it has any visual component) against the scene bounds.

If the entity changes its out-of-bounds state then it's affected by the system:
- Is out of scene bounds: the relevant components are disabled (production) or the visual components are covered by a red wireframe (preview mode)  
- Is inside scene bounds: the relevant components are enabled (production) or the visual components red wireframe is removed (preview mode)

Specific implementation details can be found in its implementation Pull Request description: https://github.com/decentraland/unity-renderer/pull/3965

### Common optimization for SDK6 & SDK7: Outer Bounds Check

This refers to a cheap check run first against the "outer bounds" of a scene before getting into the more costly check based on its individual parcels, so entities that are way out of bounds (by its position, mesh size, etc.) can be quickly detected and affected without further checks. If the outer bounds check passes, then the inner bounds checks are run.

<figure>
  <img src="/resources/ADR-192/scene-top-down.png" />
  <img src="/resources/ADR-192/scene-inner-bounds.png" />
  <img src="/resources/ADR-192/scene-outer-bounds.png" />
</figure>

## Specification

- Meshes refer to rendered 3D models
- Entities refer to the scene SDK entities that contain components (visual or not)

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
