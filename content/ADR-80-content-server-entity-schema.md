---
adr: 80
date: 2022-09-18
title: Entity schema & virtual file system
status: Living
authors:
  - menduz
type: Standards Track
spdx-license: CC0-1.0
---

## Abstract

This document describes the schema for entities to be deployed, synchronized and stored for the content servers. The entity schema is consistent across all services of Decentraland.

Entities are the representation in files of blockchain assets like LAND, ESTATE, NAME, Wearables or Emotes.

Entities are unique and immutable because their content is hashed using IPFS CIDv2. Uploading new versions of entities is possible via full replacement of the old entities. We call this upload+update process a _Deployment_.

## File system

Entities define a list of files to be deployed to content servers. These files conform the file system of the entity, used by model loaders or scenes when the resources of the entities need to be accessed.

The Decentraland Filesystem is case insensitive, that means `FOlDER/A.PNG` and `folder/a.PNG` are the same file. The resolution of conflicts is resolved via lower-casing the `.content.file` property of the entities. This MUST also be checked at deployment time as part of the entity validations.

## Pointers

To resolve a LAND position or Wearable URN to a specific deployment, content servers use the `Entity#pointers` array which is also used to perform the Deployment validations [ADR-45](/adr/ADR-45).

When the deployments are accepted by the content server, the newest MUST replace the pointee value of the global pointers map of the content server. This is the mechanism used to fetch the latest version of an entity in a specific location or for a specific wearable.

### Schema

```typescript
// Represents an entity that can be signed and deployed
type DeployableEntity = {
  version: "v3"
  type: string // scene, wearable, emote
  pointers: string[]
  timestamp: number
  content: ContentMapping[]
  metadata?: any
}

// Represents an entity that is already deployed in the content server
type Entity = DeployableEntity & {
   // IPFSv2 CID of the string JSON representation of a DeployableEntity
  id: string
}

// Entry of the Decentraland Filesystem
type ContentMapping = {
  file: string
  hash: string // IPFSv2 CID
}
```
