# Entities V4

## Context and Problem Statement

We need to ensure entities once deployed are always valid and every client knows how to read information. For the time being, entities v3 can be deployed with any information as metadata, which can lead to several issues when something is missing or contains invalid data.

## Decisions

We defined a list of changes to support v4 entities:

- We will define [required schemas][1] for all entity types and every deployment will be validated against them.

- As there will be a transition period between v3 and v4 entities in the content server, when getting the deployments through lambdas we will need to transform any v3 entity into v4 format. Most probably that this change will only be needed for wearables names and descriptions.

- We will validate deployment size per pointer taking into account previous deployments and the final result and not just the current deployment files. This will prevent land owners to exceed the size limits as it happens today.

- We will validate wearables size without taking into account the generated images (thumbnail and image with rarity background) and a new size limit will be set:

  - Total size: 3MB
  - All files size without generated images: 2MB

- We will define a deadline for v3 entities to be deployed.

- We will update every repository where entities types are defined to use [common-schemas][1].

- We will migrate all clients to use v4 entities.

- Explorer will support v4 entities rendering.

## Deadline

V3 entities deadline is: April 1st, 2022
Timestamp (UTC): 1648771200

## Status

Accepted

## Consequences

No v3 entities will be accepted in deployment after the deadline.
Landowners will face new size limits on their parcels. If someone actually exceeds the max size limit and wants to change something on their scene, then they will have to remove files until they respect the new limit size.

[1]: https://github.com/decentraland/common-schemas
