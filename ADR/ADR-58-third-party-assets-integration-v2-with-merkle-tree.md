---
layout: doc
adr: 58
date: 2022-06-07
title: Third Party Collections Registry V2 (Merkle Tree)
status: Living
authors:
  - pentreathm
  - agusaldasoro
  - guidota
  - LautaroPetaccio
  - nicosantangelo
  - fzavalia
  - nachomazzara
type: Standards Track
spdx-license: CC0-1.0
---

## Statement of the problem

The way we thought the [item submission and curation](/adr/ADR-42/#third-party-collection-smart-contract-registry) by third party managers and curators respectively does not scale. Managers need to submit all the items with their metadata to the blockchain, and curators need to approve them. Based on Polygon's gas block limit, items can be submitted/curated in batches of ~50. For a collection with 100k items that means that 2k transactions must be done. The process as designed is completely time and money-consuming. By leveraging on the Decentraland catalyst status quo the number of transactions can be reduced to 1.

## Proposed solution

In order to make the whole process scale while keeping decentralization a set of changes to the current proposed solution is needed.

### Third Party Collection Smart Contract Registry updates

#### Contract Implementation

Third party's managers won't need to submit items to the blockchain, that means that it doesn't matter the size of the collection because no transactions is needed. The only action needed from the third party managers perspective is to sign a message with the third party urn, the amount of items slots to be consumed and a random salt of 32 bytes every time they want publish new items. From the curation part, items will be reviewed by curators by just submitting a [merkle tree root](/adr/ADR-55/#item-curation) at the third party level to the blockchain along with the messages signed by the third party managers mentioned before.

- Updated methods:

  - _`addThirdParties`_: when a third party is added, it can start with item slots.
  - _`updateThirdParties`_: item slots can be increased if the method is called by a third party aggregator. It must revert if the caller is not allowed.

- New methods:

  - _`consumeSlots`_: Single method to process items consumption.
  - _`reviewThirdPartyWithRoot`_: Curators review the third party by submitting a merkle tree root generated with the items' urn and content hash to be reviewed. Optional, this method can receive item slots consumption signatures to review + consume items in one transaction for curators.
  - _`setRules`_: Curators can add rules in order to reject third party collections/items like: `{third-party-urn}:{collection-id}:*` -> reject all the collection's items. **This method is not going to be exposed in the UI for the time being as third party item rejection granularity has not been defined yet**.

#### Roles

The TPR smart contract supports different roles:

- **Owner**: the address that updates core parts of the smart contract like the committee smart contract address and the initial values for the third parties and their items (approved or rejected).
- **Third party aggregator**: the address that can add new third parties and item slots to third parties. For the time being this address will be the Polygon DAO committee multisig.
- **Committee Members (curators)**: the committee members, validated by querying the committee smart contract directly. Committee members can approve/reject third parties, review third parties items with one simple transaction by submitting a merkle tree root with slots cheques (if the items are new) made from third parties managers signatures.
- **Third Party Managers**: the third party managers are a set of addresses that can update the third party metadata and sign slots consumption cheques that will be used when publishing new items.

#### Third Party Record

Third party records store information about a third party.

Each record in the contract has the following structure:

```solidity
struct ThirdParty {
        bool isApproved;
        bytes32 root; // New
        uint256 maxItems;
        uint256 consumedSlots; // New
        uint256 registered;
        string metadata;
        string resolver;
        string[] itemIds; // Deprecated
        mapping(bytes32 => uint256) receipts; // New
        mapping(address => bool) managers;
        mapping(string => Item) items; // Deprecated
        mapping(string => bool) rules; // New
    }
```

- _`isApproved`_: whether a third party is approved or not.
- _`root`_: current merkle tree root. This root is going to be used by the Decentraland catalyst to check if an item deployment is valid or not.
- _`maxItems`_: represents the maximum number of items that a third party can have. We call them _item slots_. Item slots are assigned at the time of the creation of the third party record and they can be increased by the third party aggregator.
- _`consumedSlots`_: the number of slots consumed by a third party by publishing new items.
- _`registered`_: simple boolean that helps to check whether a third party has been added or not.
- _`metadata`_: string with the following shape: `type:version:name:description`. i.e: `tp:1:third party 1:the third party 1 description`. By changing the metadata version, we could modify what it contains, for example, we may include the collections metadata by changing the metadata version to 2.
- _`resolver`_: string with the third party API resolver. This API will be used for services to get which Decentraland asset should be mapped to which NFT token. _We call Decentraland asset to every asset that is submitted to the Decentraland catalyst_. i.e: `https://api.thirdparty1.com/v1/get-owned-nfts/:owner`
- _`itemIds`_: this is deprecated in favor of approving items using the merkle root stored in the `root` property.
- _`receipts`_: mapping of item consumptions messages hash. We will use this in order to prevent double-spending them.
- _`managers`_: the addresses of the third party managers.
- _`rules`_: third party's rules. **IMPORTANT**: Rules are not going to be used for the time being. The rejection of third parties and their items is still a pending topic.

A third party record can't be removed but approved/rejected by a committee member.

Third parties can be looped off-chain without the need of indexing historic events.

### Items

In this implementation, items are no longer stored in the blockchain in order to reduce the number of transactions needed for that purpose. The Catalysts will be responsible of holding the information about the items.

To loop through the third parties' items, a request to the Catalyst is needed:

Endpoint:

```
@GET https://peer.decentraland.org/content/entities/active/collections/{collectionUrn}
```

Request example:

```
curl https://peer.decentraland.org/content/entities/active/collections/urn:decentraland:mumbai:collections-thirdparty:cryptohats
```

Request response: Item pointers

```json
[
  {
    "pointer": "urn:decentraland:mumbai:collections-thirdparty:cryptohats:0xbac:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd",
    "entityId": "QmeA8RpAtqU6gCebNaWRXtM9nQs3ugzzbeQm3L7uKrP4Jp"
  },
  {
    "pointer": "urn:decentraland:mumbai:collections-thirdparty:cryptohats:0xbac:0xabcdefghijk",
    "entityId": "QmdajbrYt4pdkkW2R2PcZ8iLz55uzgGceo4hJMCirHEpPK"
  },
  {
    "pointer": "urn:decentraland:mumbai:collections-thirdparty:cryptohats:0xRzy:0xlmnopqrst",
    "entityId": "QmXokfUunNwLY9hw7U9x2Q3NJ7VFXt65rVDRGzFzPzEXvX"
  }
]
```

These pointers can be queried as usual, using the Catalysts' entities API.

### Item submission process (check title?)

### Third party collections

Third party collections were kept virtually in the blockchain through the URN of the items that were stored in each third party record. As there's no more items stored in the contract, this changed completely.
The third party collections are now stored in the builder-server's database.

These new collections are similar to standard collections with some changes:

- There are now two new columns describing the collection URN, `third-party-id` and `urn_suffix` (collection-id) whose pair must be unique to avoid URN conflicts.
- The `eth_address` column is no longer set in the collection as it doesn't have a single owner anymore.
- The `contract_address` column is ignored, as there's no contract address for third party collections.
- The column `managers` is not set in the collection as the managers are retrieved from the graph.
- The column `minters` is not set in the collection as it's not mintable.
- Third party collections are considered published if any of its items is published.

#### Creating third party collections

The creation of a new third party collection involves the user selecting a third party record from the ones that they have to then fill both the name and the id of the collection. After accepting the data, the
builder-server is requested through the `PUT /v1/collections/{id}` endpoint to create a new collection. This new collection is sent as the standard collections with the parameter URN having the third party URN that it was created with.

The third party collection creation process in the builder-server involves the creation of a new collection with two restrictions in mind:

- If the user creating the collection is a third party manager of the third party record. This is done by querying the graph for the list of third party managers that belong to the third party record with the third-party-id provided in the URN of the collection to be created.
- If the provided URN is unique.

#### Editing third party collections

Third party collections can be edited in two ways. Their names and their `urn_suffix` or collection id can be changed.

To change the name of a third party collection, the user must provide the new name through the UI that will perform a `PUT /v1/collections/{id}` request where it will send the entire collection with the name changed. In comparison with the standard collections, there's no
restriction to when a collection name can be edited as the collection doesn't store that information in a smart contract. Only third party managers can change the name of a collection.

It is possible to change the `urn_suffix` or the collection id of a third party collection. The user must provide the new collection id through the UI and it will perform a `PUT /v1/collections/{id}` request where it will send the entire collection with the URN changed. There are three restrictions to this procedure:

- The user performing the edition must be a third party manager of the collection.
- The collection must not have published items. This is to prevent changing the URN of published items.
- The new `urn_suffix` or collection id must be unique.

#### Deleting third party collections

To delete a third party collection, a third party manager has to select the option to delete a the collection in the UI. The UI will perform a `DELETE /v1/collections/{id}` request which will delete the collection if and only if:

- The collection is managed by the third party manager deleting the collection.
- The collection has no published items in it.

#### Viewing third party collections

Third party collections are viewed by every third party manager of a third party record. Every third party manager will receive from the `GET /v1/{address}/collections` endpoint, the list of collections that are owned (standard collections) or managed (third party collections) by them. The builder-server will query the graph to retrieve the list of third party records that the manager is a manager of to later return the correct list of collections.

### Third party items

Third party items are items are no longer stored in the blockchain. As the contract changes explains, a big amount of transactions were needed to comply with the requirements of having thousands of items per third party record. Third party items in the database have now the responsibility of determining which items are published or not and which were curated or need review, a task that was delegated to the smart contract before. This change of behavior means that the builder-server and the Catalyst server will be responsible for the publishing and storage of items, being the builder-server the source of truth for items that are published and their reviews and the Catalyst for the items that were approved, deployed and ready to be consumed in world.

Through its life cycle, a third party item can be:

1. A new item. (builder-server)
2. A published item waiting to be curated (under review). (builder-server)
3. An approved (builder-server) and deployed item (Catalyst).
4. A deployed item with changes to be pushed. (builder-server)
5. A re-approved (builder-server) and re-deployed item (Catalyst).

We'll see the life cycle in the upcoming sections.

With this change, third party items now store their `urn_suffix` or their item id. In the older implementation, verifying that a URN was unique was done using the information that came from the blockchain, but this is no longer the case. The builder-server is the one responsible of verifying that the URN is unique.

The builder-server will also compute the hash of the entity that items will represent when published to the Catalysts when the items are created or edited. This is done by building the entity object and hashing it according to the [ADR-62](/adr/ADR-62). The purpose of computing this hash is to have an item's checksum to match with the content of an item. This will prove useful in the curation process where the Merkle Tree will be built using these checksums.

Third party items also differ from their standard version in that they have no rarity.

#### Creating third party items

Third party items are created in a similar way to standard items. The UI, using the builder-server is responsible of creating the item and storing it in the database. There are three main differences between creating standard items and third party items:

- Only third party managers can add items to a third party collection.
- The creation of items can be done one by one in bulk.
- The URN must be unique and must match with the one of the collection (must have their third party id and collection id).

When creating a new third party item, the builder-server will check whether the collection where the item is being inserted is a third party collection and if the URN is unique and complies with the URN of the collection.

Third party items can't be created without collections, the builder-server will reject any third party item creation that doesn't belong to a collection.

##### Creating items one by one

The creation of items one by one is practically identical to the creation of standard items. The user selects that they want to create a new single item, they upload the model and set the metadata of it to later save it by making a request to the builder-server that will create the item and store it in the database. When creating items one by one, the UI will auto-assign an URN to the item being created.

##### Creating items in bulk

Creating items in bulk was added for the purpose of solving the requirement of working with a big amount if items. The user can select through the UI the option to upload items in bulk where they are able to upload multiple ZIP files with their models and a `wearable.json` file that contains the item's metadata or information. How to configure the `wearable.json` file is defined in the [ADR-68](/adr/ADR-68). Differently from the process of uploading items one by one, the user can specify in their `wearable.json` file the URN that the item will have. If the user doesn't provide one, the URN will be auto-assigned by the UI.

Upon selecting the multiple ZIP files to upload, the UI will process them one by one, validating the contents of the ZIPs and generating the thumbnail for the items if they don't exist or re-formatting them to have the correct shape if they exist. If the user chooses to upload the items, the UI will start a concurrent process of uploading the items to the builder-server. The creation of items is done by putting concurrently, but one by one, the items into the `PUT /v1/items/{id}` endpoint.

Created items will be shown to the third party managers in the UI.

#### Editing third party items

Editing third party items have a couple of differences from standard items:

- Only third party managers can edit the items of a third party collection.
- Users can't move items out of third party collections (there can't be any third party collections without items).
- Users can't move third party items into other third party collections.
- Users can't edit the URN of a published third party item.
- If editing the item's URN, the URN must be unique.

Editing items have different effects accordingly to the step of the process the item is in:

- Items that are not published will be edited without any considerations in mind besides having a unique URN.
- Items that are published can be edited while their are awaiting curation without changing their URN.
- Items that were published and approved will be edited without changing their URN and need to have their changes pushed so curators can re review them.

As we've seen in the previous section, editing an item will result in its entity hash re-computed. Any item will have their local content hash or current content hash, containing the hash of the latest item entity that represents its current contents and a catalyst content hash, representing the latest version of the entity that is stored in the Catalysts upon publishing. Using these two hashes, we can compute if the item is synced or un-synced from their deployed version.

##### Editing items one by one

Editing items one by one is done in the same way as standard items are edited. The user can use the item editor UI to change the metadata or the model of the item.

##### Editing items in bulk

Editing items in bulk is done in a similar way as the process of creating items in bulk. Users have to provide a ZIP file for each item to be updated that contains a `wearable.json` with the new properties of the item. The main difference with the usual process of editing an item is that in the bulk edition process the URN of the item will be used as the identifier of the item to update in the database. The UI will perform concurrently a `PUT /v1/items/{urn}` request for each item to be updated. The builder-server will recognize the ID as a URN and will perform the update accordingly.

#### Third party item deletion

Deleting third party items follows the same rules as standard with one difference, only third party managers can delete third party items.

### Publishing items

The procedure of publishing an item starts by the selection of the items. Users will be able to select a block of items to publish in the UI, upon selecting them and clicking the publish button, the UI will send a `POST /v1/collections/{collectionId}/publish` request to the builder-server with **the ids of the items to publish** and **a signed cheque to discount the amount of items to be published** from the amount of remaining slots that the third party record has. If the third party record does not have enough slots to accommodate the items that are going to be published, the builder-server will reject the request.

Cheques can be explained as the way managers of Third Parties approve the expense of slots.
They have the following structure:

```json
{
  "qty": 2,
  "salt": "0xba02ba1a08d1bbfdaaf0cbeb84f8781d204faff90480c23bcef8a2c33ea9217d",
  "thirdPartyId": "aThirdPartyId"
}
```

The quantity describes the amount of slots to be deduced, the salt is a random number to prevent a duplicated cheque to be signed and the thirdPartyId is the thirdPartyId that the cheque is being singed for.

When a cheque is received, the builder-server will verify that the performer of the request is the one signing the cheque and that the signer is a third party manager to later store it in the database.

After publishing a set of items to be reviewed, the collection gets locked from further item publications until the curator has approved the items. This is done to simplify the technical aspects of the process as if not, the builder-server must work with multiple cheques at the same time which would make it difficult the approval process.

The builder-server will then create an `item curation` with a `PENDING` status for each item to be published and store it in the database. Item curations are similar to collection curations, but they have a stronger semantic meaning, they're used to define the published state of an item and to track the curation process of them. An item is considered published if they have an item curation.

The cycle of the item curations is as follows:

1. An item is published and an item curation is created for the published item with a `PENDING` status.
2. The item is approved, marking the curation as `APPROVED`.
3. The user makes changes to an already published item and pushes them, creating a new item curation with a `PENDING` status.
4. The item is re-approved, marking the curation as `APPROVED`.

As keeping track of the published items is a responsibility of the builder server, the server will also be the source of truth for the amount of slots remaining for each specific third party record. The amount of slots that a third party record has is stored in the blockchain and to obtain the amount of remaining slots, the amount of published items (stored in the database) must be deducted from it.

### Curation

The curation process starts with a curator loading the third party collection to be curated. After going through the items that they're required to review according to the DAO proposal, the curator can choose to approve the block of items that they're reviewing. As items are published in block, they're also approved in blocks. Curators will not only approve the newly published items, but they will also approve items that were previously published had changes pushed.

The approval process is performed by the UI as follows:

1. The builder-server is asked for all items that are awaiting curation as the items that have their item curations as `PENDING` have not been approved yet. This is done in a paginated but concurrent way as the amount of items can be big.
2. The builder-server is asked for the approval data of the collection. This is done by requesting the `GET /collections/{collectionId}/approvalData` endpoint. The server will return the latest signed cheque, a flag to check if the cheque was already consumed or not, a map of items and their item entity hashes and the latest Merkle Tree root. The cheque and the entity hashes were stored in the previous steps in the builder-server database, but the cheque consumption flag and the latest Merkle Tree root used are retrieved from the third party record in the blockchain.
3. Using the entity hashes, the Merkle Tree is built.
4. If the Merkle Tree root that was built in the previous step is different from the one returned in the 2nd step from the server, the curator will be asked to perform the approval action against the blockchain. This transaction will contain the third party id, the Merkle Tree root that was computed in the 4th step and the cheque if there are new items to be published. The transaction will store the cheque in the contract and update the Merkle Tree root to allow the deployment of the items from which the tree was made from in the Catalysts.
5. A polling procedure will be performed to wait for the graph to return the new Merkle Tree root to ensure the next process is performed correctly.
6. Each item is deployed to the Catalyst by building its entity as explained in the [ADR-62](/adr/ADR-62) and the item's curation is updated to `APPROVED` in a concurrent manner. The item curation is updated to `APPROVED` only if the item was deployed to the Catalyst.

After the approval process is completed, all the items have their item curation as `APPROVED`, unlocking for further item publications.

#### Catalyst acceptance criteria

Third party items deployed to the Catalyst have a different entity metadata than the standard items. The entity metadata, defined in the [ADR-62](/adr/ADR-62), is a Merkle Proofed entity metadata, which is an item metadata with an attached Merkle Tree proof to validate that the item to be deployed belongs to a Merkle Tree.

Upon receiving a deployment, the Catalysts will check the graph for the latest Merkle Tree root available:

```GraphQL
{
  thirdParties(where: {isApproved: true}, block:{number : {blockNumber}}) {
    root
  }
}
```

And, following the [ADR-62](/adr/ADR-62), the Catalysts will:

1. Perform a checksum check of the entity metadata, by hashing the entity (using only the hashing keys) and comparing it to the `entityHash` property that the entity metadata contains.
2. Validate that the deployed entity belongs to the Merkle Tree root stored in the blockchain by using the `proof`, the `index` and the `entityHash` properties. The Decentraland catalysts will use the [merkle-tree-content-hash](https://github.com/decentraland/content-hash-tree) library to perform the validation.

### Curation tracking

Extending the curation section explained [here](/adr/ADR-55/#item-curation)

Whenever a third party manager wants to publish new items, they need to sign a message with the items' consumption receipt. Every time a curator reviews new items (not applicable for item updates), the receipts are going to be submitted to the blockchain emitting a _`ItemSlotsConsumed`_ event. We will use that event in the third party subgraph in order to track the number of items reviewed by curators. For algorithm-generated collections, we will still submit the original number of items consumed but as the curator will review just a portion of the items, we will need to use a fixed number of items to compute how much we need to pay for that review to the curator. That number must be defined by the DAO.

E.g: If the DAO defines 50 as the number of items to be paid for algorithm-generated collections, the curator will receive a payment of 50 items even if the collection has 100k items' consumptions.

Example of a query

```GraphQL
{
  curations(where:{curator:{address}}) {
   	thirdPartyId
    qty
    receipts {
      qty
    }
  }
}
```

## Checking wearables ownership in lambdas

### Discover all third party integrations

This returns all the approved collections for third party wearables using the query:

```
{
  thirdParties(where: {isApproved: true}) {
    id
		metadata {
      thirdParty {
        name
        description
      }
    }
  }
}
```

```bash
@GET https://peer.decentraland.org/lambdas/third-party-integrations

# Response:

{
   "data": [
      {
        "urn": "urn:decentraland:mumbai:collections-thirdparty:cryptopunks:0xContractAddressaaabbff999123:0",
        "name": "Jean Pier",
        "description": "Crypto punks (third party)"
      },
      {
        "urn": "urn:decentraland:mumbai:collections-thirdparty:cryptohalloween:0xContractAddressaaabbff999123:14",
        "name": "Halloween hat",
        "description": "Decentraland Halloween 2019"
      },
      {
        "urn": "urn:decentraland:mumbai:collections-thirdparty:cryptohalloween:0xContractAddressaaabbff999123:9",
        "name": "Halloween tshirt",
        "description": "Decentraland Halloween 2020"
      }
    ]
}
```

## List third party wearables for address

Getting the endpoint `/wearables-by-owner` with the query param `collectionId` only returns the items owned of that collection, and only third party wearables collections are supported.
To obtain that, the lambdas API does:

1. Requests to The Graph to obtain the third party ownership API URL
2. Requests the given URL to obtain all wearables owned by the given address of the collection.

```bash
@GET https://peer.decentraland.org/lambdas/wearables-by-owner/{address}?collectionId={collectionUrn}


# Fetch
https://peer.decentraland.org/lambdas/wearables-by-owner/0xAbcd?collectionId=urn:decentraland:mumbai:collections-thirdparty:cryptopunks

# Response

[
  {
    "urn": "urn:decentraland:mumbai:collections-thirdparty:cryptopunks:0xContractAddressaaabbff999123:0",
    "amount": 1
  },
  {
    "urn": "urn:decentraland:mumbai:collections-thirdparty:cryptopunks:0xAnotherContractAddressaaabbff999123:0",
    "amount": 1
  }
]
```
