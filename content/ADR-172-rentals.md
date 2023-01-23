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

The contract of the asset to be rented must be [ERC721](https://eips.ethereum.org/EIPS/eip-721) compliant. Moreover, it has to expose an extra function `setUpdateOperator(uint256 tokenId,address)`, like to the one found on the [LANDRegistry](https://etherscan.io/address/0x554bb6488ba955377359bed16b84ed0822679cdc#code) and [EstateRegistry](https://etherscan.io/address/0x1784ef41af86e97f8d28afe95b573a24aeda966e#code) contracts.

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

Define the address that will be able to work on the asset when the rental is executed. In the case of Land for example, this method will determine the address that can deploy scenes to it.

There are 2 extra functions that the Rentals contract *may* call from the rented asset but they depend on the implementation and might not be required like the previous ones.

**verifyFingerprint** 

Only when `supportsInterface` returns that the asset contract implements this method, it will be called. This method validates that composable assets, such as Estates, have not been modified before the rental is executed, preventing tenants from renting an asset different than expected.

**setManyLandUpdateOperator**

This function is a workaround for setting update operators for parcels inside an Estate. Any other asset does not need to implement it (unless a similar requirement is needed).

### Listings and Offers

Listings and Offers are data structures that contain the information required to execute a rental. A Listing is created by the owner of an asset that want to list an asset for rent given a set conditions. An Offer is created by any user that wants to rent a certain asset for a given set of conditions.

**Listing**

- **address signer** - The address of the owner of the asset to be rented.
- **address contractAddress** - The address of the to-be-rented asset's contract.
- **uint256 tokenId** - The id of the asset.
- **uint256 expiration** - The timestamp up to when the listing can be executed.
- **uint256[3] indexes** - The indexes used for extra signature verification, learn more about it [here](#can-signatures-be-invalidated).
- **uint256[] pricePerDay, maxDays, minDays** - The different options provided in the Listing that be selected by the user that accepts it. The price per day is how much MANA will be paid up front for each day the asset will be rented. max and minDays determine the range of days the asset can be rented for a given price.
- **address target** - The address of the account this Listing is targeted to. If the value is not the `address(0)` only the target can accept it.

**Offer**

- **address signer** - The address of the account interested in renting an asset.
- **address contractAddress** - The address of the to-be-rented asset's contract.
- **uint256 tokenId** - The id of the asset.
- **uint256 expiration** - The timestamp up to when the listing can be executed.
- **uint256[3] indexes** - The indexes used for extra signature verification, learn more about it [here](#can-signatures-be-invalidated).
- **uint256 pricePerDay** - The amount of MANA the tenant is willing to pay upfront per rental day for the asset.
- **uint256 rentalDays** - The amount of days the tenant wants to rent the asset.
- **address operator** - The address that will be given update operator permissions over the asset. In the case of Land, it will be the account that has permissions to deploy scenes on it. If the operator is set as address(0) the `signer` will be given the update operator role.

Listings and Offers are a fundamental part of being able to rent an asset, however, this kind of data does not need to be tracked on-chain for a rental to occur.

To prevent users from spending money on creating/updating/deleting them, they are handled off-chain by making use of [EIP712](https://eips.ethereum.org/EIPS/eip-712) for hashing and signing typed structured data. The data and its signature is then stored in a place where the consumer can access it and initiate a rent.

<img src="resources/ADR-172/diagram-1.png" alt="drawing" style="width:100%;"/>

The diagram shows the flow of a lessor creating and signing a Listing that is then stored off-chain. The tenant fetches both to start a new a new rental.

### How it works

The [Rentals Smart Contract](https://etherscan.io/address/0x3a1469499d0be105d4f77045ca403a5f6dc2f3f5#code) allows users to accept Rental Listings and Offers. 

These can be created off-chain by signing them with your wallet and storing the data and signature in a place consumable by an interested user.

The benefit of using off-chain signatures is that users can create Listings and Offers without needing to pay for a transaction.

The Land owner can accept an Offer by calling the `acceptOffer` function or safely transferring the Land to the Rentals contract with the offer data and signature. 

A user interested in renting Land can accept a Listing by calling the `acceptListing` function on the contract with the Listing data and signature.

Successfully accepting any of these will start a Rental that will last as long as the Listing/Offer stipulated, MANA will be transferred from the tenant to the lessor, the rented Land will be transferred to the Rentals contract, and the tenant or any address determined by the tenant will be set as update operator of the Land to be able to deploy scenes.

### Why is the Land transferred to the Rentals contract?

It is to limit what the original owner of the asset can do with the Land by transferring the ownership to the Rentals contract. The owner cannot interact directly with the asset anymore, so have to use a set of functions defined by the Rentals smart contract to do so.

For example, Once a rental starts, the owner can't do anything until the rental period ends. In that case, they can `claim` the Land back, rent it again the same way as before,  or set a different update operator to overwrite the one set by the tenant and prevent its further use.

### What happens when the rental ends?

Nothing actively happens. Unless the owner changes something, the update operator defined by the tenant can still deploy scenes. The owner can claim the Land back, rent it again or change the update operator to prevent the tenant from using it.

### Can signatures be invalidated?

A mechanism to do so was added to the Rentals contract as a safety measure.

Listings and Offers are signed with a parameter with three different numbers called `indexes` to check if it is still valid. 

Contract Index: It can be increased by the owner of the Rentals contract to invalidate all signatures.

Signer Index: Can be increased to invalidate all signatures created by the user.

Asset Index: Can be increased to invalidate all signatures created by the user for a certain Land.

### Can Parcels inside a rented Estate be given individual update operator permissions?

Yes.

The Rentals contract exposes a function `setManyLandUpdateOperator` that can be called by the tenant (or the owner if the rental is over) to set the update operator of Parcels inside an Estate.

This is also helpful because when the Estate is transferred for rental, internal Parcel permissions are not reset, so the tenant might need to call this function to prevent older tenants from overriding new deployments.

### Can [Smart Contract Accounts (SCA)](https://ethereum.org/en/developers/docs/accounts/#contract-accounts) create Listings or Offers?

Only [Externally Owned Accounts (EOA)](https://ethereum.org/en/developers/docs/accounts/#externally-owned-accounts-and-key-pairs) can sign messages with their private keys, meaning that only an EOA can sign Listings and/or Offers. 

However, there is a workaround for an SCA to create Listings and Offers by implementing [ERC1271](https://eips.ethereum.org/EIPS/eip-1271).

By doing so, an EOA can create the signature with the SCA address as `signer` and the Rentals contract will call the `isValidSignature` method of the SCA to validate that the signature was created by an authorized EOA.

This is useful for the cases in which a SCA has a Land and the owner or owners of that account do not want to transfer it to their accounts in order to rent it. One of the owners will sign the Listing and/or Offer with the SCA as `signer` and it will be valid (always depending on how ERC1271 is implemented on the SCA).

## Solution Space Exploration

The Rentals Smart Contract by itself might not be too easy to use, specially because handling signatures is a complex thing.

In order for the contract to be used successfully, a dapp to facilitate signing and server to handle this signatures will be required.

The contract design does not require any existing protocol to be updated.


## Specification

[Rentals Smart Contract](https://goerli.etherscan.io/address/0x92159c78f0f4523b9c60382bb888f30f10a46b3b) deployed on the Goerli network on Sep 30, 2022

[Rentals Smart Contract](https://etherscan.io/address/0x3a1469499d0be105d4f77045ca403a5f6dc2f3f5#code) deployed on Mainnet on Nov 28, 2022

Rentals feature went live on the [Marketplace](https://market.decentraland.org) and [Builder](https://builder.decentraland.org) with its [first](https://etherscan.io/tx/0x04615578483b03a36209e338cad787774db5f85bddc4fbce3079e7f4761285ae) executed rental on Dec 05, 2022 

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
