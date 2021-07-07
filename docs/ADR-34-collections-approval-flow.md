# Collections Technical Approval Flow

## Introduction

Every item as wearable, emotes, 3d object, PO, etc in Decentraland's world is represented by a non-fungible token ERC #721 that is indivisible and unique. Those items together defines a collection which works as a registry powered by a smart contract where it is defined all the information. A collection can be built by anyone but approved by a governance system (committee).

## Solution

A way to moderate the content of the Decentraland collections is needed to prevent spam, abuse, clone, and copyright. The Decentraland's collections will be created in the Polygon network governed by the Ethereum DCL DAO. The collection deployment will have a cost in MANA based on the items amount and its rarities. Each collection will be created as `rejected` waiting for the approval of the members of the committee. While the collection is approved, changes are not allowed enforced by the collection smart contract.

After a collection is `approved`, the creator can request to make a change if he wants to update or fix an item. Therefore, the committee members must reject the collection first. If the creator uses this to break the collection, anyone can create a DAO proposal to rescue/revert the item to a previous version. If the proposal ends affirmative, a committee member can perform the item's rescue mentioned [here](./ADR-32-wearable-committee-reverts.md)

To known more about the different collection's actors, refers to this [document](https://github.com/decentraland/wearables-contracts/blob/15b072ea52f4578d0e6867eb6e4f599c35fd6e83/Collections_V2_Actors.md).

## Tech

Each collection has a [`isApproved`](https://github.com/decentraland/wearables-contracts/blob/15b072ea52f4578d0e6867eb6e4f599c35fd6e83/contracts/collections/v2/ERC721BaseCollectionV2.sol#L60) property which starts as `false` once the collection is deployed. This property is set to `true` once someone of the committee approves it.

Each item has a property called `contentHash` used to rescue/revert an item. To set that content hash [manual steps by a member of the committee are needed](./ADR-32-wearable-committee-reverts.md). But in terms of blockchain interactions two things are crucial:

- 1. Change the creatorship of the collection by calling `changeCreatorship` method.
- 2. Set the content hash by calling `rescueItems` method.

Both transactions should be done by calling the committee smart contract. You can see the interactions between contracts [here](https://github.com/decentraland/wearables-contracts/blob/15b072ea52f4578d0e6867eb6e4f599c35fd6e83/Collections_V2_Actors.md)

## Participants

- @shibu
- @agus
- @nacho
