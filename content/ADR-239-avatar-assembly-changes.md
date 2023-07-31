---
adr: 239
date: 2023-06-01
title: Avatar Assembly Changes
status: Living
authors:
  - davidejensen
type: Standards Track
spdx-license: CC0-1.0
---

## Abstract

This ADR discusses improvements to the avatar system in Decentraland to enhance user freedom and create a more reliable, flexible, and scalable system. The ADR establishes a prioritization order for wearable visualization, modifies the replacement system to prevent wearables from replacing each other, introduces body fallback to show base body parts when no wearables are equipped, and allows users to force the rendering of hidden wearables. These decisions will serve as the standard for the Decentraland Avatar Assembly System and can be implemented in external platforms. The suggested flow for avatar assembly is also outlined.


## Context, Reach & Prioritization

Previously, the avatar system has been unreliable and limited over different aspects.
To increase users freedom, create a reliable, flexible and scalable system the following changes will be applied:
- **Wearable Visualization Priority:** A prioritization order will be defined for wearable visualization to resolve issues of mutual exclusion.
- **Hiding and Replacing:** The replacement system will be modified so that a wearable cannot replace another.
- **Body Fallback:** From now on, some categories will show parts of the base body when no wearable is equipped or hiding it.
- **Force Render:** Users will be given more ability to show a wearable that is hidden by another.

The different decisions will become the standard base for Decentraland Avatar Assembly System, initially applied in the unity reference client, but then proposed to any external platform that uses the Decentraland avatars.

## Solution Space Exploration

### Wearable Visualization Priority

Previously the hiding and replacing functionality was following a rule of "Last equipped", meaning that replaces and hides were applied based on the last wearable equipped, creating discrepancy and an inconsistent behaviour. Additionally it was not solving situations of mutual hiding (wearable A hiding B and B hiding A)
To standardize this an ordered list of categories will be followed to calculate which wearables are hiding which.
The proposed priority list is (from most important to least):
- Skins
- Top Body
- Bottom Body
- Shoes
- Helmets
- Masks
- Hats
- Top Head
- Hair
- Tiaras
- Eyewear
- Earrings

All elements associated with the face, such as the mouth, eyes, and eyebrows, directly depend on the visualization of the head. The head is not a wearable itself, so it cannot create circular references, and it is hidden as soon as one or more wearables determine it.

The following example illustrates the expected behavior: If a wearable of type "Mask" hides another wearable of type "Hat", and this in turn hides wearables of type "Mask", the wearable of type "Mask" will have visualization priority, hiding the Hat.


### Hiding and replacing

The current result of equipping an item that replaces or hides other wearables is unexpected and inconsistent. When a player navigates through their inventory items, as they equip, unequip, or hide other wearables from other categories without notice, they cannot reverse this behavior when equipping a different wearable.
When a wearable unequips another wearable, the latter could be running a portable experience. By deactivating it, any progress or data in memory could be lost, ruining its expected behavior.
The decision-making capacity of creators is overlapping with the freedom of choice of players. When a player purchases a wearable, thinking it will combine well with what they already have in their inventory, they may be unpleasantly surprised that these are not compatible. Information about which other wearables are replaced or hidden is not clearly indicated in the marketplace or backpack.
There is no real weighty reason for a wearable to unequip another wearable, instead of hiding it to prevent clipping problems.

On the base of that the replacing functionality for new wearables will be removed, pre-existing wearables will see the replacing list being merged with the hiding list.

### Body fallback

Previously, by unequipping the upper_body, the lower_body, the feet or the eyebrows, caused the system to fallback to default wearables (t-shirt, pants and shoes).
This prevents, for example, players from going barefoot or without t-shirt.

The system will extent the concept of Body by removing the default fallback wearables.
These pieces, which can be called "Bare feet", "Naked Top" and "Naked Bottom", are not considered wearables, but rather parts of the base body geometry that are exclusively displayed when no wearables are equipped and there are no other wearables hiding the relevant category.


### Force Render

To extend further players ability to use the wearables they have. If an equipped wearable is hidden by the effect of another wearable, players can unhide them and override this instruction.
This forced render effect is removed as soon as another wearable that re-hides that category is equipped, forcing the user to show it again.

In order to store the force render categories, it is proposed to add a new field to the player profile holding a list of overridden hide categories.
This list of string will hold the current overridden categories so that each player can render other players (and itself) according to the new rules.
As an example:
```yaml
"forceRender": ["mask","top_head","feet"]
```
This example means that when the avatar is going to be assembled the "mask", "top_head" and "feet" categories will be shown even if other wearables are hiding them.

Here's the avatar definition with the additional forceRender field that will be provided:
```json
{
   "timestamp":1684839566179,
   "avatars":[
      {
         "hasClaimedName":true,
         "description":"",
         "tutorialStep":256,
         "name":"Username",
         "avatar":{
            "bodyShape":"urn:decentraland:off-chain:base-avatars:BaseMale",
            "wearables":[
               "urn:decentraland:off-chain:base-avatars:eyebrows_00",
               "urn:decentraland:off-chain:base-avatars:mouth_00",
               "urn:decentraland:off-chain:base-avatars:casual_hair_01",
               "urn:decentraland:off-chain:base-avatars:beard",
               "urn:decentraland:matic:collections-v2:0xc11b9d892e12cfaca551551345266d60e9abff6e:1",
               "urn:decentraland:matic:collections-v2:0x84a1d84f183fa0fd9b6b9cb1ed0ff1b7f5409ebb:5",
               "urn:decentraland:ethereum:collections-v1:halloween_2020:hwn_2020_ghostblaster_tiara",
               "urn:decentraland:ethereum:collections-v1:halloween_2020:hwn_2020_cat_eyes",
               "urn:decentraland:off-chain:base-avatars:piratepatch",
               "urn:decentraland:matic:collections-v2:0xca7c347ffdeee480092f3b1268550b60ea031077:4",
               "urn:decentraland:matic:collections-v2:0x2a3a6d0c92b18102ed189233976c974473a59c87:0"
            ],
            "forceRender":["mask","top_head","feet"],
            "emotes":[
               {
                  "slot":0,
                  "urn":"raiseHand"
               },
               {
                  "slot":1,
                  "urn":"urn:decentraland:matic:collections-v2:0x167d6b63511a7b5062d1f7b07722fccbbffb5105:0"
               },
               {
                  "slot":2,
                  "urn":"urn:decentraland:matic:collections-v2:0x875146d1d26e91c80f25f5966a84b098d3db1fc8:1"
               },
               {
                  "slot":3,
                  "urn":"urn:decentraland:matic:collections-v2:0x875146d1d26e91c80f25f5966a84b098d3db1fc8:2"
               },
               {
                  "slot":4,
                  "urn":"urn:decentraland:matic:collections-v2:0x875146d1d26e91c80f25f5966a84b098d3db1fc8:0"
               },
               {
                  "slot":5,
                  "urn":"headexplode"
               },
               {
                  "slot":6,
                  "urn":"tektonik"
               },
               {
                  "slot":7,
                  "urn":"clap"
               },
               {
                  "slot":8,
                  "urn":"handsair"
               },
               {
                  "slot":9,
                  "urn":"dance"
               }
            ],
            "snapshots":{
               "body":"https://interconnected.online/content/contents/bafkreihhwboio77zsl6evt6i3f5iun5ek65w7dyuvl44xwk33zts4qx2v4",
               "face256":"https://interconnected.online/content/contents/bafkreiddnf2ixknlhio4hk7ao47agiwkqs43cg3nkoyibckgmhz5iqn3he"
            },
            "eyes":{
               "color":{
                  "r":0.529411792755127,
                  "g":0.501960813999176,
                  "b":0.47058823704719543,
                  "a":1
               }
            },
            "hair":{
               "color":{
                  "r":0.10980392247438431,
                  "g":0.10980392247438431,
                  "b":0.10980392247438431,
                  "a":1
               }
            },
            "skin":{
               "color":{
                  "r":0.800000011920929,
                  "g":0.6078431606292725,
                  "b":0.46666666865348816,
                  "a":1
               }
            }
         },
         "ethAddress":"0x1hd7fl09yivcn7z6asc0a8af9c3b1ba28hdy65sd",
         "userId":"0x1hd7fl09yivcn7z6asc0a8af9c3b1ba28hdy65sd",
         "version":12,
         "hasConnectedWeb3":true
      }
   ]
}
```

### Avatar assembly suggested flow

With the points previously discovered, the suggested procedure to visualize an avatar is the following:
* Request a user profile ( `POST https://content-server/content/active {"pointers": ["0xaddress"]}` )
* Request the wearables listed in the profile wearables field, all wearables listed are the equipped ones, no matter their visibility. ( `POST https://content-server/content/active {"pointers": ["urn1", "urn2"]}` )
* Process the hide list provided in each wearable following the visualization priority ( the field is the array `data.hides` in each wearable definition )
* Apply any force render category listed in the forceRender array in the profile definition ( obtained in the profile response called `forceRender` )
