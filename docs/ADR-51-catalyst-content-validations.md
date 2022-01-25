# Catalyst Conent validations

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

Also, we will get rid of the entity version idea, moving to a timestamp based decision making on validations, so we can avoid duplicated/deprecation logic. To do so, we will be using timestamp defined in (ADR-45)[1].

### Validations

The following (named) validations MUST be executed in every entity:

- [SIGNATURE](2)
- [IPFS HASHING](3)
- [STRUCTURE](4)
- [METADATA SCHEMA](5)
- [CONTENT](6)
- [SIZE](7)
- [ACCESS](8)

PROFILE entities will have following validations:

- [PROFILE ACCESS](9)

SCENE entities will have following validations:

- [SCENE ACCESS](10)

STORE entities will have following validations:

- [STORE ACCESS](11)

WEARABLE entities will have following validations:

- [WEARABLE ACCESS](12)
- [THUMBNAIL](13)
- [SIZE](14)

## Status

Accepted.

## Consequences

Will create a starting point to track entities changes.

An ADR will be created to change any of these statements or add a new entity type, describing which validations will run.

Adding validations will be easier any developer.

Catalysts will need to provide external calls that may introduce some complexity.

[1]: ./ADR-45-entities-v4.md
[2]: ./resources/ADR-51/signature.md
[3]: ./resources/ADR-51/ipfs-hashing.md
[4]: ./resources/ADR-51/structure.md
[5]: ./resources/ADR-51/metadata-schema.md
[6]: ./resources/ADR-51/content.md
[7]: ./resources/ADR-51/size.md
[8]: ./resources/ADR-51/access.md
[9]: ./resources/ADR-51/profile-access.md
[10]: ./resources/ADR-51/scene-access.md
[11]: ./resources/ADR-51/store-access.md
[12]: ./resources/ADR-51/wearable-access.md
[13]: ./resources/ADR-51/wearable-thumbnail.md
[14]: ./resources/ADR-51/wearable-size.md
