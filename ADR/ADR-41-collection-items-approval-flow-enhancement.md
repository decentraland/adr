---
layout: doc
adr: 41
date: 2020-01-41
title: Collection Items Approval Flow Enhancement
authors:
- menduz
- pentreathm
- cazala
- nachomazzara
status: ACCEPTED
---

## Statement of the problem

The Catalysts accepts **only**:

- Deployments of rejected in-blockchain collection entities, and from an authorized collection address (Creator or Managers).
- Deployments by a committtee member if the collection entity content hash is in the blockchain.

The first one is risky because the catalyst does not have a way to validate the content submitted and someone can submit as many contents as they wish flooding the storage. All the content submitted to the catalyst must be validated by content hashing.

### Consensus changes

The consensus rules of the catalyst will modify the validations to the deployment of collection entities, that validation will now verify that:

- The hash of the deployed entity matches the approved hash on the blockchain

## Alternative A ✅

- Collections are uploaded as they are right now while they are not published.

- Once the collection is published, the creator can flag their collections as ready for review. Creators can still perform changes to the collection. Those changes will be stored in the builder-server. If any item of the collection has a change after it was approved. The collection & the item will be displayed as _dirty_. The creator can set the collection for review if any of the items is _dirty_.

- The collection smart contract won't suffer any changes. The committee members will use the `rescueItem` method to put the content hash of each item. For the time being the rescue method is only used to [revert an item to a previous version](https://github.com/decentraland/adr/blob/main/docs/ADR-32-wearable-committee-reverts.md)

- The committee members will do:

  1. The committee members will send a transaction using the methods `rescuesItem`. To set the item's content hash.
  2. The committee members will upload the items to the catalyst. The items must have the some content hash submitted to the blockchain.
  3. The committee member will send a transaction using the method `setApproved` to approve the collection after the items are uploaded to the catalyst.

_These two transactions will simulate an `approve(hash)`._

Check [here](https://github.com/decentraland/wearables-contracts/blob/master/Collections_V2_Actors.md) for further reference of smart contracts.

- The catalyst will accept entities (items) if the content hashes are reflected in the blockchain. The entity will be deployed without signature restrictions, that is, any account can sign the deployment. Changes will be needed [here](https://github.com/decentraland/catalyst/blob/3098701a42f0656dc595e653694abf4f7f418bee/content/src/service/access/AccessCheckerForWearables.ts#L119). Catalysts will need to hash the metadata and the contents of the entitiy as stated in [ADR-32](/adr/ADR-32) (`contentHash`). This way, when the user deploys the entity to the catalyst, the catalyst will check if the item's content hash in the blockchain is equal to the `contentHash` in the same timestamp/block where the deployment occurs.

### Create a Decentraland collection

```mermaid
sequenceDiagram
  participant C as Creator
  participant B as Builder
  participant PT as Builder Server
  participant M as Matic Collection Factory
  participant MC as Matic Collection

  C->>B: Create collection & upload items
  B-->>PT: Save collection & items
  C->>B: Publish collection
  B-->>M: Deploy collection
  M-->>MC: Create collection
```

### Create third party Item

```mermaid
sequenceDiagram
  participant C as Creator
  participant B as Builder
  participant PT as Builder Server
  participant TPR as Matic Third Party Registry

  C->>B: Create collection & upload items
  B-->>PT: Save collection & items
  C->>B: Publish items
  B-->>TPR: Upload items
```

### Create and update items

```mermaid
sequenceDiagram
  participant U as User
  participant B as Builder
  participant PT as Builder Server
  U->>B: Upload new version of item
  B-->>B: Edit item metadata
  B->>PT: Save item
```

### Propagate deployments to Cataysts

```mermaid
sequenceDiagram
  participant C as Committee
  participant PT as Builder server
  participant B as Builder
  participant M as Matic Collection
  participant P as DAO Peer
  B->>PT: Fetch all \nitems from a collection
  C->>B: approve(content_hashes[])
  B-->>B: Create new deployments for the catalyst using\nspecific assets from content hashes
  B->>M: sendTx: approve(content_hashes)
  M-->>M: Update item hashes & approve collection
  M-->>B: txMined
  B->>P: Deploy entitities
  M-->>P: approved content_hashes[]
  P->>P: Check and accept deployments
```

### Get (non-catalyst) content to test in-world

```mermaid
sequenceDiagram
  participant BS as Builder server
  participant E as Explorer
  E->>BS: fetch items
```

### Change editable parameters from items (Decentraland Collections only)

_beneficiary, price, name, description, category, body shapes_.

```mermaid
sequenceDiagram
  participant C as Creators
  participant B as Builder
  participant M as Matic Collection
  participant BS as Builder Server
  C->>B: Update item\n price & beneficiary
  B-->>M: Send TX
  BS-->>M: Consolidate by fetching\nthe collection subgraph
```

### Approve process (committee)

```mermaid
sequenceDiagram
  participant Ct as Creator
  participant B as Builder
  participant BS as Builder Server
  participant C as Committee
  participant M as Matic Collection
  participant peer as DAO Catalyst
  note over Ct: Play and upload collection
  Ct->>B: Upload new versions
  B-->>BS: save item
  Ct->>B: Upload new versions
  B-->>BS: save item
  Ct->>B: Upload new versions
  B-->>BS: save item
  Ct->>B: Upload new versions
  B-->>BS: save item
  Ct->>B: Item/collection ready to review
  Ct-->>M: Publish if needed(first time)
  B-->>C:Collection ready for review
  note over C: Review by committee
  C->>C: Approve hash1 + category
  C->>C: Approve hash2 + category
  C->>B: approve items with hashes
  B-->>M: sendTx: approve(content_hashes)
  B->>B: Wait for tx
  M-->>B: txMined
  note over B: Upload approved content to catalyst
  B->>peer: Upload hashed entity, using any signer
  peer->>M: Validate hashes
```

## Alternative B

Using non-DAO catalyst with new flags to provide a decentralized way of storing the items instead of the builder-server.

This alternative is not needed for the time being cause the builder-server is already used when the collection items are not published yet.

## Development proposed

### Milestone 1

- Committee members will start submitting collection item's content hash on chain.

- The catalyst will remove the check where only the committee members can submit entities if they has a content hash on chain.

### Milestone 2

- The catalyst will start accepting **only** deployments for collection entities with content hash on chain.
