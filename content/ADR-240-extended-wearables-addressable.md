---
layout: adr
adr: 209
title: Extended Content Addressable URNs for Decentraland wearables
date: 2023-07-20
status: Proposed
type: Standards Track
spdx-license: CC0-1.0
authors:
- aleortega
---

# Abstract

This ADR proposes an extension to the content-addressable URN format specifically for Decentraland wearables. The extension will enable the representation of unique minted wearable NFT items with an additional token ID. The inclusion of the token ID in the URN allows for precise identification and differentiation of individual minted wearables, enriching the ownership validation process and enhancing the overall effectiveness of the Decentraland metaverse.

## Context, Reach & Prioritization

Decentraland, as a decentralized virtual world, provides a robust ecosystem for various NFTs. Among these NFTs, wearables are a key element that users can mint and trade. Wearables possess unique attributes, and users can create multiple instances with subtle variations. For instance, a user may mint one of a thousand blue shirts, each with distinct ownership history. The existing URN format lacks the ability to differentiate these individual minted wearable items within the Decentraland metaverse accurately.

To address this limitation and enhance the representation of wearable NFT ownership, we propose an extension to the content-addressable URN format specifically tailored for minted wearables. This extension introduces an optional token ID part at the end of the URN, designed exclusively for wearables. By selectively incorporating this token ID in the URN for wearables, we enable precise identification of each minted item, ensuring that no two minted wearables share the same URN within the Decentraland ecosystem.

The purpose of this update is twofold:

1. **Unambiguous Wearable Identification**: The inclusion of the token ID in the content-addressable URN guarantees unambiguous identification of each minted wearable NFT item within Decentraland. With the token ID, users, content creators, and developers can confidently validate ownership of specific minted wearable assets, accurately tracking their provenance and uniqueness.

2. **Enhanced Ownership Validation**: The extended URN format significantly enhances the ownership validation process for minted wearables. By leveraging the unique token ID, the Catalyst's content validation system can effectively verify and confirm ownership of individual minted wearable items, streamlining interactions within the Decentraland metaverse.

# Specification

The extended content-addressable URN format for Decentraland wearables willbe applied over collections v1 and v2 specifically. This extension was already proposed in the [ADR-109](/adr/ADR-109) on the second alternative:

```
decentraland:{protocol}:collections-v1:{contract(0x[a-fA-F0-9]+)}:{itemId}:{tokenId}
```

* **tokenID**: The unique identifier of the minted wearable NFT item, distinguishing it from other items of the same wearable content type and content identifier.

The token ID part is optional and will only be used when addressing specific minted wearable NFT items. For other content types, such as scenes or other types of NFTs, the token ID part will not be added at the time of this writing.

The migration of the minted wearables to the new URN format will be done in a progressive manner. The **Explorer** will show the items grouped by item kinds but allow the user to select the specific NFT to add to their profile. Once the users save their profile for the first time once this ADR is running effectively, a process in the client should select the first NFT for each item kind saved in the profile. E.g: if the user has this item `urn:decentraland:ethereum:collections-v1:wonderzone_steampunk:steampunk_jacket` selected in their profile but he has 10 of them with the token ids from `1` to `10`, the explorer should select the first (`urn:decentraland:ethereum:collections-v1:wonderzone_steampunk:steampunk_jacket:1`) one and replace it.