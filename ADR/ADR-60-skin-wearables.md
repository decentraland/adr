---
layout: doc
adr: 60
date: 2022-02-04
title: Skin wearables
status: ACCEPTED
authors:
  - cazala
  - nachomazzara
  - lorux0
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

We are adding a new `skin` category to the available wearable slots. This new slot will be used for wearables that shape the whole avatar. This will require changes to the Explorer to support the behavior of this new slot, which should hide several of the other slots (like `head`, `upper_body`, `lower_body`, `feet` and all the facial features). Also the Builder uses an outdated version of the ECS, and upgrading it to the latest one (which would support the new `skin` slot) is not possible at the moment. Finally, the Marketplace will require some way of displaying and browsing wearables of this new type a well, for this we will need to add the new slot to `WearableCategory` enum in `@dcl/schemas` so the `nft-server` can handle it, and also we need to add it to the schemas of both the `marketplace` and the `collections` subgraphs in all the supported networks (`ethereum-mainnet`, `ethereum-ropsten`, `matic-mainnet` and `matic-mumbai`).

## Proposed solution

On the Explorer side, a new `Skins` section in the backpack will be added to list all the skins owned by the user. When selecting a skin, a confirmation modal will pop up explaining which other wearables will be hidden and prompting the user. Portable experiencies that would be hidden by skins will still continue working. When unequipping the skin, the hidden wearables should be visible again.

On the Marketplace we will add a new `section` called `skin`, which will be accessible via the sidebar as "Skins", under the "Accessories" dropdown. This will end up passing a `wearableCategory=skin` param to the `nft-server`, which should filter by this `wearableCategory` the same way it does with the other ones.

On the Builder editor, even though we can't upgrade to the latest version of the Explorer, we can still support this new slot behavior by doing some manipulation to the wearable before sending it to the ECS scene, and by limiting the categories that the user can add to the `replaces` and `hides` lists in the wearable's representations.

1. The categories that should be added to the `hides` list on runtime are:

- `head`
- `hair`
- `facial_hair`
- `mouth`
- `eyebrows`
- `eyes`
- `upper_body`
- `lower_body`
- `feet`

2. The categories that the creator should be able to add to the `hides` list using the editor are the following (aka "accesories"):

- `earring`
- `eyewear`
- `hat`
- `helmet`
- `mask`
- `tiara`
- `top_head`

3. The creator should not be able to add any category to the `replaces` list (the dropdown should be disabled when the wearable's category is `skin` and the list emptied).

So, when we are about to render a wearable which is of category `skin`, we will add to all the representations the categories listed in 1) to the ones that the representation already has, if any, which are the ones described in 2).

Finally, when deploying a wearable to a catalyst, the only categories that would be present in the `hides` list of any representation are the ones added by the creator (ie. all the "accesories" categories), and none of the ones hidden for all the `skin` wearables (ie. `head`, `upper_body`, `lower_body`, `feet`, etc), those should be hidden by default by the explorer and the builder editor themselves.
