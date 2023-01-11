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

### How it works?

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
