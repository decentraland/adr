---
layout: adr
adr: 215
title: GltfContainer SDK Component
date: 2020-02-20
status: Draft # pick one of these
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
  - pbosio
  - robtfm
---

## Component description

<!-- Human readable description of the component, what does it fix and how it affects the entities or the systems from an SDK user point of view -->

The `GltfContainer` component allows to load GLTF models into the scene. The `GltfContainerLoadingState` component allows to track the loading state of the GLTF model.

## Serialization

<!-- Please complete the follwoing table: -->

```yaml
parameters:
  COMPONENT_ID: 1041
  COMPONENT_NAME: core::GltfContainer
  CRDT_TYPE: LastWriteWin-Element-Set
```

```yaml
parameters:
  COMPONENT_ID: 1049
  COMPONENT_NAME: core::GltfContainerLoadingState
  CRDT_TYPE: LastWriteWin-Element-Set
```

<!-- And provide a complete and commented protobuf serialization for the component -->

```protobuf
message PBGltfContainer {
  // the GLTF file path as listed in the deployed entity
  string src = 1;

  // disable automatic physics collider creation (default: false)
  optional bool disable_physics_colliders = 2;

  // copies the visible meshes into a virtual MeshCollider with CL_POINTER collider_mask (default: false)
  optional bool create_pointer_colliders = 3;
}

// GltfContainerLoadingState is set by the engine and provides information about
// the current state of the GltfContainer of an entity.
message PBGltfContainerLoadingState {
  enum LoadingState {
    UNKNOWN = 0;
    LOADING = 1;
    NOT_FOUND = 2;
    FINISHED_WITH_ERROR = 3;
    FINISHED = 4;
  }

  LoadingState current_state = 1;
}
```

# Semantics

## Version of glTF

The only supported version of [glTF is 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html). The engine MUST NOT support any other version for this component.

## Loading assets

The loading of the glTF will be done by the engine. The `src` property will be used to load the glTF from the deployed entity filesystem ([ADR-80](/adr/ADR-80)).

In the scope of a scene, it is RECOMMENDED that the engine caches the loaded glTF files, so that if the same glTF is used in multiple entities, it is only loaded once. Instancing should be used.

Even though marked as optional by the specification, any protocol that is not `data:` MUST not be supported, i.e. `file://` or `https://`.

The only resolvable assets for the glTF are the ones deployed along with the .gltf/.glb file. Those will be resolved using the same mechanism as the `src` property of the component.

Since `data:` URLs are a bottleneck for parsing resources, it is RECOMMENDED that tooling and engines in "developer mode" warn the scene creators about its performance implications.

### Additional extensions

As per general performance recommendations, every engine and loader SHOULD implement the following extensions:

- [`KHR_materials_basisu`](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md) for texture compression
- KHR_draco_mesh_compression
- EXT_mesh_gpu_instancing
- EXT_meshopt_compression

### Sharing base models with other scenes internally

Due to the fact that the deployments contain hashed assets, it is natural to thing that glTF models inside the engine internally, could be shared across scenes. That is not always true. Here is an example of a scene that uses a glTF model that is not shared with other scenes:

```rust
Scene(Hash="A")
└── "box.gltf"(Hash=0x11111111)
    └── "assets/texture.png"(Hash=0x123123123)

Scene(Hash="B")
└── "box.gltf"(Hash=0x11111111)
    └── "assets/texture.png"(Hash=0xFFFFFFFF)
```

We can clearly see that regardless of the deployed texture, the glTF model remains exactly the same file. This is a common usecase and if caching is applied, the process MUST be aware of all the dependencies of the glTF itself to prevent a vector of attack (poisoning other scene's models with a different texture).

## Animations

### Initial state

All animations in a glTF instance MUST be stopped as the default state.

### Controlling animations

Each entity will have its own animation state. The engine MUST provide a way to control the animations of each entity via the Animator component this will be detailed in the ([ADR-216](/adr/ADR-216)).

## Modifying materials of the models

This version of the component does not specify any way to modify the materials of the models. This is a future work.

## Handling colliders meshes

### Handling `_collider` meshes

All meshes of a node with a name ending in `_collider` will generate internally `MeshCollider`. Those meshes MUST be invisible and the
rest of the properties of the mesh like its position in an animation should be honored. That enables colliders to be animated along with visible meshes. It is RECOMMENDED that all the engines implement a way to visualize the colliders for debugging purposes, making these meshes visible with a distinctive material.

This convention is permanent and is not affected by any flag or configuration.

### Automatic physics colliders

Physics colliders (`ColliderMask.CL_PHYSICS`) are automatically generated based on the `_collider` meshes if the property `disable_physics_colliders == false`.

It is possible that the value of `disable_physics_colliders` is changed at runtime, so the engine SHOULD be able to enable/disable the colliders at runtime.

Skinned meshes are not supported for colliders of any kind.

### Automatic pointer colliders

All visible meshes (not ending in `_collider`) MAY create an internal `MeshCollider` if the property `create_pointer_colliders == true`. This is useful for meshes that are not meant to be colliders but that should still be able to receive pointer events. Those colliders will have the `ColliderMask.CL_POINTER` mask.

The `MeshCollider` will be created with the same properties as the visible mesh, so it will be animated along with the visible mesh.

It is possible that the value of `create_pointer_colliders` is changed at runtime, so the engine SHOULD be able to enable/disable the colliders at runtime.

Skinned meshes are not supported for colliders of any kind.

### Automatic collider based on the model properties

Besides the automatic colliders generated by the engine, it is possible to provide custom colliders with custom masks. This is done by adding a custom property to the glTF file. This is the RECOMMENDED via to provide custom colliders that puts the responsibility of the collider creation in the content creator.

The glTF [extra property](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-extras) named `dcl_collider_mask: uint32` is reserved to the engine and it will be used to generate the collider with the provided mask.

The `dcl_collider_mask` property MUST be a valid `uint32` value. If the value is not valid, the engine MUST ignore it.

To disable all the assumptions made by the engine, the RECOMMENDED values are `create_pointer_colliders := false` and `disable_physics_colliders := true`.

The meshes of node names ending in `_collider` MUST _always_ be invisible. This enables both invisible colliders and visible colliders to operate at once.

The dcl_collider_mask will be used as `MeshCollider.collider_mask` for each mesh if provided, behaviors of `disable_physics` and `enable_pointers` will be additive to the collider_mask when they enable the significant bits.

On the contrary, if `disable_physics == true` the `ColliderMask.CL_PHYSICS` collider bit MUST be disabled for _every_ mesh of the model, overriding it even if defined by the `dcl_collider_mask` extra property.

### Reporting loading state

For cases depending on the complete loading of an asset like calculating raycasts or colliders, the engine MUST provide a way to report the loading state of the glTF. This is done via the `GltfContainerLoadingState` component. The component provides information about the current state of loading using the following properties:

```protobuf
message PBGltfContainerLoadingState {
  enum LoadingState {
    UNKNOWN = 0;
    LOADING = 1;
    NOT_FOUND = 2;
    FINISHED_WITH_ERROR = 3;
    FINISHED = 4;
  }

  LoadingState current_state = 1;
}
```

Where `UNKNOWN` is the default state, `LOADING` is the state when the glTF is being loaded, `NOT_FOUND` is the state when the glTF is not found, `FINISHED_WITH_ERROR` is the state when the glTF finished loading but with errors and `FINISHED` is the state when the glTF finished loading without errors.

This component also represents the instancing state of the glTF. If the glTF is instanced, the `current_state` will be `FINISHED`. Otherwise, the `current_state` will be `LOADING` until the glTF is instanced correctly.

#### Possible errors

The `FINISHED_WITH_ERROR` can be caused by the following errors:

- An asset is not found, including textures, mesh data, etc.
- An extension is not compatible with the engine.

<!-- - Weights are not normalized -->

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
