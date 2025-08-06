---
layout: adr
adr: 258
title: Trigger Areas
date: 2025-02-19
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

## Abstract

This document describes an approach for implementing native trigger areas in creator scenes. Triggers are a fundamental feature of game development that should be available as a core engine capability rather than requiring external dependencies. Currently, creators must rely heavily on the Utils library for this essential functionality, which presents several significant limitations:

- **Performance degradation**: The library implementation results in bad performance and slower SDK ticks due to its non-native approach
- **Shape constraints**: Triggers are restricted to box colliders only, limiting creative possibilities  
- **Developer experience**: The current approach is not easy on the creator and requires additional library dependencies
- **Architectural limitations**: As a library solution, it cannot leverage engine-level optimizations or native collision detection

The native engine implementation addresses these issues by providing:
- Better performance through engine-level integration with the existing collision system
- Support for any arbitrary shape from 3D models using mesh colliders, not just primitive shapes
- Seamless integration with existing components like MeshCollider and ColliderLayer
- A friendlier developer experience through helper functions similar to our pointerEvents system
- Native support for multiple trigger layers and collision detection

This new approach enables creators to define trigger areas using any collider shape - from simple primitives to complex meshes from GLTF models - and react to enter, exit, and stay events when entities on specific collision layers overlap with them.

## Trigger areas

Trigger areas are a region in the scene that trigger an action whenever something overlaps with them (usually the player, but not necessarily). We can also trigger actions continuously while something keeps overlapping (on each frame), or when it stops overlapping.

The shape of a trigger area is given by a collider. It can use a simple primitive shape, or it can even take any arbitrary shape from a 3D model.

We will create a new component for this, called `TriggerArea`. It will have the following fields:

- `mesh`: An object similar to the one used for [MeshCollider](https://github.com/decentraland/protocol/blob/main/proto/decentraland/sdk/components/mesh_collider.proto#L33), that allows to define the shape of the trigger area.
- `triggerLayer`: The collision layer that triggers the trigger


### Collision layers

Trigger areas can only be triggered by entities on certain _collision layers_. We should reuse the `ColliderLayer` enum for this.

Most of the time you want to check for just the position of the player, so we should have a collision layer dedicated to this, and it should be the default of any Trigger component. This new layer should be added to the `ColliderLayer` enum.

The `ColliderLayer` enum should have the following values:

- `CL_NONE`: No layer, the trigger area will not trigger any events
- `CL_POINTER`: The default layer for any pointer events
- `CL_PHYSICS`: The default layer for all entities with a physics collider
- `CL_CUSTOM1`: A custom layer for any other object that can move around the scene
- `CL_CUSTOM2`: A custom layer for any other object that can move around the scene
- `CL_CUSTOM3`: A custom layer for any other object that can move around the scene
- `CL_CUSTOM4`: A custom layer for any other object that can move around the scene
- `CL_CUSTOM5`: A custom layer for any other object that can move around the scene
- `CL_CUSTOM6`: A custom layer for any other object that can move around the scene
- `CL_CUSTOM7`: A custom layer for any other object that can move around the scene
- `CL_CUSTOM8`: A custom layer for any other object that can move around the scene
- `CL_PLAYER`: The default layer for the player

A single trigger area can have multiple trigger layers at once, similarly to how collision layers work on colliders.

When using the `POINTER` layer, the trigger area will trigger events when the pointer is hovered over it, in the same way that ON_HOVER events from the PointerEvents component work.

When using the `PHYSICS` layer, the trigger area will trigger events when any entity with a physics collider overlaps with it.

### Trigger events

Trigger areas can trigger events when the player (or any other entity on the trigger layer) enters, exits or stays in the area.

Trigger events would have to be shared from the engine to the SDK via a component, following a similar approach as we do with pointer events and raycasts. We should create a `TriggerCollisionResult` component. Creators are not expected to read values or make use of this component in any way, unless they really want to fine tune their scene’s behavior.

This component will be added by the engine, similarly to how pointer events are handled. The event will be triggered when the entity enters, exits or stays in the area. Each event will have the following fields:

- `triggeredEntity`: The entity that was triggered (this is the entity that owns the trigger area)
- `state`: The state of the trigger event (ENTER, EXIT, STAY)
- `timestamp`: The timestamp of the trigger event
- `trigger`: An object with the following fields:
  - `entity`: The entity that triggered the trigger
  - `layer`: The collision layer of the entity that triggered the trigger (this is the same as the trigger layer of the trigger area)
  - `position`: The position of the entity that triggered the trigger
  - `rotation`: The rotation of the entity that triggered the trigger
  - `scale`: The scale of the entity that triggered the trigger



### Code helpers

Even though at a low-level data travels in an ECS way, we should offer a friendlier way to deal with this for creators. This is the same approach we already use with pointer events and raycasts.

We’ll create a system and helper functions for reacting to a trigger events from a trigger area, similar to our [pointerEvents](https://docs.decentraland.org/creator/development-guide/sdk7/click-events/) system

- `onTriggerEnter`
- `onTriggerExit`
- `onTriggerStay`

It will look something like this:

```ts
triggerEventsSystem.OnTriggerEnter(
    {
      entity: myTrigger,
      opts: {
        layer: Player
      }
    },
    function (otherEntity) {
      // Do whatever I want
    }
  )
```

## Triggers embedded in 3D models


It should also be possible to create trigger areas embedded into 3D models. If a mesh in a 3D model has a name that contains the string `_trigger`, it will be considered a trigger area.



## Serialization

```yaml

```

```protobuf

```

## Semantics

### Example

Low level:

```ts
function TriggerReadingSystem() {
  const triggeredEntities = engine.getEntitiesWith(TriggerCollisionResult)
  for (const [entity] of triggeredEntities) {

    const result = TriggerCollisionResult.getOrNull(entity)
    if(result){
      console.log("TRIGGER EVENT DATA:", result.commands)
    }
  }
}

engine.addSystem(TriggerReadingSystem)
```

High level:

_Option 1: Using the TriggerArea component_
```ts
const myTrigger = engine.addEntity()

MeshCollider.setBox(myTrigger, {collisionMask: ColliderLayer.CL_PHYSICS})

TriggerArea.setBox(myTrigger, {layer:TriggerLayer.TL_PLAYER })

Tramsform.create(myTrigger)
```

_Option 2: Using the triggerEventsSystem_
```ts
const myTrigger = engine.addEntity()

MeshCollider.setBox(myTrigger, {collisionMask: ColliderLayer.CL_PHYSICS})

Tramsform.create(myTrigger)
triggerEventsSystem.OnTriggerEnter(
    {
      entity: myTrigger,
      opts: {
        layer: Player
      }
    },
    function (otherEntity) {
      // Do whatever I want
    }
  )
```
