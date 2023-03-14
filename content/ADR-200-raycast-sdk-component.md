---
layout: adr
adr: 200
title: Raycast SDK Component
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

The Raycast component allows scenes to request raycasting from the game engine. The results will be available in a RaycastResult component set later on the same Entity.

Since this specification requires two components, both are defined in the same document.

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
  // entity's transform. This field is
  optional Vector3 origin_offset = 2;

  oneof direction {
    // The direction of the ray in local coordinates (relative to the origin point)
    Vector3 local_direction = 3;

    // The direction of the ray in global coordinates (relative to origin)
    Vector3 global_direction = 4;

    // Target coordinates of the raycast, in global coordinates
    Vector3 global_target = 5;
  }

  // Maximum length of the ray
  float max_distance = 6;

  // the RaycastQueryType behavior
  RaycastQueryType query_type = 7;

  // Indicates the renderer to perform the raycast on every scene tick (ADR-148), otherwise it will be performed only once
  bool continuous = 8;

  // Collision mask, by default all bits are 1 (0xFFFF_FFFF)
  optional uint32 collision_mask = 9;
}

message PBRaycastResult {
  // the timestamp of the Raycast component, used to correlate results
  int32 timestamp = 1;
  // the starting point of the ray in global coordinates
  Vector3 global_origin = 2;
  // the direction vector of the ray in global coordinates
  Vector3 direction = 3;
  // zero or more hits
  repeated RaycastHit hits = 4;
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

  // Entry vector of the ray into the collision mesh (in global coordinates)
  Vector3 normal_hit = 4;

  // Distance between the ray origin and the hit position, in virtual meters
  float length = 5;

  // Mesh name, if collision happened inside a GltfContainer
  optional string mesh_name = 6;

  // ID of the Entity that has the impacted mesh attached
  uint32 entity_id = 7;
}

// RaycastQueryType indicates whether the ray should stop on the first collition, or continue.
enum RaycastQueryType {
  RQT_HIT_FIRST = 0;
  RQT_QUERY_ALL = 1;
}
```

## Semantics

A Raycast is a spatial query that utilizes a _ray vector_ with an `origin` and `direction` to fetch the colliding meshes.

How Raycasts work will be left outside of this specification since these are well-known tools in 3D engines.

### When are raycasts executed?

As defined in (ADR-148)[/adr/ADR-148], raycasts are executed AFTER all the incoming messages from the scene are processed and AFTER all the physics (like gravity and moving platforms) were executed.

That implies that raycast MUST be executed after the "world matrix" of the entity in which they exist is calculated and not dirty. This is of extreme importance, because the ray takes its origin point based on the _worldMatrix_ of the entity. Many interesting properties are inherited from this design, like raycasts that react to billboard rotations or raycasts that are attached to bones and animations of the avatars.

The origin point and global direction are calculated as follow:

```typescript
// first calculate the global origin of the raycast
const globalOrigin = entity.worldMatrix.multiply(vec4(raycast.originOffset.xyz, 1))

// and then calculate the global direction, relative to the
let globalDirection = Vector3.Forward()
if (raycast.globalDirection) {
  // this is the simplest one, for example Vector3.Down() to evaluate if
  // there is a floor and how far it is. No matter the local rotation, tilt or yaw
  globalDirection = raycast.globalDirection
} else if (raycast.localDirection) {
  // then localDirection, is used to detect collisions in a path
  // i.e. Vector3.Forward(), it takes into consideration the rotation of
  // the entity to perform the raycast in local coordinates

  const globalTarget = entity.worldMatrix.multiply(vec4(raycast.localDirection.xyz, 1)) as Vector3
  globalDirection = globalTarget.subtract(globalOrigin)
} else if (raycast.globalTarget) {
  // this one is to make it easy to point towards a pin-pointed element
  // in global space, like a fixed tower
  globalDirection = raycast.globalTarget.subtract(globalOrigin)
}
```

### How much times a raycast is executed?

That depends entirely on the `bool continuous` property. If set to `true`, the raycast must execute on every scene tick. Otherwise, the raycast must execute within the scene tick they were added.

In an ideal scenario in which all messages and raycast are processed within the time window/quota defined in ADR-148, the scenes will receive the raycast result on the next update loop of the ECS. Enabling immediate-mode raycasts like the follwing example:

```typescript
function system() {
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

The timestamp property is a correlation number, only defined by the scene. The renderer must copy the value of the `timestamp` from the Raycast component to the RaycastResult component.

### Performance considerations

Having multiple continuous raycasts in a scene may have a big performance penalty. As a scene developer, it is RECOMMENDED to keep this number at minimum. As a renderer implementator, the compute of raycasts MUST count towards the execution quota of each scene to prevent a non-optimized scene from affecting the overall quality of the experience.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
