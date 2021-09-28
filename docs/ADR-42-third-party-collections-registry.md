# Third Party Collections Registry

## Statement of the problem

Multiple third parties with their own NFT contracts (ERC721, ERC1155, etc) want to be part of Decentraland, but the current Decentraland collections implementations are not always a good fit for their use cases. Therefore, a smart contract is going to be created to have a decentralized way where they can map 3d assets to their already created NFTs.

## Contract Implementation

The TPR smart contract is going to be deployed on Polygon and support meta-transactions with the EIP-712 to reduce operational costs. Also, the contract can be easily migrate because it doesn't store or mint any token. The main purposes of this registry is to have an on-chain way to check whether an item has been approved by a committee member and therefore can be submitted to the Decentraland catalysts. And, the check whether a third party or item has been approved or rejected.

### Roles

The TPR smart contract supports different roles:

- Owner: the address that updates core things of the smart contract like the accepted token (MANA), committee smart contract address, the fee collector address, and the initial values for third parties and their items (approved or rejected).
- Committee Members: the committee members are going to be validated by querying the committee smart contract directly. Committee members can add a third party record, and approve/reject third parties and their items.
- Third Party Managers: the third party managers are a set of addresses that can add items to the third party record previously added by someone on the committee. Also, they can update the third party and items metadata.

### Third Party Records

The third party record is going to be identified by its unique id. For simplicity and in order to support different uses cases, this id is going to be a string. By using an string, we can support ids as URNs, UUIDs, auto incremental, etc. The current identifier used in Decentraland is URN. Therefore, an id urn like `urn:decentraland:matic:ext-thirdparty1` is what we expect.

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
- _`maxItems`_: represents the maximum number of items that a third party can have. We call them _item slots_. Item slots need to be bought. Everyone can buy them by MANA. So, it is not necessary to be a third party manager to buy item slots. Item slots are going to be bought by tiers (tier1: 100 items, tier2: 1000 items, tier3: 1000, etc.). The tiers' value and price are going to be defined in another smart contract called Tiers that will allow querying the tiers' price and value by its index. Also, items slots can be bought at any moment and multiple times.
- _`isApproved`_: whether a third party is approved or not.
- _`managers`_: third party managers.
- _`items`_: third party's items. An item has its own properties defined [here](#items).
- _`itemIds`_: in order to allow looping through the items added without the need of indexing historic events, we need to keep track of their ids.
- _`registered`_: simple boolean that helps to check whether a third party has been added or not.

A third party record can't be removed, but rejected by a committee member.

As we mention with the items, the third parties can be looped off-chain without the need of indexing historic events.

### Items

```solidity
struct Item {
    string metadata;
    string contentHash;
    bool isApproved;
    uint256 registered;
}
```

## Participants

- @Lautaro

- @Fernando

- @Juanca

- @Nacho
