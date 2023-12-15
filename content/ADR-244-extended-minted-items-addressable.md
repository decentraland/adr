---
layout: adr
adr: 244
title: Extended Content Addressable URNs for Decentraland minted items
date: 2023-07-28
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
- aleortega
---

# Abstract

This ADR proposes an extension to the content-addressable URN format specifically for Decentraland minted items. The extension will enable the representation of unique minted wearable NFT items with an additional token ID. The inclusion of the token ID in the URN allows for precise identification and differentiation of individual minted items, enhancing the ownership validation process.

## Context, Reach & Prioritization

Decentraland offers a robust ecosystem supporting various NFTs, with emotes and wearables being significant components that users can create and exchange. These minted items hold unique ownership histories, allowing users to mint and trade one or more of them. However, a problem arises when trying to differentiate between individual minted wearables and emotes within the Decentraland metaverse accurately. The existing definition of URN, as per the standard RFC-8141, lacks the capability to distinguish between these unique minted items. Consequently, a URN equivalence issue arises, making it impossible to identify which specific minted item is managing. This issue stems from the fact that the URN does not include the token ID of each minted item, which is essential for identifying the user's managed item among all the minted ones.

To address this limitation and enhance the representation of wearable NFT ownership, we propose an extension to the content-addressable URN format specifically tailored for minted items. This extension introduces an optional token ID part at the end of the URN, designed exclusively for emotes and wearables. By selectively incorporating this token ID in the URN, we enable precise identification of each minted item, ensuring that no two minted  or emotes share the same URN within the Decentraland ecosystem.

The purpose of this update is twofold:

1. **Unambiguous Wearable Identification**: The inclusion of the token ID in the content-addressable URN guarantees unambiguous identification of each minted wearable NFT item within Decentraland. With the token ID, users, content creators, and developers can confidently validate ownership of specific minted wearable assets, accurately tracking their provenance and uniqueness.

2. **Enhanced Ownership Validation**: The extended URN format significantly enhances the ownership validation process for minted items. By leveraging the unique token ID, the Catalyst's content validation system can effectively verify and confirm ownership of individual minted wearable items, streamlining interactions within the Decentraland metaverse.

Let's consider an example where a user mints two identical blue shirts from a specific V2 collection. Currently, the URNs for each NFT appear as follows:
* **First blue shirt**: urn:decentraland:mumbai:collections-v2:0x02101c138653a0af06a45b729d9c5d6ba27b8f4a:0
* **Second blue shirt**: urn:decentraland:mumbai:collections-v2:0x02101c138653a0af06a45b729d9c5d6ba27b8f4a:0

Once this ADR takes effect, the URNs will be modified as follows:
* **First blue shirt**: urn:decentraland:mumbai:collections-v2:0x02101c138653a0af06a45b729d9c5d6ba27b8f4a:0:1
* **Second blue shirt**: urn:decentraland:mumbai:collections-v2:0x02101c138653a0af06a45b729d9c5d6ba27b8f4a:0:2

In these updated URNs, the last part of each URN (:1 and :2) represents the token ID, which becomes essential in identifying the specific blue shirt managed by the user.

**This modification will exclusively apply to minted items originating from V1 and V2 collections, while third-party items will remain unaffected and not undergo any alterations. Consequently, APIs' consumers should handle both types of URNs (_shortened and extended_) depending on the asset being managed, ensuring the distinction between V1 and V2 collection items and third-party items is maintained.**

# Specification

The extended content-addressable URN format for Decentraland emotes and wearables will be applied over collections v1 and v2 specifically. This extension was already proposed in the [ADR-109](/adr/ADR-109) on the second alternative:

```
decentraland:{protocol}:collections-v1:{contract(0x[a-fA-F0-9]+)}:{itemId}:{tokenId}
```

* **tokenID**: The unique identifier of the minted wearable NFT item, distinguishing it from other items of the same wearable content type and content identifier.

The token ID part is optional and will only be used when addressing specific minted wearable NFT items. For other content types, such as scenes or other types of NFTs, the token ID part will not be added at the time of this writing.

The migration of the minted items to the new URN format will be done in a progressive manner. The **Explorer** will show the items grouped by item kinds but allow the user to select the specific NFT to add to their profile. Once the users save their profile for the first time and this ADR is running effectively, a process in the client should select the first NFT for each item kind saved in the profile.

Starting from `1692673200` (Tuesday 22 of August), this ADR will come into effect. This means that the Catalyst Content Server will begin rejecting new profile updates related to wearables or emotes that do not include a token ID, except for the base ones. Upon upgrading the nodes version, the endpoints returning wearable URNs will be modified to include this last token ID part.

## Catalyst endpoints changes

In this section, you will find a comprehensive list of all the changes that will be implemented across the Catalyst endpoint contracts. 

### Content Server

#### POST /content/entities

From the specified date onwards, all URNs associated with minted wearables and emotes arriving at this endpoint must adhere to the extended format: `decentraland:{protocol}:collections-{version}:{contract(0x[a-fA-F0-9]+)}:{itemId}:{tokenId}`. This requirement applies specifically to V1 and V2 collections.

If any URN is received that does not conform to this extended format, the endpoint will reject any attempts to deploy such an entity. 

### Lambdas

#### GET /lambdas/profiles/{address}

This endpoint will now provide the extended URNs for minted wearables and emotes on the respective properties: `avatars[].avatar.wearables` and `avatars[].avatar.emotes`. Prior to this update, the endpoint returned different URN formats. With the change, you can expect to receive extended URNs for a more consistent and comprehensive representation of minted wearables and emotes in the specified properties.

#### POST /lambdas/profiles

This endpoint will now provide the extended URNs for minted wearables and emotes on the respective properties: `avatars[].avatar.wearables` and `avatars[].avatar.emotes`. Prior to this update, the endpoint returned different URN formats. With the change, you can expect to receive extended URNs for a more consistent and comprehensive representation of minted wearables and emotes in the specified properties.

#### GET /lambdas/users/{address}/wearables

The endpoint's response will return the extended URN format in the `id` property for each minted wearable. The new format is as follows: `decentraland:{protocol}:collections-{version}:{contract(0x[a-fA-F0-9]+)}:{itemId}:{tokenId}`.

Previously, the endpoint provided an older format that lacked the `tokenId` part. This update ensures that the `tokenId` component is now included in the `id` property.

#### GET /lambdas/users/{address}/emotes

The endpoint's response will return the extended URN format in the `id` property for each minted emote. The new format is as follows: `decentraland:{protocol}:collections-{version}:{contract(0x[a-fA-F0-9]+)}:{itemId}:{tokenId}`.

Previously, the endpoint provided an older format that lacked the `tokenId` part. This update ensures that the `tokenId` component is now included in the `id` property.

#### GET /lambdas/profiles/outfits/{address}

Starting from the proposed date, this endpoint will include the extended URN for both minted wearables and emotes that are returned. The new format is as follows: `decentraland:{protocol}:collections-{version}:{contract(0x[a-fA-F0-9]+)}:{itemId}:{tokenId}`.

## RFC 2119 and RFC 8174

> The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "
> SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL"
> in this document are to be interpreted as described in RFC 2119 and RFC 8174.