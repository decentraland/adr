---
layout: adr
adr: 254
title: GLTF Nodes
date: 2024-11-27
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

This document describes an approach for making it possible for creators to read and modify the internal structure of an entity with a GLTF component. The SDK has always treated GLTF models as black boxes, but contrary to this a GLTF model can be thought of as a mini-scene.

GLTF Nodes are analogous to entities, each with a Transform, mesh shapes, materials, and colliders.

With a reference to a GLTF node, it's possible to do things like:

- Nest an entity to a node. The entity will move together with any animation movement from the parent entity.
- Add an additional component to a node, for example a PointerEvents component that makes only that mesh clickable, and not the parent model.
- Potentially modify an existing component of that node, for example the material.

# Context

Many of the things that will be possible thanks to this feature have been asked by players for years. For example:

- Make an NPC blink: just swap the _eyes_ texture and back. Today you’d have to have two versions of the whole model, one with the eyes open and one with the eyes closed, and will have to swap the entire model. You’ll likely see the whole model blink, not in the way you want :p
- Tint red for damage: Flash a red tint over a monster’s texture when you hit it.
- Many skins for one mesh: An artist creates a 3D model of a yellow monster. He also creates a red texture that fits the monster with the same mappings. he then creates a scene where monsters spawn randomly. Some are yellow, and some are red. They all share the same .glb file, some swap the texture, making my scenes’s assets weigh a lot less.
- Curved video screens: Play a video texture on a rounded screen, or any shape you can imagine. Today Bence does insane workarounds to compose shapes from multiple planes, with plenty of limitations.
- Elevator: Take a 3d model of an elevator, give the button sub-meshes inside interactive functions. Today you’d have to export and position each button as a separate entity.
- NPC holds a sword: An NPC model could have a child node on its hand, and you could set a sword model as a child of this node. The sword would follow all its animations. You could have 5 variations of different swords, all used by a same NPC. Today you’d have separate models of the whole NPC with each sword or without the sword.
- Attach a camera component to an animated submesh and make cinematic camera movements defined via Blender. Eg: a roller coster, with the trolley’s movements as a Blender animation.

Workarounds for most of the above are prohibitively hard for most creators. Most of those workarounds require very inefficient practices that hurt performance and often look choppy to render.

## Component description

We’ll define a new component: `GltfNode`. A GltfNode links a scene entity with a node from within a gltf, allowing the scene to inspect it or modify it. The `GltfNode` must include:

- A reference to an entity that has a `GltfContainer` component
- A string with a full path to one of the nodes inside the GLTF model of that entity

The creator will need to know the internal node structure of the model.
We can recommend that they either check in Blender or use the [Babylon Sandbox](https://sandbox.babylonjs.com/). In the future we could offer some helpful tools inside the Scene Editor to know the path.

When a scene assigns an entity a GltfNode component, the engine will link the node in the 3D model under the matching path with this entity.

Any changes done to the entity should be reflected by the engine on that node of the 3D model.

- If I add a Material, it will overwrite the material of the node
- If I add any other component, it will be added and affect only that node
- I should also be able to set another entity as child to the entity with the `GltfNode` . It will inherit the position of the node, even following movements from animations.

When we give an entity a `GltfNode` , the engine will also give it `MeshRenderer` , `MeshCollider` , `Material`, and `Transform` components if applicable.

Note: The Transform will be read-only.
The contents of the Material will be approximated as best as possible to what the SDK supports, it may not accurately reflect everything about the material in the GLTF.

### Changes to other components

On the `MeshRenderer` and `MeshCollider` components, add the `GltfMesh` option.

### Loading State

We will include a `GltfNodeState` component, that creators can use to verify if a node has already finished being populated with the components detected on the explorer. It should be similar to that would work similar to the existing `GltfContainerLoadingState`

Note: This component will likely not be part of the initial implementation.

## Serialization

```yaml
parameters:
```

```protobuf

```

## Semantics

### Example
