---
layout: adr
adr: 153
title: Semantics of entity parenting with ECS-compatible semantics
date: 2022-12-14
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

This document describes the semantics of changing parenting of entities and what happens when an entity in the middle of a branch of the tree is removed. The problem is complex because in an ECS approach, entities are stored in a flat structure, and trees are a synthetic construct for positioning purposes only. The decision is that when an entity in the middle of a branch is removed, all its children will be re-parented to the root entity.

#### Assumptions

- When a `Transform` component doesn't exist in an entity, it is assumed that the entity has a `scale={1,1,1}`.
- Thus, it is safe to assume that a missing `Transform` component has the same rendering semantics than an entity with a `Transform.Identity`.
- And since entities are defined by the set of components and don't exist by themselves, it is safe to assume that all entities have a `Transform.Identity` by default.
- Thus we can deduce that parenting an entity A with a parent B (which doesn't exist, because it doesn't have any components) should have the same semantics as parenting an entity A with a valid parent entity B with a `Transform.Identity` component.

#### When an entity A is added to an entity B but the engine does not know about entity B

- The engine MUST assume that the entity B is valid, even though "it doesn't exist" because no component is registered to it.
- The assumption for the `Transform` component of the entity B is that the entity have a `Transform.Identity` component.

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
---

Appendix

```
Transform.Identity = {
  scale = {1,1,1}
  position = {0,0,0}
  rotation = {0,0,0,1}
  parent = ROOT_ENTITY
}
```

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.