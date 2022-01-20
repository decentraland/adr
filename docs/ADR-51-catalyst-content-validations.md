# Catalyst Conent validations

## Context and Problem Statement

Catalysts receive entity deployments that will be stored and distributed among them. Some validations are executed for each entity deployment, depending on the context and entity type.

Most validations need information about the Catalyst content state and external dependencies like The Graph, which makes them very hard to predict, i.e. we can't ensure an entity deployment will be correct without validating it in a given context.

On the other hand, we have some stateless validations that may be useful to run before actually doing a deployment, like metadata schema and hashes validations.

Adding an entity type to a Catalyst requires a tedious effort which envolves defining schemas, relations and validations in different repositories.

For instance, adding a validation to the Catalyst can be overwhelming for a developer from outside the Platform team.

## Decision

We will move all validations to a library that will not depend on any other than definitions like schemas and types.

It will expose an interface that will be implemented and required for validations execution, at the moment it means the Catalyst will provide this implementation but any other could do it.

We will redefine the deployment contexts and only take into account: 'LOCAL' and 'SYNCED'.

All validations will know this context and will decide if must do something different, but no validation list per context will exist, i.e. all validations will run on each deployment.

Also, we will get rid of the entity version idea, moving to a timestamp based decision making on validations, so we can avoid duplicated/deprecation logic.

### Validations

We will execute these validations for all entity types:

- SIGNATURE

  Validate that the signature belongs to the Ethereum address

  ([reference](https://github.com/decentraland/decentraland-crypto/blob/master/src/Authenticator.ts))

```
function validateSignature: (see reference)
  1. Fail if authChain is malformed
  2. For each authLink L in authChain
    a. Let validator V be the validator by L.type
    b. Fail if V can't validate on that time


1. Let validateSignature be a function that validates the auth chain of the deployment

2. Fail if validateSignature(entity.id, deployment.authChain, deployment.timestamp)
```

- IPFS HASHING

  Validates that all hashes used by the entity are actually IPFS hashes

```
parameter ADR_45_TIMESTAMP = 1648771200

1. If deployment.timestamp <= ADR_45_TIMESTAMP return

2. Let ALL_HASHES be entity.id U entity.content.hashes

3. For each hash H in ALL_HASHES
  a. Fail if H is not a valid IPFS_HASH_V1
```

- STRUCTURE

  Validates that entity pointers are present and not repeated

```
1. Fail if entity.pointers.length <= 0

2. Fail if Set(entity.pointers).size != entity.pointers.length
```

- METADATA SCHEMA
  1
  Validates entity metadata against its corresponding schema

```
parameter ADR_45_TIMESTAMP = 1648771200

----

1. If deployment.timestamp <= ADR_45_TIMESTAMP return

2. Let entity be the uploaded deployment entity

2. Let SCHEMA be the json schema of current entity.type

3. Fail if entity.metadata does not satisfy SCHEMA
```

- CONTENT

  Validates that uploaded and reported hashes are corrects and files corresponds to snapshots

```
parameter ADR_45_TIMESTAMP = 1648771200
parameter ADR_X_SNAPSHOT_FILES = {"face.png", "body.png"}

----

1. For each content file item C in the deployment
  a. Fail if C is not stored in disk or is not one of the uploaded files

2. For each uploaded file F in the deployment
  a. Fail if F is not one of the content file items in deployment

3. If deployment.timestamp > ADR_45_TIMESTAMP
   a. For each content file F in the deployment
      i. Fail if F.filename ∉ ADR_X_SNAPSHOT_FILES
```

- SIZE

  Validates that the full request size is within limits

```
parameter ADR_45_TIMESTAMP = 1648771200

----

1. Let MAX_SIZE be the maximum size in bytes allowed by ENTITY_TYPE

2. Let CURRENT_SIZE be the sum of all content files' sizes in bytes:
  a. If deployment.timestamp < ADR_45_TIMESTAMP, sum only uploaded files
  b. If deployment.timestamp >= ADR_45_TIMESTAMP, sum includes stored files

3. Fail validation if CURRENT_SIZE > MAX_SIZE
```

- ACCESS

  Validates that the pointers are valid, and that the Ethereum address has write access to them

```
parameter LEGACY_CONTENT_MIGRATION_TIMESTAMP
parameter DECENTRALAND_ADDRESS

----

1. If deplyoment.timestamp < LEGACY_CONTENT_MIGRATION_TIMESTAMP and deployment.address != DECENTRALAND_ADDRESS
  return

2. Execute entity access validation

```

PROFILE entities will have following validations:

- PROFILE ACCESS

```
parameter DECENTRALAND_ADDRESS

----

1. Fail if deployment.pointers.length != 1

2. Let pointer P be deployment.pointers[0].toLowerCase()

3. If P starts with 'default'
  a. Fail if deployment.address != DECENTRALAND_ADDRESS

4. Fail if P is not an Ethereum address

5. Fail if P != deployment.address.toLowerCase()
```

SCENE entities will have following validations:

- SCENE ACCESS

```
parameter DECENTRALAND_ADDRESS
parameter SCENE_LOOKBACK_TIME
function checkParcelAccess:
  1. Let parcel P be the parcel of X, Y
  3. For each target T in P U P.states
    a. You get direct access if you were the:
        - owner
        - operator
        - update operator
      at that time

    b. You also get access if you received:
        - an authorization with isApproved and type Operator, ApprovalForAll or UpdateManager
      at that time

----

1. For each pointer P in deployment.pointers // lowercase
  a. If P starts with 'default'
    1. Fail if deployment.address != DECENTRALAND_ADDRESS
  b. Let X, Y be P.split(,)
  c. Fail if !checkParcelAccess(x,y, deployment.timestamp)
  and !checkParcelAccess(x,y, deployment.timestamp - SCENE_LOOKBACK_TIME)

```

STORE entities will have following validations:

- STORE ACCESS

```
1. Fail if deployment.pointers.length != 1

2. Let pointer P be deployment.pointers[0].toLowerCase()

3. Fail if P does not satisfy URN like:
 urn:decentraland:off-chain:marketplace-stores:{address}

4. Fail if deployment.address != urn.address
```

WEARABLE entities will have following validations:

- WEARABLE ACCESS

  Given the pointers (URNs), determine which layer should be used to check the access.  
  Checks if the ethereum address has access to the collection.

```
parameter DECENTRALAND_ADDRESS

parameter ALLOWED_TYPES = ['off-chain', 'blockchain-collection-v1-asset', 'blockchain-collection-v2-asset']

parameter L1_NETWORKS = ['mainnet', 'ropsten', 'kovan', 'rinkeby', 'goerli']

parameter L2_NETWORKS = ['matic', 'mumbai']

function checkCollectionAccess:
  1. Let permissions P be
    - the addresses of:
      - collection creator
      - collection managers
      - item managers
      - comitee
    - the contentHash
    - isApproved && isCompleted
    at the moment

  2. If P.contentHash is pressent
    a. Fail if deployment.address ∉ P.comitee
    b. Fail if P.contentHash != IPFS_HASH_V0(deployment.content.bytes) or P.contentHash != IPFS_HASH_V1(deployment.content.bytes)

  3. Else
    a. Fail if deployment.address ∉ (P.collectionManagers ∪ P.collectionCreator ∪ P.itemManagers ∪ P.comitee)
    b. Fail if !(P.isApproved and P.isCompleted)

----

1. For each pointer P in deployment.pointers
  a. Fail if P does not satisfy URN like:
   urn:decentraland:{protocol}:collections-v2:{contract(0x[a-fA-F0-9]+)}:{name}

2. Fail if deployment.pointers.length > 1

2. Let parsed pointer P be the parsed deployment.pointers[0]

3. Fail if P.type ∉ ALLOWED_TYPES

4. If P.type == 'off-chain'
  a. Fail if deployment.address != DECENTRALAND_ADDRESS

5. Else
  a. Fail if P.network ∉ L1_NETWORKS and parsed.network ∉ L2_NETWORKS
  b. Let HAS_ACCESS be the result of checkCollectionAccess(deployment, P)
  c. If !HAS_ACCESS
    . Fail if P.network ∈ L2_NETWORKS
    . Fail if deployment.address != DECENTRALAND_ADDRESS
```

- THUMBNAIL
  Validates that given wearable deployment includes a thumbnail with valid format and size

```
parameter ADR_45_TIMESTAMP = 1648771200
parameter THUMBNAIL_SIZE = 1024

----

1. If deployment.timestamp <= ADR_45_TIMESTAMP return

2. Let THUMBNAIL_HASH be deployment.content.find(deployment.metadata.thumbnail)

3. Fail if THUMBNAIL_HASH is not present

4. Fail if THUMBNAIL_HASH ∉ deployment.files

5. Let THUMBNAIL_IMAGE be the image corresponding to the THUMBNAIL_HASH

6. Fail if THUMBNAIL_IMAGE is not a .PNG

7. Fail if THUMBNAIL_IMAGE width != THUMBNAIL_SIZE

8. Fail if THUMBNAIL_IMAGE height != THUMBNAIL_SIZE
```

- SIZE
  Validates wearable files size, excluding thumbnail, is less than expected

```
parameter ADR_45_TIMESTAMP = 1648771200
parameter MAX_SIZE = 2

----

1. If deployment.timestamp <= ADR_45_TIMESTAMP return

2. Let THUMBNAIL_HASH be deployment.content.find(deployment.metadata.thumbnail)

3. Fail if THUMBNAIL_HASH is not present

4. Let CURRENT_SIZE be the size of deployment files (uploaded and stored)

5. Let THUMBNAIL_SIZE be the size of the deployment file corresponding to THUMBNAIL_HASH

6. Fail if MAX_SIZE < CURRENT_SIZE - THUMBNAIL_SIZE
```

## Status

Accepted.

## Consequences

Will create a starting point to track entities changes.

We will need to create an ADR in order to change any of these statements or add a new entity type, describing which validations will run.

Adding validations will be easier for external team developers.

Catalysts will need to provide external calls that may introduce some complexity.
