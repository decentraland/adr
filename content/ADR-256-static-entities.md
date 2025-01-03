---
layout: adr
adr: 256
title: Static Entities
date: 2025-01-03
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

Make it possible for creators to mark an entity as **Static**. Static entities are expected to not change position, perform animations, etc.

Each engine can handle this as they see best, but there are surely many opportunities for optimizing in all cases.

# Context

All game engines have some equivalent concept. Knowing which entities are certain to not move or change over time can enable many engine-side optimizations, these can involve lighting, colliders, etc.

In most scenes, it's common for most of the environment to not need to change over time, and often the environment contains most of the triangles and textures in the scene. For example on Genesis Plaza, we mostly only need to make the NPCs, doors, and elevators non-static.

# Proposal

Add an additional field to the `Transform` component, a `static` boolean. This should be _false_ by default.

If an entity is marked as static, we expect to not see any of the following:

- Any change in the `Transform`
- Any change in `Material`, or if the material has a `VideoTexture`
- Any change in `GltfContainer` or `MeshRenderer`
- Any instruction from `Animator`
- Any instruction from `Tween` or `TweenSequence`
- Any instruction from `Billboard`
- Any change in `Visibility`

If a creator makes the mistake of marking an entity as static but then also does one of the forbidden things listed above, each engine is free to handle that as it wishes. Ideally instructions should be ignored by the engine, to potentially avoid glitchy-looking effects. When this happens, the SDK should print an error message to console.

All static entities should be instanced on the scene's first frame, either as part of a `.composite` file (that is created by interacting with the Creator Hub UI) or instanced on the `main()` function. A static entity should remain static for all of the scene's lifecycle, it can't be removed or switched back to non-static, since several engine optimizations might be relying on this state being permanent.

Note: As an alternative approach, we also discussed handling this via a separate new `Static` component instead of a new field on the `Transform` component. There are pros and cons to each approach.

- On one hand, an extra field on the Transform adds a slight overhead to each update message regarding any transform. (Although if the value of its corresponding protobuff digit is 1, then there should be no Transform updates beyond the initial creation)
- On the other hand, it's easier to creators to find where to add this property if it exists on the Transform. Any object that makes sense to make static will always have a Transform anyway.

# Conclusion

The change to the protocol required is minimal, just one boolean to the already existing Transform. There are however many corner cases to be mindful of.
