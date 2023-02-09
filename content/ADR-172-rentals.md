---
layout: adr
adr: 172 
title: Rentals
date: 2023-01-10
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - fzavalia
---

## Abstract

This document will talk about the Rentals Smart Contract on the Ethereum network that enables the rental of Land (Parcels and Estates) and other compatible ERC721 assets.

## Context, Reach & Prioritization

Rentals are a great way to earn passive income over assets. This will benefit owners that currently hold Land but don't know or want to build on it, creators that might find it expensive to buy Land and deploy scenes on it, and the whole of Genesis City as more and more creators will have access to populate and give it more life.

Being able to rent your Land was something the community has been asking for a while now. Rental solutions exist, from dapps and smart contracts deployed by the community to rentals being handled off-chain in a peer-2-peer manner.

However, unofficial protocols and off-chain solutions might not take into consideration the best security practices to protect users as well as Decentraland's most precious assets. That is why Decentraland has developed its protocol.

### Supported Assets

The [IERC721Rentable](https://github.com/decentraland/rentals-contract/blob/dbfc6a44b9a6882f6a6ccc4846c67307fd8d7980/contracts/interfaces/IERC721Rentable.sol) interface provides a glimpse of what kind of assets are compatible with the Rentals contract.

The contract of the asset to be rented must be [ERC721](https://eips.ethereum.org/EIPS/eip-721) compliant. Moreover, it has to expose an extra function `setUpdateOperator(uint256 tokenId,address)`, like the one found on the [LANDRegistry](https://etherscan.io/address/0x554bb6488ba955377359bed16b84ed0822679cdc#code) and [EstateRegistry](https://etherscan.io/address/0x1784ef41af86e97f8d28afe95b573a24aeda966e#code) contracts.

The required methods are:

**ownerOf**

Checks if the asset has to be transferred to the Rentals contract after executing a Rental.

Checks if the asset was transferred "unsafely" using the `ERC20.transferFrom` function to the Rentals contract.

**safeTransferFrom**

Transfer the asset from the original owner to the Rentals contracts when the rental is executed.

Transfer the asset back to the original owner when they claim it back after the rental period is over.

**supportsInterface**

Checks that the asset's contract implements the `verifyFingerprint(uint256, bytes memory)` method.

**setUpdateOperator** 

Define the address that will be able to work on the asset when the rental is executed. In the case of Land, for example, this method will determine the address that can deploy scenes to it.

There are 2 extra functions that the Rentals contract *may* call from the rented asset but they depend on the implementation and might not be required like the previous ones.

**verifyFingerprint** 

Only when `supportsInterface` returns that the asset contract implements this method, it will be called. This method validates that composable assets, such as Estates, have not been modified before the rental is executed, preventing tenants from renting an asset different than expected.

**setManyLandUpdateOperator**

This function is a workaround for setting update operators for parcels inside an Estate. Any other asset does not need to implement (unless a similar requirement is needed).

### Listings and Offers

Listings and Offers are data structures that contain the information required to execute a rental. A Listing is created by the owner of an asset that wants to list an asset for rent given a set of conditions. An Offer is created by any user that wants to rent a certain asset for a given set of conditions.

**Listing**

- **address signer** - The address of the owner of the asset to be rented.
- **address contractAddress** - The address of the to-be-rented asset's contract.
- **uint256 tokenId** - The id of the asset.
- **uint256 expiration** - The timestamp up to when the listing can be executed.
- **uint256[3] indexes** - The indexes used for extra signature verification, learn more about it [here](#verification-indexes).
- **uint256[] pricePerDay, maxDays, minDays** - The different options provided in the Listing that be selected by the user that accepts it. The price per day is how much MANA will be paid upfront for each day the asset will be rented. max and minDays determine the range of days the asset can be rented for a given price.
- **address target** - The address of the account this Listing is targeted to. If the value is not the `address(0)` only the target can accept it.

**Offer**

- **address signer** - The address of the account interested in renting an asset.
- **address contractAddress** - The address of the to-be-rented asset's contract.
- **uint256 tokenId** - The id of the asset.
- **uint256 expiration** - The timestamp up to when the listing can be executed.
- **uint256[3] indexes** - The indexes used for extra signature verification, learn more about it [here](#verification-indexes).
- **uint256 pricePerDay** - The amount of MANA the tenant is willing to pay upfront per rental day for the asset.
- **uint256 rentalDays** - The number of days the tenant wants to rent the asset.
- **address operator** - The address that will be given update operator permissions over the asset. In the case of Land, it will be the account that has permission to deploy scenes on it. If the operator is set as address(0) the `signer` will be given the update operator role.

Listings and Offers are a fundamental part of being able to rent an asset, however, this kind of data does not need to be tracked on-chain for a rental to occur.

To prevent users from spending money on creating/updating/deleting them, they are handled off-chain by making use of [EIP712](https://eips.ethereum.org/EIPS/eip-712) for hashing and signing typed structured data. The data and its signature are then stored in a place where the consumer can access it and initiate a rent.

<img src="resources/ADR-172/diagram-1.png" alt="drawing" style="width:100%;"/>

The diagram shows the flow of a lessor creating and signing a Listing that is then stored off-chain. The tenant fetches both to start a new rental.

### Verification Indexes

Listings and Offers have an `indexes` property that is an array composed of 3 integers. Each one of these integers represents a verification index that the Rentals contract will use to verify that the Listing/Offer is still valid. 

Any of these indexes can be updated at any time to invalidate signatures. Each index is updated differently and is in charge of invalidating signatures in different ways.

**Contract Index**

This index can be updated by the owner of the Rentals contract. Updating this index with `bumpContractIndex()` will invalidate all signatures created with the previous value. It is intended to be used in case there is a signature leak from the off-chain signature storage to protect users.

**Signer Index** 

Each address has its signer index. Updating this index with `bumpSignerIndex()` will update the index of the sender. This is helpful for users that have lost track of their signatures and want to invalidate them all at once.

**Asset Index**

Similar to the Signer Index, but for particular assets. Instead of invalidating all signatures created by an address, a user can call `bumpAssetIndex(address _contractAddress, uint256 _tokenId)` to invalidate all signatures created for a particular asset.

### Signatures

Executing a rental requires calling particular functions in the Rentals contract with a Listing/Offer and a signature obtained from that data using a private key. The way the data has to be signed is determined by [EIP712](https://eips.ethereum.org/EIPS/eip-712)

Listings and Offers have a property `signer`. The value of this property has to match the recovered signer from the provided signature. If they don't match, it means that the signature is invalid and the rental transaction will revert.

Account A signs Listing with signer B ❌

Account A signs Listing with signer A ✅

<img src="resources/ADR-172/diagram-2.png" alt="drawing" style="width:100%;"/>

Smart Contract Accounts don't have private keys. This means that the account is unable to sign a Listing/Offer. If a user has a Smart Wallet with an asset they want to rent, it would be impossible to do so this way.

For cases like this, the Rentals contract detects if the provided signer is a Smart Contract Account that follows the [ERC1271](https://eips.ethereum.org/EIPS/eip-1271) standard. It calls the `isValidSignature` of the provided signer and delegates the validation. This way, an Externally Owned Account that has control over a Smart Contract Account such as Smart Wallets can create Listings/Offers in their name.

EOA A signs Listing with signer B that is a Smart Wallet owned by A ✅

<img src="resources/ADR-172/diagram-3.png" alt="drawing" style="width:100%;"/>

### Asset Lifecycle

The first time an asset is rented, it is transferred from its original owner to the Rentals contract. This transfer prevents the asset from being operated freely by the lessor while the rental is running. In this case, the contract acts as an escrow that makes sure that only a limited amount of actions can be performed on the asset that are only relevant to renting it.

**Rental Ongoing**

The tenant can set its update operator as many times as desired. In the particular case of Estates, the tenant can set the update operators of internal parcels as well through the Rentals contract. The lessor is unable to operate the asset in any way.

As long as the tenant and the lessor are the same, a new Listing/Offer can be accepted to extend the rent.

**Rental Finished**

Once the rental ends, the lessor is the one that can do the previously mentioned actions while the tenant can't do them anymore.

The lessor also has the option to claim the asset back, causing it to be transferred back from the Rentals contract to its original owner. 

The lessor can also create new Listings or accept new Offers for the asset without the need of claiming it back. This is called a re-rent. This saves some gas because an extra transaction is prevented.

<img src="resources/ADR-172/diagram-4.png" alt="drawing" style="width:100%;"/>

## Solution Space Exploration

The Rentals Smart Contract by itself might not be too easy to use, especially because handling signatures is a complex thing.

For the contract to be used successfully, a dapp to facilitate signing and a server to handle these signatures will be required.

The contract design does not require any existing protocol to be updated.


## Specification

[Rentals Smart Contract](https://goerli.etherscan.io/address/0x92159c78f0f4523b9c60382bb888f30f10a46b3b) deployed on the Goerli network on Sep 30, 2022

[Rentals Smart Contract](https://etherscan.io/address/0x3a1469499d0be105d4f77045ca403a5f6dc2f3f5#code) deployed on Mainnet on Nov 28, 2022

Rentals feature went live on the [Marketplace](https://market.decentraland.org) and [Builder](https://builder.decentraland.org) with its [first](https://etherscan.io/tx/0x04615578483b03a36209e338cad787774db5f85bddc4fbce3079e7f4761285ae) executed rental on Dec 05, 2022 

## RFC 2119 and RFC 8174

> The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
