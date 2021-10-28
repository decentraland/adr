# Third Party Collections Registry

## Statement of the problem

Multiple third parties with their own NFT contracts (ERC721, ERC1155, etc) want to be part of Decentraland, but the current Decentraland collections implementations are not always a good fit for their use cases. Therefore, a smart contract is going to be created to have a decentralized way where they can map 3d assets to their already created NFTs.

## Contract Implementation

The TPR smart contract is going to be deployed on Polygon and support meta-transactions with the EIP-712 to reduce operational costs. The contract can be easily migrated because it doesn't store or mint any tokens. The main purposes of this registry is to have an on-chain way to check whether an item has been approved by a committee member and therefore can be submitted to the Decentraland catalysts. And, to check whether a third party or item has been approved or rejected.

The contract is not a storage-gas-consumption top efficient because it prioritizes looping through third parties and items without the need of indexing historical data.

### Roles

The TPR smart contract supports different roles:

- Owner: the address that updates core parts of the smart contract like the accepted token (MANA), the committee smart contract address, the fee collector address, and the initial values for third parties and their items (approved or rejected).
- Third party agregator: an address that can add third party records. For the time being this address will be the Polygon DAO committee multisig.
- Committee Members: the committee members are going to be validated by querying the committee smart contract directly. Committee members can approve/reject third parties and their items.
- Third Party Managers: the third party managers are a set of addresses that can add items to the third party record, previously added by someone on the committee, and update the third party and items metadata.

### Third Party Records

The third party record is going to be identified by a unique id. For simplicity and in order to support different uses cases, this id is going to be a string. By using a string, we can support ids as URNs, UUIDs, auto incremental values, etc. The current identifier used in Decentraland is the URN, therefore, an id urn like `urn:decentraland:matic:ext-thirdparty1` is what we expect to be using.

Each third party record can only be added by a committee member and it has the following properties:

```solidity
struct ThirdParty {
    string metadata;
    string resolver;
    uint256 maxItems;
    bool isApproved;
    mapping(address => bool) managers;
    mapping(string => Item) items;
    string[] itemIds;
    uint256 registered;
}
```

- _`metadata`_: string with the following shape: `type:version:name:description`. i.e: `tp:1:third party 1:the third party 1 description`.
- _`resolver`_: string with the third party API resolver. This API will be used for services to get which Decentraland asset should be mapped to which NFT token. _We call Decentraland asset to every asset that is submitted to the Decentraland catalyst_. i.e: `https://api.thirdparty1.com/v1/get-owned-nfts/:owner`
- _`maxItems`_: represents the maximum number of items that a third party can have. We call them _item slots_. Item slots can be bought by everyone at any time, in multiple occasions, by using MANA. So, it is not necessary to be a third party manager to buy item slots. Item slots are going to be bought by tiers (tier1: 100 items, tier2: 1000 items, tier3: 1000, etc.). The tiers' value and price are going to be defined in another smart contract called Tiers that will allow querying the tiers' price and value by its index.
- _`isApproved`_: whether a third party is approved or not.
- _`managers`_: third party managers.
- _`items`_: third party's items. An item has its own properties defined [here](#items).
- _`itemIds`_: in order to allow looping through the items added without the need of indexing historic events, we need to keep track of their ids.
- _`registered`_: simple boolean that helps to check whether a third party has been added or not.

A third party record can't be removed but approved/rejected by a committee member.

As we mentioned with the items, the third parties can be looped off-chain without the need of indexing historic events.

### Items

Items are going to be identifying with an id like the third party records. In order to support the concept of erc721 contracts or collections, the item id will looks like: `collection:item`. i.e: `0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd:1` (NFT smart contract: 0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd, NFT tokenId: 1), `great_collection:type1`, etc.

As you may notice, the concept of a collection is merely "virtual" and will be part of the item id. If there is a use case where a third party has multiple collections, they can be easily filtered by comparing strings off-chain.

Items can only be added to a third party if there are item slots available.

```solidity
struct Item {
    string metadata;
    string contentHash;
    bool isApproved;
    uint256 registered;
}
```

- _`metadata`_: string with the following shape: `type:version:name:description:category:bodyshapes`. i.e: `w:1:third party item 1:the third party item 1 description:hat:BaseMale,BaseFemale`.
- _`contentHash`_: string with the content hash of the item. We are using content hashing like IPFS.
- _`isApproved`_: whether an item is approved or not.
- _`registered`_: simple boolean that helps to check whether an item has been added or not.

Similar to third parties, items can't be removed but approved/rejected by committee members.

# Catalyst acceptance criteria

Each deployment must check if the URN has `ext-thirdparty` in order to know that the [tpr-graph](https://github.com/decentraland/tpr-graph) should be used. The query to that subgraph must check:

1) If there is a record with the urn: 

`urn:decentraland:polygon:ext-thirdparty:0x1234:tokenId1`.

2) If the content hash of the item with id `0x1234:tokenId1` is the same as the content hash of the item that is being uploaded

## Participants

- @Lautaro

- @Fernando

- @Juanca

- @Nacho
