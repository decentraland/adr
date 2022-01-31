# Skin wearables in Builder editor

## Context and Problem Statement

We are adding a new `skin` category to the available wearable slots. This new slot will be used for wearables that shape the whole avatar. Here's a [link to the PRD](https://www.notion.so/decentraland/PRD-Skin-Wearable-Category-9913df0dd6944f839dc403310f151625) explaining the logic behind this new feature, but the scope of this ADR is to address the problem of how to support a new slot in the Builder editor. 
The Builder uses an outdated version of the ECS, and upgrading it to the latest one (which would support the new `skin` slot) is not possible at the moment.

## Proposed solution

We can still support this new slot behavior by doing some manipulation to the wearable before sending it to the ECS scene, and by limiting the categories that the user can add to the `replaces` and `hides` lists in the wearable's representations.

1) The categories that should be added to the `hides` list on runtime are:
- `head`
- `hair`
- `facial_hair`
- `mouth`
- `eyebrows`
- `eyes`
- `upper_body`
- `lower_body`
- `feet`

2) The categories that the creator should be able to add to the `hides` list using the editor are the following (aka "accesories"):
- `earring`
- `eyewear`
- `hat`
- `helmet`
- `mask`
- `tiara`
- `top_head`

3) The creator should not be able to add any category to the `replaces` list (the dropdown should be disabled when the wearable's category is `skin` and the list emptied).

So, when we are about to render a wearable which is of category `skin`, we will add to all the representations the categories listed in 1) to the ones that the representation already has, if any, which are the ones described in 2).

Finally, when deploying a wearable to a catalyst, the only categories that would be present in the `hides` list of any representation are the ones added by the creator (ie. all the "accesories" categories), and none of the ones hidden for all the `skin` wearables (ie. `head`, `upper_body`, `lower_body`, `feet`, etc), those should be hidden by default by the explorer and the builder editor themselves.

## Participants

@cazala
@nachomazzara
@lorux0
