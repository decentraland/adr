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

This document describes an approach for making it possible for creators to use native trigger areas in their scenes. 
Our SDK never included this essential feature, so creators have relied heavily using the Utils library. Triggers in this library are implemented with an approach that has bad performance and is not so easy on the creator, and also has its limits.

This new approach results in better performance and a better developer experience. It also allows for more freedom, as the trigger areas can now be any shape, not just a box.

## Trigger areas

Trigger areas are a region in the scene that trigger an action whenever something overlaps with them (usually the player, but not necessarily). We can also trigger actions continuously while something keeps overlapping (on each frame), or when it stops overlapping.

The shape of a trigger area is given by a collider. It can use a simple primitive shape, or it can even take any arbitrary shape from a 3D model.

To repurpose a collider as a trigger area, we will need to add a new `isTrigger` property to both `MeshCollider` and `GLTFContainer`.

When this property is set to true, the collider will no longer perform physics calculations, but will instead trigger events.

Any GLTFContainer with a visible 3D model will keep being visible, but its collider geometry will stop blocking the player and will stop intercepting button events.

### Collision layers

Trigger areas can only be triggered by entities on certain _collision layers_. Most of the time you want to check for just the position of the player, so we should have a collision layer dedicated to this, and it should be the default. But other times, you may want to check for other objects such as NPCs or any other object that can move around the scene. For this we can leverage the already existing `ColliderLayer` enum on our SDK.

When a collider is configured to behave as a trigger, the `collisionMask` property (on [meshCollider](https://github.com/decentraland/protocol/blob/main/proto/decentraland/sdk/components/mesh_collider.proto#L33) & [gltfContainer](https://github.com/decentraland/protocol/blob/main/proto/decentraland/sdk/components/gltf_container.proto#L17~L18)) changes its purpose. Instead of determining what collision layers it collides with, now it controls what collision layers can trigger it. So if `collisionMask` is set to `ColliderLayer.CL_PHYSICS`, any object that has a collider on this layer will set off the trigger.

Most of the time, creators only want to detect triggers from the player, not from any object with a collider. The default configuration should just listen to the player, in case there’s no explicit value for `collisionMask`. 

We’ll need to assign the player a value in the `ColliderLayer` enum. We should either use 2 of the reserved collider layers (1 for main player only and another for any player) [here](https://github.com/decentraland/protocol/blob/main/proto/decentraland/sdk/components/mesh_collider.proto#L44~L62) at protocol level or introduce 2 new ones in that enum.

### Low level

Trigger events would have to be shared from the engine to the SDK via a component, following a similar approach as we do with pointer events and raycasts. We should create a `TriggerCollisionResult` component.

Creators are not expected to read values or make use of this component in any way, unless they really want to fine tune their scene’s behavior.

The result component will have the following fields:

- `triggeringEntity`: The entity that triggered the trigger
- `triggeringCollisionLayer`: The collision layer of the entity that triggered the trigger



### Code helpers

Even though at a low-level data travels in an ECS way, we should offer a friendlier way to deal with this for creators. This is the same approach we already use with pointer events and raycasts.

We’ll create a system and helper functions for reacting to a trigger events from a trigger area, similar to our [pointerEvents](https://docs.decentraland.org/creator/development-guide/sdk7/click-events/) system

- `onTriggerEnter`
- `onTriggerExit`
- `onTriggerStay`



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

```ts
const myTrigger = engine.addEntity()

MeshCollider.setBox(myTrigger, {isTrigger:true })

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
