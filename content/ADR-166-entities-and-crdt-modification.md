---
adr: 166
title: Entity definition and deleted entities set for CRDT
date: 2023-01-09
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - leanmendoza
---

## Abstract
This ADR introduces the last definition of an Entity for SDK7 and also aims to change the ADR-117 CRDT specification adding a rule and a command.

## Context

With the precedent of the ADRs (quote the adrs), the bases for the type of data and the basic rules of consensus between peers were defined. In the framework of the ECS system, the entity is a representative number within a data collection of a certain component and this number was established as a 32-bit positive integer. Up to now, no limit has been established (neither theoretical nor practical mention) on the number of supported entities, but it is inevitable to think that 2^32 of entities is an insane number.

Over the course of a scene, entities can be created and destroyed. Today, the destruction of entities involves their deprecation, since each component will have its history (timestamp > 0), even though it implies a null final state (no data in all components). It is important to highlight it so that there is no conflict in the definition of its state. For example: for the parenting of entities we use the Transform component, and suppose that in entity B we point to entity A. If we destroy entity A, the default behavior will be that entity B re-points to the root entity ( if it was not made explicit that the children of A should be destroyed). If we wanted to reuse the entity A (the number) with another "meaning", it would have an unwanted side effect, since A meant something else in the past.

On the other hand, if we didn't reuse these values but wanted to preserve the state for conflict resolution, for example, an update on a deleted entity, we would have as many states for entities as historically created entities, regardless of the limit of net entities in the same instant.

In summary, both situations present their problems:
  - A) reusing entities presents side-effects in the use and potential problems in the resolution of conflicts
  - B) not reusing entities supposes a memory leak where dead states would be stored

So what needs to be solved is:
- A) The entities MUST be unequivocal, and therefore their numbers: unique identifiers within the scene.
- B) The memory that defines the state of the scene MUST be a function of the number of existing entities at that moment and MUST NOT the number of entities created so far.

## Solution space exploration

In order to provide the versatility of destroying and creating entities, the `version` number is introduced, in this way each time an entity is destroyed the number is released and `version` is incremented by one. Finally, to make the entity unambiguous, the entity is defined as its tuple `<number, version>` regardless of how they are composed.

So, up to here:
1. The entity is no longer defined as a number, but it can continue to be defined as a number made up of the tuple `<number, version>` that composes it and thus be able to satisfy A).
2. The maximum number of coexisting entities will correspond proportionally to the last number used. This satisfies B)

```typescript

type Entity = {
    v: number // entity version
    n: number // entity number
}

const freeEntities: number[] = []
const entitiesVersion: Map<number, number> = new Map()

let counter = 0
function newEntity(): Entity {
    if (freeEntities.size === 0)
        return { n: counter++, v: 0}
    
    const n = freeEntities.pop()
    const v = (entitiesVersion.get(n) || 0) + 1
    entitiesVersion.set(n, v)
    return { n , v }
}

function deleteEntity(entity: Entity) {
    const { n , v } = entity
    freeEntities.push(n)
} 
```

If we create 1,000 entities and then remove and recreate as many times as you want the same amount, always staying below 1,000 , `counter will be equal to 1000`.

## Conflict-free replicated data type (CDRT)
The removed entities free the memory space that the components had reserved, and also, they become entities that will not be used again. To represent this you can use a `Grow-only set` (GSet), which would store each removed entity. In this way it would be straightforward to check if an entity is valid if it has not previously been removed.

The only existing operation so far for CRDTs is `put(key, value, timestamp)`, where `key=<componentId, entityNumber>`, this operation uses a `Last write wins`(LWW) with a series of rules. By the nature of the key, it would now become `key=<componentId, <entityVersion, entityNumber>>` and a new operation would be introduced: `delete_entity(key2)` with `key2=<entityVersion, entityNumber>`.

The LWW rules would be maintained, but the `put` needs to add only one validation, which is:
```ts
function put(key, ...args) {
     if (key in deletedEntitySet) return
     // ... the rest of function
}
```
A `put` operation on an invalid key does not alter the state. 

Then the `delete_entity` operation would be:
```ts
function delete_entity(key2) {
     deletedEntitySet.add(key2)
     clearComponentState(key2)
}
```

Add the entity to the GSet and clear the state for that entity. The GSet, as its name indicates, only has the responsibility of accepting new entities and being able to consult them.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## External links

- https://github.com/decentraland/sdk/issues/500 entities discussion
