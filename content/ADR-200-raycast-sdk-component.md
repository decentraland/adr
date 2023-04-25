---
layout: adr
adr: 200
title: Raycasting Component for SDK
date: 2023-03-14
status: Draft # pick one of these
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
  - pbosio
  - pravusjif
  - leanmendoza
  - nearnshaw
---

## Component description

<!-- Human readable description of the component, what does it fix and how it affects the entities or the systems from an SDK user point of view -->

The Raycasting component enables scenes to request raycasting from the game engine. The resulting data will be available in a RaycastResult component associated with the same Entity.

### Raycast Component

The Raycast component initiates the raycasting process by specifying parameters such as origin, direction, and query type. It is attached to the Entity initiating the raycast.

### RaycastResult Component

The RaycastResult component stores the results of the raycasting process, including information about the ray and the intersections with meshes. It is attached to the Entity that initiated the raycast after the raycasting is completed.

## Serialization

Both components `PBRaycast` and `PBRaycastResult` are serialized with protocol buffers.

```yaml
parameters:
  COMPONENT_ID: 1067
  COMPONENT_NAME: core::Raycast
  CRDT_TYPE: LastWriteWin-Element-Set
```

```yaml
parameters:
  COMPONENT_ID: 1068
  COMPONENT_NAME: core::RaycastResult
  CRDT_TYPE: LastWriteWin-Element-Set
```

```protobuf
message PBRaycast {
  // Correlation ID, defined by the scene and used internally by the scene
  uint32 timestamp = 1;

  // How much to offset the starting point of the ray, relative to the
  // entity's transform.
  optional Vector3 origin_offset = 2;

  oneof direction {
    // The direction of the ray in local coordinates (relative to the origin point)
    Vector3 local_direction = 3;

    // The direction of the ray in global coordinates (relative to origin)
    Vector3 global_direction = 4;

    // Target coordinates of the raycast, in global coordinates
    Vector3 global_target = 5;

    // Target entity
    uint32 target_entity = 5;
  }

  // Maximum length of the ray
  float max_distance = 6;

  // the RaycastQueryType behavior
  RaycastQueryType query_type = 7;

  // Indicates the renderer to perform the raycast on every scene tick (ADR-148),
  // otherwise it will be performed only once
  bool continuous = 8;

  // Collision mask, by default all bits are 1 (0xFFFF_FFFF)
  optional uint32 collision_mask = 9;
}

message PBRaycastResult {
  // the timestamp of the Raycast component, used to correlate results
  optional unt32 timestamp = 1;
  // the starting point of the ray in global coordinates
  Vector3 global_origin = 2;
  // the direction vector of the ray in global coordinates
  Vector3 direction = 3;
  // zero or more hits
  repeated RaycastHit hits = 4;
  // number of tick in which the event was produced, equals to EngineInfo.tick_number (ADR-148) + (ADR-219)
  uint32 tick_number = 5;
}

// RaycastHit contains information about the intersection of a ray with a mesh.
// This RaycastHit structure is also re-used by the PointerEvents component
message RaycastHit {
  // Hit position of the raycast in global coordinates
  Vector3 position = 1;

  // Starting point of the ray in global coordinates
  Vector3 global_origin = 2;

  // Direction vector of the ray in global coordinates
  Vector3 direction = 3;

  // Normal of the hit surface in global coordinates
  Vector3 normal_hit = 4;

  // Distance between the ray origin and the hit position, in virtual meters
  float length = 5;

  // Mesh name, if collision happened inside a GltfContainer
  optional string mesh_name = 6;

  // ID of the Entity that has the impacted mesh attached
  uint32 entity_id = 7;
}

// RaycastQueryType indicates whether the ray should stop on the first collition,
// or continue until the max_distance is reached
enum RaycastQueryType {
  RQT_HIT_FIRST = 0;
  RQT_QUERY_ALL = 1;
}
```

## Semantics

A raycast is a spatial query that uses a _ray vector_ with an `origin` and `direction` to identify intersecting meshes.

How Raycasts work will be left outside of this specification since these are well-known tools in 3D engines.

### When are raycasts executed?

As defined in (ADR-148)[/adr/ADR-148], raycasts are executed AFTER all the incoming messages from the scene are processed and AFTER all the physics (like gravity and moving platforms) were executed.

That implies that raycast MUST be executed after the "world matrix" of the entity in which they exist is calculated and not dirty. This is of extreme importance, because the ray takes its origin point based on the _worldMatrix_ of the entity. Many interesting properties are inherited from this design, like raycasts that react to billboard rotations or raycasts that are attached to bones and animations of the avatars.

The origin point and global direction are calculated as follow:

```typescript
// Returns a new Vector3 set with the result of the transformation by the given matrix of the given vector.
declare function TransformCoordinates(position: Vector3, matrix: Matrix): Vector3
// Returns a new Vector3 set with the result of the normal transformation by the given matrix of the given vector.
declare function TransformNormal(normal: Vector3, matrix: Matrix): Vector3

// first calculate the origin of the ray in global coordinates
const globalOrigin = TransformCoordinates(raycast.originOffset ?? Vector3.Zero(), entity.getWorldMatrix())

// and then calculate the global direction in global coordinates
let globalDirection = Vector3.Forward()
if (raycast.localDirection) {
  // then localDirection, is used to detect collisions in a path
  // i.e. Vector3.Forward(), it takes into consideration the rotation of
  // the entity to perform the raycast in local coordinates

  globalDirection = TransformNormal(raycast.localDirection, entity.getWorldMatrix())
} else if (raycast.globalDirection) {
  // this is the simplest one, for example Vector3.Down() to evaluate if
  // there is a floor and how far it is. No matter the local rotation, tilt or yaw
  globalDirection = raycast.globalDirection
} else if (raycast.globalTarget) {
  // this one is to make it easy to point towards a pin-pointed element
  // in global space, like a fixed tower
  globalDirection = Vector3.subtract(raycast.globalTarget, globalOrigin)
} else if (raycast.targetEntity) {
  // this one is to make it easy to point towards another entity in space.
  // i.e. pointing one laser emitter to a receiver and detect if a user
  // collides the laser
  const globalTarget = getGlobalPosition(raycast.targetEntity)
  globalDirection = Vector3.subtract(globalTarget, globalOrigin)
}

globalDirection.normalizeInPlace()
```

### How much times a raycast is executed?

That depends entirely on the `bool continuous` property. If set to `true`, the raycast MUST execute on every scene tick. Otherwise, the raycast MUST execute within the scene tick they were added.

In an ideal scenario in which all messages and raycast are processed within the time window/quota defined in (ADR-148)[/adr/ADR-148], the scenes will receive the raycast result on the next update loop of the ECS. Enabling immediate-mode raycasts like the follwing example:

```typescript
function laserDamageSystem() {
  for (const [entity, _turret] of engine.entitiesWith(LaserTurret)) {
    const result = raycast(entity, Vector3.Forward())
    if (result?.hits.length) {
      // apply damage to all hitted entities
    }
  }
}

// this helper creates sets a Raycast component in the entity and return
// its RaycastResult
function raycast(entity: Entity, direction: Vector3) {
  Object.assign(Raycast.getMutableOrCreate(entity), {
    // relative to the entity's rotation
    localDirection: direction,
    continous: true,
    queryType: ALL,
  })
  return RaycastResult.getOrNull(entity)
}
```

### Usage of the `timestamp` property

The timestamp property is a correlation number, only defined by the scene. The renderer MUST copy the value of the `timestamp` from the Raycast component to the RaycastResult component.

### Usage of the `tick_number` property

The `tick_number` is set to the `EngineInfo.tick_number` of the current frame, as specified by [ADR-148](/adr/ADR-148) and the `EngineInfo` in [ADR-219](/adr/ADR-219). This number is used to correlate the RaycastResult with the frame in which it was produced. Enabling the following use case:

```typescript
function performRaycast(entity: Entity, direction: Vector3): RaycastResult | null {
  const result = RaycastResult.getOrNull(entity)
  const { tickNumber } = EngineInfo.get(engine.RootEntity)

  // is the result from the current frame?
  const haveResult = result && result.tickNumber === tickNumber

  // NOTE: many fields are omitted for brevity and clarity of the example
  Raycast.createOrReplace(entity, { direction, continous: false })

  return haveResult ? result : null
}

function laserSystem() {
  for (const [entity, _laser] of engine.getEntitiesWith(LaserComponent)) {
    const result = performRaycast(entity, Vector3.Forward())
    if (result?.hits.length) {
      // apply damage to all hitted entities
    }
  }
}
```

### Performance considerations

Having multiple continuous raycasts in a scene can significantly impact performance. As a scene developer, it is RECOMMENDED to minimize the number of continuous raycasts. Renderer implementations MUST count the computation of raycasts towards the execution quota of each scene to prevent non-optimized scenes from negatively affecting the overall experience.

### Filtering collision layers

The `collision_mask` parameter allows scene creators to target different layers of elements, including colliders, avatars, visible meshes, UI elements, and more. The flags for this mask are defined in the `ColliderLayer` enum, which is part of the `MeshCollider` component. It is RECOMMENDED that scene creators carefully select the least amount of flags for each raycast to prevent a performance penalty on the engine.

### Kinds of raycasts

There are three types of raycasts, as defined by the `RaycastQueryType` enum:

- `QUERY_ALL`: This type MUST include all intersected elements within the specified `max_distance` parameter.
- `HIT_FIRST`: This type MUST include the first intersected element, which is the closest one to the origin point. It is also subject to the `max_distance` parameter filter.
- `NONE`: This type will not intersect any mesh on the renderer, it will provide an empty result with the final position of the ray and its calculated global direction.

## Use Cases

The Raycasting component can be used in various scenarios within a scene, such as:

- Collision detection: Determine if an object or character is about to collide with another object in the scene.
- Distance calculation: Measure the distance between two points or objects in the scene.
- Line of sight: Determine if a character has a clear line of sight to another character or object in the scene.
- Pathfinding: Assist with navigation and pathfinding for characters or objects in the scene.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
