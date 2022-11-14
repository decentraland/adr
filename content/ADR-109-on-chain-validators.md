---
adr: 109
date: 2022-09-28
title: On-chain validators
authors:
  - nachomazzara
status: Draft
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-9
---

# Abstract

Evaluates an alternative to validate deployments in the content server to remove the dependency on TheGraph. Using an RPC provider and a set of upgradable smart contracts are enough to validate access to the entities being deployed.

# Introduction

Remove the usage of subgraphs on behalf of smart contracts to perform validations when deploying entities (access-checkers). This removes the dependency with subgraphs and creates an immutable and decentralized way of validating entity deployments that need to query blockchain information. The content server will still need to use an RPC provider but this RPC is also used nowadays to validate smart contract wallets' deployments.

The final goal is to have a set of different upgradable smart contracts managed by the DAO that emulate the subgraphs. The DAO will be in charge of upgrading them in case of any issues or new logic needed.

**Disclaimer: This document also describes some migration ideas needed to make profile validations possible. The effort needed for the migration won't be covered. It will require a new RFC or ADR describing the migration proposal. Lambdas are out of the scope for this iteration as they are not part of the Decentraland Protocol.**

## Analysis

Subgraphs are being used by the content server to check the access to:

- LANDs
- Collections items
- ThirdParty Wearables
- Ethereum & Polygon block numbers
- Decentraland Names

There are two types of deployments:

- Organic deployments: the timestamp of the entity is now().
- Sync deployments: the timestamp of the entity is in the past. Used when a catalyst bootstraps or needs to catch up with the latest state.

The following sections will describe how to use only RPC calls and smart contracts to validate deployments by entity type.

### Ethereum & Polygon block numbers

Each entity deployment has a timestamp. We get the block number for that timestamp by using [subgraphs](https://github.com/decentraland/ethereum-blocks) per each chain. It is not possible to get a block number by timestamp directly with only one RPC request because timestamps are just part of the block metadata. In order to remove this dependency, we need extra work:

- A) Use a [binary search](https://github.com/nachomazzara/eth-block-timestamp) or any other new way to get the closest block for a given timestamp.
- B) Start adding block numbers to the deployments. For old deployments, we can create an immutable file with all the blocks per each timestamp used for previous deployments. This file will have a fixed size because new deployments will have the block number directly inside the deployment. The client can get the latest block number. The content server will keep using the 5 minutes window for validate deployments.

### Profiles

- **Entity**: Profile
- **Pointer**: Ethereum Address. E.g: `0x5e5d9d1dfd87e9b8b069b8e5d708db92be5ade99`
- **Contracts**: Decentraland Collections (Ethereum & Polygon). Decentraland Name.
- **Check**: Every profile deployment checks if the address owns the wearables, emotes and Decentaland name.

#### Decentraland Name

The [DCLRegistrar](https://etherscan.io/address/0x2a187453064356c898cae034eaed119e1663acb8) contract has a method to get who is the owner of a specific domain: _`getOwnerOf(subdomain: string)`_.

#### Wearables & Emotes

Each Profile entity stores the wearables and emotes equipped by the user. Wearables are stored under `entity.metadata.avatar.wearables` as an array of item URNs, and Emotes are stored under `entity.metadata.avatar.emotes` as an array of `{ slot: string, urn: string }`. In both cases, the URNs used are the item's urn, not the token's urn. Checking if a user owns a specific item does not scale, since it would require looping within a contract method. Users that own too many NFTs or collections that are too big could cause this to lag or timeout. Another alternative could be making several RPC calls between the catalyst and the Ethereum nodes, which also would not scale well. We should start storing the token's urn within the profiles to make the access checks possible in a single RPC call. The ERC721 standard has a method `ownerOf(tokenId: uint256)` which serves to get the owner of the NFT.

This document will propose two ideas on how the old profiles can be migrated but an new RFC or ADR should be needed describing the final approach.

- **Alternative 1**

  Use the Decentraland Address to signal profile deployments in order to consider them valid without the need to perform further validations. It can be a new field to the profiles schema to avoid re-deploying the profiles by the Decentraland address which can duplicate the storage. If duplicating the profiles is the only alternative, then old ones can be removed.

- **Alternative 2**

  Build a [Merkle tree with every profile hash](https://github.com/decentraland/content-hash-tree) and submit the root to a smart contract. A static file must be added to the repository with all the proofs needed to check if a deployment is part of the tree. The file with the proofs may weight [~100MB for 1M of profiles](https://github.com/decentraland/content-hash-tree#generate-a-tree-with-content-hashes).

For new profiles, a new ADR with a date to make it effective to start receiving profiles with an extended urn with the token id at the end. This implies changes in the Explorer, Kernel, Catalysts, and URN Resolver. New urn resolvers

- `decentraland:{protocol}:collections-v1:{contract(0x[a-fA-F0-9]+)}:{itemName}`
- `decentraland:{protocol}:collections-v1:{collection-name}:{itemName}`
- `decentraland:{protocol}:collections-v2:{contract(0x[a-fA-F0-9]+)}:{itemId}`
- `decentraland:{protocol}:collections-v1:{contract(0x[a-fA-F0-9]+)}:{itemId}:{tokenId}` -> new
- `decentraland:{protocol}:collections-v1:{collection-name}:{itemName}:{tokenId}` -> new
- `decentraland:{protocol}:collections-v2:{contract(0x[a-fA-F0-9]+)}:{itemId}:{tokenId}` -> new

The **Explorer** should show the items grouped by item kinds but allow the user to select the specific NFT to add to their profile. Once the users save their profile for the first time once the ADR is running effectively, a process in the client should select the first NFT for each item kind saved in the profile. E.g: if the user has this item `urn:decentraland:ethereum:collections-v1:wonderzone_steampunk:steampunk_jacket` selected in their profile but he has 10 of them with the token ids from `1` to `10`, the explorer should select the first (`urn:decentraland:ethereum:collections-v1:wonderzone_steampunk:steampunk_jacket:1`) one and replace it. For off-chain wearables, we should not do any kind of validation.

The **Kernel** and the **Catalysts** should accept and return all the NFTs. The lambdas e.g: `/collections/wearables-by-owner/{address}` and `/collections/emotes-by-owner/{address}` will return the NFTs' urns and not the items' urns. There is a change needed in the collections subgraphs as well to use the NFT urn instead of the item urn for the NFT entity ([1](https://github.com/decentraland/collections-graph/blob/7cd1754b9114dbe79daa49df0a759fd57b80e48d/src/handlers/nft.ts#L49); [2](https://github.com/decentraland/collections-graph/blob/7cd1754b9114dbe79daa49df0a759fd57b80e48d/src/handlers/nft.ts#L251)).

The catalyst should extract the contract address and token id from each asset in the profile to check if the profile owner owns the NFT by using `IERC721(contract_address).ownerOf(tokenId)`. Also, the contract address must be a valid one: a Decentraland or ThirdParty collection.

<details>
<summary>Entity Example</summary>

```JSON
{
  "entityVersion": "v3",
  "entityType": "profile",
  "entityId": "bafkreihf6pm7ethywxzjta364wixtrqcrc4th6miumczizldc32rythzua",
  "entityTimestamp": 1663327122490,
  "deployedBy": "0x87956abc4078a0cc3b89b419928b857b8af826ed",
  "pointers": [
    "0x87956abc4078a0cc3b89b419928b857b8af826ed"
  ],
  "content": [
    {
      "key": "body.png",
      "hash": "bafkreibalpcvevsbke5r4vzkbkltjwwgfxm6mkl74asxtxlgrvgbqxafma"
    },
    {
      "key": "face256.png",
      "hash": "bafkreietgcdkbx6mtuxcfjxwifxyicpe5s2mtumycbvlfxvsdn3htnxlse"
    }
  ],
  "metadata": {
    "avatars": [
      {
        "hasClaimedName": true,
        "name": "Nacho",
        "description": "This is fine",
        "tutorialStep": 355,
        "userId": "0x87956abc4078a0cc3b89b419928b857b8af826ed",
        "email": "",
        "ethAddress": "0x87956abc4078a0cc3b89b419928b857b8af826ed",
        "version": 62,
        "avatar": {
          "bodyShape": "urn:decentraland:off-chain:base-avatars:BaseMale",
          "wearables": [
            "urn:decentraland:off-chain:base-avatars:tall_front_01",
            "urn:decentraland:off-chain:base-avatars:eyes_08",
            "urn:decentraland:off-chain:base-avatars:eyebrows_00",
            "urn:decentraland:off-chain:base-avatars:mouth_05",
            "urn:decentraland:off-chain:base-avatars:classic_shoes",
            "urn:decentraland:off-chain:base-avatars:trash_jean",
            "urn:decentraland:ethereum:collections-v1:wonderzone_steampunk:steampunk_jacket",
            "urn:decentraland:matic:collections-v2:0xf6f601efee04e74cecac02c8c5bdc8cc0fc1c721:0"
          ],
          "emotes": [
            {
              "slot": 1,
              "urn": "wave"
            },
            {
              "slot": 2,
              "urn": "urn:decentraland:matic:collections-v2:0x875146d1d26e91c80f25f5966a84b098d3db1fc8:1"
            },
            {
              "slot": 3,
              "urn": "urn:decentraland:matic:collections-v2:0xef832a5183bf2e4099efed4c6ec981b7b41aa545:0"
            },
            {
              "slot": 4,
              "urn": "raiseHand"
            },
            {
              "slot": 5,
              "urn": "headexplode"
            },
            {
              "slot": 6,
              "urn": "money"
            },
            {
              "slot": 7,
              "urn": "kiss"
            },
            {
              "slot": 8,
              "urn": "fistpump"
            },
            {
              "slot": 9,
              "urn": "handsair"
            }
          ],
          "snapshots": {
            "body": "bafkreibalpcvevsbke5r4vzkbkltjwwgfxm6mkl74asxtxlgrvgbqxafma",
            "face256": "bafkreietgcdkbx6mtuxcfjxwifxyicpe5s2mtumycbvlfxvsdn3htnxlse"
          },
          "eyes": {
            "color": {
              "r": 0.23046875,
              "g": 0.625,
              "b": 0.3125,
              "a": 1
            }
          },
          "hair": {
            "color": {
              "r": 0.35546875,
              "g": 0.19140625,
              "b": 0.05859375,
              "a": 1
            }
          },
          "skin": {
            "color": {
              "r": 0.94921875,
              "g": 0.76171875,
              "b": 0.6484375,
              "a": 1
            }
          }
        },
        "interests": [],
        "hasConnectedWeb3": true
      }
    ]
  },
  "localTimestamp": 1663327126487
}
```

</details>

### Scenes

- **Entity**: Scenes
- **Pointer**: x,y
- **Contracts**: LAND & Estate
- **Check**: The LANDRegistry and Estate smart contracts should be used to check the validity of a scene deployment. The check should be performed through all the possible LAND and Estate roles. Every role can be fetched directly on-chain from each smart contract.

#### LANDRegistry

Checks by using the coordinates and the entity deployer (signer):

- If the deployer is the `owner` of the LAND.
- If the deployer has `operator` rights for the LAND.
- If the deployer has `approvalForAll` rights for the LAND.
- If the deployer has `updateOperator` rights for the LAND.
- If the deployer has `updateManager` rights for the LAND.

#### Estate

If the LAND is owned by the Estate Contract. The estate id should be retrieved. Checks by using the estate id and the entity deployer (signer):

- If the deployer is the `owner` of the Estate.
- If the deployer has `operator` rights for the Estate.
- If the deployer has `approvalForAll` rights for the Estate.
- If the deployer has `updateOperator` rights for the Estate.
- If the deployer has `updateManager` rights for the Estate.

If **any** of the above checks is valid, the deployment is valid.

### Ethereum Items

- **Entity**: Wearable
- **Pointer**: `decentraland:{protocol}:collections-v1:{contract(0x[a-fA-F0-9]+)}:{itemName}` (Item URN)
- **Contracts**: Ethereum Decentraland Collections
- **Check**: Off-chain check. The only signer allowed to deploy Ethereum wearables is the Decentraland Address. Decentraland is not creating more collections in Ethereum. The ones created are considered **legacy** and the addresses are known beforehand. A list of those addresses can be used to check if the collection address is valid.

### Polygon Items: Wearables & Emotes

- **Entity**: Wearable & Emote
- **Pointer**: `decentraland:{protocol}:collections-v2:{contract(0x[a-fA-F0-9]+)}:{itemId}` (Item URN)
- **Contracts**: Polygon Decentraland Collections
- **Check**: Each collection in Polygon is created by a collection factory. The addresses of the factories are known in advance. At the time of this RFC, Decentraland has only two collection factories. The information needed to check the validity of the deployment is the contract address and the item id which should be extracted from the urn, and the content hash and the signer of the deployment. The on-chain validations needed are:

- If the collection was created by any official Decentraland factory.
- If the collection is completed.
- If the collection is approved.
- If the signer is the `creator`, `manager` and/or `itemManager` of the collection.
- If the `contentHash` of the item in the contract matches to the content hash of the deployment

If **every** of the above checks are true, the deployment is valid.

### Third Party Wearables

- **Entity**: ThirdParty Wearable
- **Pointer**: `decentraland:{protocol}:collections-thirdparty:{thirdPartyName}:{collectionId}:{itemId}` (Item URN)
- **Contracts**: Decentraland ThirdPartyRegistry
- **Check**: The information needed to perform the validity of the deployment is the thirdparty id extracted from the urn, the Merkle Tree root, and the signer extracted from the deployment. The on-chain validations needed are:

- If the third party is approved
- If the signer is a `manager` of the third party.
- If the third party `root` in the contract matches to the root in the deployment payload.

If **every** of the above checks are true, the deployment may be valid. The catalyst also checks if the content hash of the deployment is part of the Merkle Tree in order to consider the deployment valid.
