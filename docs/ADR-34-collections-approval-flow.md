# Collections Technical Approval Flow

## Introduction

Every item as wearable, emotes, 3d object, PO, etc in Decentraland's world is represented by a non-fungible token ERC #721 that is indivisible and unique. Those items together defines a collection which works as a registry powered by a smart contract where it is defined all the information. A collection can be built by anyone but approved by a governance system (committee).

## Solution

A way to moderate the content of the Decentraland collections is needed to prevent spam, abuse, clone, and copyright. The Decentraland's collections will be created in the Polygon network governed by the Ethereum DCL DAO. The collection deployment will have a cost in MANA based on the items amount and its rarities. Each collection will be created as `rejected` waiting for the approval of the members of the committee. Once the collection is created in the blockchain successfully, all the collection's items will be uploaded to the content server with their respective properties and files. The content server will check that the collection was already created in the blockchain, is rejected, and also, the user who is trying to upload the items is the collection's creator or manager at this specific timestamp (block number). A collection must not be approved by the committee members if the items are not correctly submitted to the content server. While the collection is approved, changes are not allowed enforced by the collection smart contract.

After a collection is `approved`, the creator can request to make changes to one or more of the items in the collection in order to fix/update them. Therefore, the committee members must reject the collection first. Once the collection is rejected again, the collection's creator or manager can upload the changes to the content server. If the creator uses this to break the collection, anyone can create a DAO proposal to rescue/revert the item to a previous version. If the proposal ends affirmative, a committee member can perform the item's rescue mentioned [here](./ADR-32-wearable-committee-reverts.md)

To known more about the different collection's actors, refers to this [document](https://github.com/decentraland/wearables-contracts/blob/15b072ea52f4578d0e6867eb6e4f599c35fd6e83/Collections_V2_Actors.md).

## Tech

Each collection has a [`isApproved`](https://github.com/decentraland/wearables-contracts/blob/15b072ea52f4578d0e6867eb6e4f599c35fd6e83/contracts/collections/v2/ERC721BaseCollectionV2.sol#L60) property which starts as `false` once the collection is deployed. This property is set to `true` once someone on the committee approves it.

The content server checks access for every `WEARABLE` entity's `@POST`. The checks include if the collection is rejected and the user who is doing the request is the `creator` or `manager` of the collection/items at this specific timestamp (block number), and the items weigh less than 2MB.

Each item has a property called `contentHash` used to rescue/revert an item. To set that content hash [manual steps by a member of the committee are needed](./ADR-32-wearable-committee-reverts.md). But in terms of blockchain interactions two things are crucial:

- 1. Change the creatorship of the collection by calling `changeCreatorship` method.
- 2. Set the content hash by calling `rescueItems` method.

Both transactions should be done by calling the committee smart contract. You can see the interactions between contracts [here](https://github.com/decentraland/wearables-contracts/blob/15b072ea52f4578d0e6867eb6e4f599c35fd6e83/Collections_V2_Actors.md)

## Participants

- @shibu
- @agus
- @nacho
