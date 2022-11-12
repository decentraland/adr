---
layout: doc
adr: 82
date: 2022-10-06
title: Mesh name of pointer events for GLTF in ECS7
status: Draft
authors:
  - gonpombo8
  - kuruk-mm
  - leanmendoza
  - menduz
  - nearnshaw
  - pbosio
  - pravusjif
type: Standards Track
spdx-license: CC0-1.0
---

## Context of the problem

In ECS6 the pointer events of GLTF have a `meshName: string` field that works for all meshes, that is because the raycasts for the clicks intersected all meshes in the GLTF.

In the new version of the ECS, the `GltfContainer` component have different semantics. Only meshes postfixed with `_collider` will be intersectable by raycasts.

The question that we are evaluating in this ADR is: "Which mesh name is going to be sent back to the scene?"

A key consideration must be the compatibility with ECS6 for all the time the adaptation layer lives. The adaptation layer should effortlessly mock the same behavior of the ECS6.

## Alternatives

### Alternative 1

Send the name of the collider mesh in the raycast event. This option would require explicit colliders. The name of the field will be `hitName: string`.

This is different to ECS6 because if no colliders are present in the GLTF, the loader automatically assigns the visible meshes to the collider, inheriting the name of the real meshes for the raycast.

### Alterlative 1.bis ✅

Send the name of the collider mesh in the raycast event. This option would require explicit colliders. The name of the field will be `hitName: string`

To surround the compatibility problem with ECS6, a new `GltfContainerCompatibility` component can be created to mock the same behavior of the ECS6. This component would be hidden to the end-user to only be used by the Adaptation Layer.

### Alternative 2

Add a new `EntityName(name: string)` component to any entity, and in each raycast hit bubble up until an entity has a `EntityName(name: string)` and use that one for the event.

Implementation: For entities created by the user, `EntityName(name: string)` should be manually added.

For the GltfContainer, the name of the parent node will be considered and added to the internal entity of the GltfScene.

## Open questions

- Do colliders accept GLTF animations? This must work to maintain compatibility
