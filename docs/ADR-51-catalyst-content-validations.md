# Catalyst Conent validations

## Context and Problem Statement

Catalysts receive entity deployments that will be stored and distributed among them. Some validations are executed for each entity deployment, depending on the context and entity type.

Most validations need information about the Catalyst content state and external dependencies like The Graph, which makes them very hard to predict, i.e. we can't ensure an entity deployment will be correct without validating it in given context.

In the other hand, we have some stateless validations that may be useful to run before actually doing a deployment, like metadata schema and hashes validations.

Adding an entity type to a Catalyst requires a tedious effort which envolves defining schemas, relations and validations in different repositories.

For instance, adding a validation to the Catalyst can be overwhelming for a developer from outside the Platform team.

## Decision

We will move all validations to a library that will not depend on any other than definitions like schemas and types.

It will expose an interface that will be implemented and required for validations execution, at the moment it means the Catalyst will provide this implementation but any other could do it.

We will redefine the deployment contexts and only take into account: 'LOCAL' and 'SYNCED'.

All validations will know this context and will decide if must do something different, but no validation list per context will exist, i.e. all validations will run on each deployment.

Also, we will get rid of the entity version idea, moving to a timestamp based decision making on validations, so we can avoid duplicated/deprecation logic.

We will execute these validations for all entity types:

- RATE LIMIT
- NO NEWER
- RECENT
- SIGNATURE
- IPFS HASHING
- STRUCTURE
- METADATA SCHEMA
- CONTENT
- SIZE

PROFILE entities will have following validations:

- ACCESS CHECKER

SCENE entities will have following validations:

- ACCESS CHECKER

WEARABLE entities will have following validations:

- ACCESS CHECKER
- THUMBNAIL
- SIZE

## Status

Accepted.

## Consequences

Will create a starting point to track entities changes.

We will need to create an ADR in order to change any of these statements or add a new entity type, describing which validations will run.

Adding validations will be easier for external team developers.

Catalysts will need to provide external calls that may introduce some complexity.
