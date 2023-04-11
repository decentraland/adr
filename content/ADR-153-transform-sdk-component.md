---
layout: adr
adr: 153
title: Transform SDK component
date: 2022-12-14
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

This document describes the Transform component for the SDK, which is used to spatially place objects in the Decentraland virtual world. It covers rotation, scaling, positioning, and parenting. The semantics of this component also derive the coordinate system of Decentraland explorers. Transform operations are -_as in any of the protocol's CRDT_- commutative and idempotent operations.

## Component description

The TransformComponent is a method for instructing the rendering engine how to position, rotate, and scale elements in 3D space. It allows users to provide position, rotation, and scale components, as well as the parent entity, enabling the creation of a hierarchy. Within this hierarchy, the reference system is transformed to assume the zero of coordinates, scale, and rotation as instructed by the parent's Transform component. We call this the "local coordinate system".

## Serialization

```yaml
parameters:
  COMPONENT_ID: 1
  COMPONENT_NAME: core::Transform
  CRDT_TYPE: LastWriteWin-Element-Set
```

The Transform component is serialized using a plain-old C struct due to the frequent need for serialization and deserialization. It uses a fixed memory layout, represented as TransformComponent in the following snippet:

```c++
struct Vector3 {
  float x, y, z;
};
struct Quaternion {
  float x, y, z, w;
};
struct TransformComponent {
  Vector3 position;
  Quaternion rotation;
  Vector3 scale;
  unsigned int parentEntityId;
}
```

All fields are encoded in little-endian.

## Semantics

In any rendering engine, to project three-dimensional points onto a two-dimensional screen, matrix transformations are used. To calculate an entity's "world matrix," the TransformComponent's position, rotation, and scale components are used, taking into consideration the parent entity's "world matrix". However, parenting of entities is complex for an ECS-based engine because entities are stored in a flat structure, and trees are a synthetic construct for positioning purposes only.

One complexity is that rendering engines typically require an acyclic tree-like structure to calculate all world matrices. Due to the commutative nature of the CRDT messages, there may be scenarios where, during a window of time, the reflected state of the messages contains cycles in the parenting hierarchy.

The RECOMMENDED implementation path is to move entities to the root level of the scene while there are parenting cycles, prioritizing the best possible performance for the best-case scenario (state without cycles). If scenes are well programmed, processing all CRDT messages should lead to the scene converging towards a cycle-less DAG starting on the root entity.

To elaborate on the parenting process, we must first introduce how vertex projection works in 3D engines. It is based on matrix calculations. Starting from an identity matrix, we can translate, scale, or rotate the matrix by multiplying it by a translated identity or rotated scale matrix, as many times as needed.

The process of calculating the world matrix allows us to change the reference system for each entity. It is performed by multiplying the parent entity's world matrix by the current entity's world matrix.

Matrix operations are multiplications, and matrix multiplication is not commutative `(a*b) != (b*a)`. This forces every rendering engine to process and traverse the entire tree of entities from the root entity downward, using preorder.

Since matrix operations are multiplications, in cases where there is no Transform component, we must assume an _identity_ matrix. Otherwise, it would render every position at the `0,0,0` coordinates. The Identity values for the TransformComponent are defined as follows:

```typescript
// the identity transform
Transform.Identity = {
  scale: Vector3(1, 1, 1),
  position: Vector3(0, 0, 0),
  rotation: Quaternion(0, 0, 0, 1), // Identity
  parent: ROOT_ENTITY, // 0
}
// yields an identity matrix
Matrix4x4.Identity = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]
```

To perform all calculations consistently, the protocol requires a left-hand coordinate system with the parameters `UP=vec3(0,1,0)` and `FORWARD=vec3(0,0,1)`.

From this reasoning, we derive a set of rules:

- When a `Transform` component does not exist in an entity, it is assumed that the entity has a `scale={1,1,1}` and `rotation={0,0,0,1}`.
- Thus, it is safe to assume that a missing `Transform` component has the same rendering semantics as an entity with a `Transform.Identity`.
- Since entities are defined by the set of components and do not exist by themselves, it is safe to assume that all entities have a `Transform.Identity` by default.
- We can deduce that parenting entity A with parent B (which does not exist because it does not have any components) should have the same semantics as parenting entity A with a valid parent entity B with a `Transform.Identity` component.

#### When an entity A is added to an entity B, but the engine does not know about entity B

- The engine MUST assume that entity B is valid, even though "it does not exist" because no component is registered to it.
- The assumption for the `Transform` component of entity B is that the entity has a `Transform.Identity` component.

#### When the engine is made aware of the real Transform component of entity B

- It MUST change the default `Transform.Identity`, and the change in the matrix calculation of all its children should take it into account.

#### Complex scenario

After creating and emparenting entities with explicit transform in the form:

```
ROOT_ENTITY
  └── A
      └── B
          └── C
              └── D
                  └── E
                      └── F
```

- After removing the `Transform` component from entity D, the engine should assume entity D has a `Transform.Identity` component.
- Since the `Transform.Identity` component has `parent=ROOT_ENTITY`, the rendering tree now looks like:

```
ROOT_ENTITY
  ├── A
  │   └── B
  │       └── C
  └── D
      └── E
          └── F
```

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
