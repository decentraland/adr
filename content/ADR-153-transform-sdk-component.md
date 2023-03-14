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

This document describes the transform component for the SDK, it is used to spatially place things in the world, including the rotation, scaling, positioning and parenting. The semantics of this component also derive the coordinate system of Decentraland explorers. Transform operations are -_as in any of the protocol's CRDT_- commutative and idempotent operations.

## Component description

The transform component is used to calculate the world matrix of each entity in the world. To do so, it provides information about the position, scale parent entity and rotation quaternion.

## Serialization

```yaml
parameters:
  COMPONENT_ID: 1
  COMPONENT_NAME: core::Transform
  CRDT_TYPE: LastWriteWin-Element-Set
```

The Transform component is serialized using a plain-old C struct due to the amount of times it needs to be serialized and deserialized, it uses a fixed memory layout, represented as `TransformComponent` in the following snippet:

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

In any rendering engine, to project the three-dimensional points on a two-dimensional screen, matrix calculations are used. A good summary "one phrase summary" of the following section would be "_the TransformComponent is used to calculate the world matrix of each entity_". To do so, it takes into consideration the parent of the entitites, because scenes in the Decentraland Protocol are a hierarchy of entities. But parenting of entities is a complex for an ECS-based engine, becayse entities are stored in a flat structure, and trees are a synthetic construct for positioning purposes only.

One of the complexities is that rendering engines usually require a acyclic tree-like structure to calculate all the world matrices. Due to the commutative nature of the CRDT messages, there may be scenarios in which, during a window of time, the reflected state of the messages contain cycles in the parenting hierarchy.

The RECOMMENDED implementation path is to move the entities to the root level of the scene while there are parenting cycles. Always prioritizing the best possible performance for the best case scenario (state without cycles). If the scenes are well programmed, after processing all CRDT messages the scene should converge towards a cycle-less DAG starting on the root entity.

To elaborate on the parenting process, we must first introduce how vertex projection works on 3D engines. It is all based on matrix calculations. Starting from an identity matrix, we can translate, scale or rotate the matrix by multiplying the same matrix by a rotated identity or rotated scale matrix, as many times as needed.

The process of calculating the world matrix, allows us to change the reference system for each entity. And it is performed by multiplying the parent entity's world matrix by the current entity's world matrix.

Matrix operations are multiplications, and matrix multiplication are not commutative operations `(a*b) != (b*a)`. This forces every rendering engine to process and traverse the entire tree of the entities from the root entity downwards, using preorder.

And since matrix operations are multiplications, in the cases where there is no Transform component, we must assume _identity_ matrix. Otherwise it would render every position in the `0,0,0` coordinates. The Identity values for the TransformComponent are defined as follow:

```typescript
// the identity transform
Transform.Identity = {
  scale: Vector3(1,1,1),
  position: Vector3(0,0,0),
  rotation: Quaternion(0,0,0,1), // Identity
  parent: ROOT_ENTITY // 0
}
// yields an identity matrix
Matrix4x4.Identity = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1]
]
```

To perform all the calculations consistently, the protocol requires a left-hand coordinate system with the parameters `UP=vec3(0,1,0)` and `FORWARD=vec3(0,0,1)`.

From this reasoning, we get a set of rules:

- When a `Transform` component doesn't exist in an entity, it is assumed that the entity has a `scale={1,1,1} and rotation={0,0,0,1}`.
- Thus, it is safe to assume that a missing `Transform` component has the same rendering semantics than an entity with a `Transform.Identity`.
- And since entities are defined by the set of components and don't exist by themselves, it is safe to assume that all entities have a `Transform.Identity` by default.
- Thus we can deduce that parenting an entity A with a parent B (which doesn't exist, because it doesn't have any components) should have the same semantics as parenting an entity A with a valid parent entity B with a `Transform.Identity` component.

#### When an entity A is added to an entity B but the engine does not know about entity B

- The engine MUST assume that the entity B is valid, even though "it doesn't exist" because no component is registered to it.
- The assumption for the `Transform` component of the entity B is that the entity has a `Transform.Identity` component.

#### When the engine is made aware of the real Transform component of entity B

- It MUST change the default `Transform.Identity` and the change of the matrix calculation of all its children should take it into account.

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
