---
layout: doc
adr: 51
date: 2022-02-02
title: Catalyst Content validations
status: ACCEPTED
authors:
- agusaldasoro
- guidota
- menduz
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

Catalysts receive entity deployments that will be stored and distributed among them. Some validations are executed for each entity deployment, depending on the context and entity type.

Most validations need information about the Catalyst content state and external dependencies like The Graph, which makes them very hard to predict, i.e. we can't ensure an entity deployment will be correct without validating it in a given context.

On the other hand, we have some stateless validations that may be useful to run before actually doing a deployment, like metadata schema and hashes validations.

Adding an entity type to a Catalyst requires a tedious effort which envolves defining schemas, relations and validations in different repositories.

For instance, adding a validation to the Catalyst can be overwhelming for a developer from outside the Platform team.

## Decision

Validations will be moved to a library that will not depend on any other than definitions like schemas and types.

The library will require a set of functions, defined in an interface, to perform validations of the entities. Such functions will be needed to interact with the outside world i.e. The Graph.

Needless to say, the content servers and potentially other tools (like the builder or the cli) will provide these functions to run validations anywhere.

All validations will know this context and will decide if must do something different, but no validation list per context will exist, i.e. all validations will run on each deployment.

Also, the concept of "entity version" will be removed, instead, timestamps will be used to perform protocol change validations. That is so, to avoid duplicated/deprecation logic. An example of this timestamp mechanism is</span> defined in (ADR-45)[1].

### Validations

The following (named) validations MUST be executed in every entity:

- [SIGNATURE]
- [IPFS HASHING]
- [STRUCTURE]
- [METADATA SCHEMA]
- [CONTENT]
- [SIZE]
- [ACCESS]

PROFILE entities will have following validations:

- [PROFILE ACCESS]
- [PROFILE THUMBNAIL]

SCENE entities will have following validations:

- [SCENE ACCESS]

STORE entities will have following validations:

- [STORE ACCESS]

WEARABLE entities will have following validations:

- [WEARABLE ACCESS]
- [WEARABLE THUMBNAIL]
- [WEARABLE SIZE]

## Status

Accepted.

## Consequences

Will create a starting point to track entities changes.

An ADR will be created to change any of these statements or add a new entity type, describing which validations will run.

Adding validations will be easier any developer.

Catalysts will need to provide external calls that may introduce some complexity.

[1]: ./ADR-45-entities-v4.md
[signature]: ./resources/ADR-51/signature.md
[ipfs hashing]: ./resources/ADR-51/ipfs-hashing.md
[structure]: ./resources/ADR-51/structure.md
[metadata schema]: ./resources/ADR-51/metadata-schema.md
[content]: ./resources/ADR-51/content.md
[size]: ./resources/ADR-51/size.md
[access]: ./resources/ADR-51/access.md
[profile access]: ./resources/ADR-51/profile-access.md
[profile thumbnail]: ./resources/ADR-51/profile-thumbnail.md
[scene access]: ./resources/ADR-51/scene-access.md
[store access]: ./resources/ADR-51/store-access.md
[wearable access]: ./resources/ADR-51/wearable-access.md
[wearable thumbnail]: ./resources/ADR-51/wearable-thumbnail.md
[wearable size]: ./resources/ADR-51/wearable-size.md
