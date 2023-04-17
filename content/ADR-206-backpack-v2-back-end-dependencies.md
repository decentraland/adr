---
layout: adr
adr: 206
title: Back-end dependencies for the new Backpack V2
date: 2023-04-17
status: Review
type: ADR
spdx-license: CC0-1.0
authors:
- sandrade-dcl
- lorux0
- davidejensen
---

## Need
This is a technical proposal for the needs described here: [PRD: Backpack V2](https://www.notion.so/decentraland/PRD-Backpack-V2-13fd81cca29a45a180af6b73c2ca49b5)

![image](https://user-images.githubusercontent.com/64659061/229762895-ea269990-2b40-412b-be26-071228f6a226.png)

The intention of this document is:

- Identifying which teams will be involved and what responsibilities they’ll cover.
- Dividing the new functionality in smaller tasks that will be estimated accordingly in order to create a development roadmap.
- Finding possible corner cases in order to preemptively identify and solve them.
- Reaching a consensus between different affected teams in terms of defining the different functionalities and flows.

### Involved teams
This initiative will require a cross team effort that will include the following teams:

- Explorer: for the UI, UI functionalities and integration with the back-end side.
- Platform: for the modification of the already existing lambdas endpoints in order to make them compatible with the new requirements (sorting wearables by different criteria, filtering them by different criteria, etc.) and/or the creation of new ones required.

## Back-end dependencies

We currently have several lambdas endpoints (some of them compatible with pagination) that are already being used by the current version of the Backpack to retrieve the information about the wearables. These endpoints are:
- **Base Wearables**: `/lambdas/collections/wearables?collectionId=urn:decentraland:off-chain:base-avatars`
- **Owned Wearables**: `/lambdas/users/:userId/wearables?includeDefinitions=true`
- **Owned Emotes**: `/lambdas/users/:userId/emotes?includeDefinitions=true`
- **Third Party Wearables by collection**: `/lambdas/users/:userId/third-party-wearables/:collectionId&includeDefinitions=true`

We need to support the features in the lambdas. It is recommended to create new ones, to keep retro-compatibility, but we leave the decision to the @platform team.

### Filter WEARABLES by collection
In order to give the user the possibility of seeing and managing any type of wearables (BASE, OWNED and THIRD PARTY) together in the backpack, we would need to receive all the information from a single endpoint instead of having to request them separately.

These will be the filters available in the UI to filter the wearables:
#### Show BASE WEARABLES ON/OFF
![image](https://user-images.githubusercontent.com/64659061/229766671-009331d0-b6db-42db-89c2-9b6d76249dcb.png)
#### Select 1 or more COLLECTIONS ("decentraland" would be the owned wearables and any other would belong to TPW)
![image](https://user-images.githubusercontent.com/64659061/229814201-e2518fb9-336d-4adb-b113-f1e803d97607.png)

In order to be able to manage these filters, we will need an endpoint where we can specify a list of collection ids (either "Decentraland", "urn:decentraland:off-chain:base-avatars" or any third party collection) and return the list of wearables that match with those collections.

#### Examples:
##### Only owned collection
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=decentraland
```
##### Only base collection
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=urn:decentraland:off-chain:base-avatars
```
##### Several third party collections
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff,...
```
##### Any combination
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=decentraland,urn:decentraland:off-chain:base-avatars,urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff,...
```

### Filter EMOTES by collection
In order to give the user the possibility of seeing and managing any type of emotes (BASE or OWNED) together in the backpack, we would need to receive all the information from a single endpoint instead of having to request them separately.

This will be the filter available in the UI to filter the emotes:
#### Show BASE EMOTES ON/OFF
![image](https://user-images.githubusercontent.com/64659061/229766671-009331d0-b6db-42db-89c2-9b6d76249dcb.png)

In order to be able to manage these filters, we will need an endpoint where we can specify a list of collection ids (either "decentraland" or "base") and return the list of emotes that match with those collections.

#### Examples:
##### Only owned collection
```
/lambdas/users/:userId/emotes?includeDefinitions=true&collectionIds=decentraland
```
##### Only base collection
```
/lambdas/users/:userId/emotes?includeDefinitions=true&collectionIds=base
```
##### Any combination
```
/lambdas/users/:userId/emotes?includeDefinitions=true&collectionIds=decentraland,base
```

### Filter WEARABLES/EMOTES by text
The user will be able to filter the wearables/emotes by text.

![image](https://user-images.githubusercontent.com/64659061/229763852-181a0afb-1b34-486b-9df0-1fb249e71e87.png)

In order to be able to do it, we will need to add a new parameter to the existing endpoints that will be used to specify a text and return the list of wearables that match with that text. The new parameter will be called `textFilter` and will be a string that will accept any value.

In order to be able to manage this filter, we will need an endpoint (the same described in the previous sections) where we can specify a text and return the list of wearables that match with that text.

#### Examples:
##### Filter any combination of wearables by text
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=decentraland,urn:decentraland:off-chain:base-avatars,urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff&textFilter=aviator
```
##### Filter any combination of emotes by text
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=decentraland,base&textFilter=chic
```

### Filter WEARABLES by category
The user will be able to filter the wearables by category.

![image](https://user-images.githubusercontent.com/64659061/229797308-983f7ef8-df3c-4f2c-a528-50fae4cb7b7d.png)

In order to be able to manage this filter, we will need an endpoint (the same described in the previous sections) where we can specify the category and return the list of wearables that match with that category.

#### Examples:
##### Filter any combination of wearables by category
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=decentraland,urn:decentraland:off-chain:base-avatars,urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff&category=hat
```

### Sort WEARABLES/EMOTES
The user will be able to sort the wearables/emotes by different criteria: **newest/oldest**, **rarest/less rare** or **name A-Z/name Z-A**.

![image](https://user-images.githubusercontent.com/64659061/229763267-0bbfc68a-0066-46d3-9d50-bd8addcc508f.png)

In order to be able to manage this sorting, we will need an endpoint (the same described in the previous sections) where we can specify the sorting criteria and return the list of wearables sorted by that criteria. The sorting parameter will be a string that will accept the following values:
- `newest`
- `oldest`
- `rarest`
- `less_rare`
- `name_a_z`
- `name_z_a`

In cases where wearables or emotes dont have minted timestamps, they should be added at the bottom of the list.

#### Examples:
##### Sort any combination of wearables by rarest
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=decentraland,urn:decentraland:off-chain:base-avatars,urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff&sort=rarest
```
##### Filter any combination of emotes by name A-Z
```
/lambdas/users/:userId/wearables?includeDefinitions=true&collectionIds=decentraland,base&sort=name_a_z
```

### Get wearable market details (NEW ENDPOINT)
The user will be able to click on a wearable and open a modal with some details as:
- **Creator (optional)**: Name and image of the creator of the wearable.
- **Collection (optional)**: Name and image of the collection where the wearable belongs to.
- **Network**: Network where the wearable is deployed.
- **Contract address**: Address of the contract where the wearable is deployed.
- **Latest sales**: List of the latest sales of the wearable. It would be a list of the following information:
  - **From**: Name and image of the seller.
  - **To**: Name and image of the buyer.
  - **Type**: Type of the transaction (Transfered or Minted).
  - **When**: Date of the transaction.
  - **Price**: Price of the transaction.
- **Minting number and total scarcity (optional)**: Minted number + total amount of NFTs of this wearable.

![image](https://user-images.githubusercontent.com/64659061/229763478-9fdadddd-4137-431a-8df4-49fbc30f5f95.png)

To be able to request this information, the client will have to use the minted id instead of the generic id. This information is available when querying the wearables.
In order to be able to get this info, we will need to create a new endpoint that will return the details of a specific wearable:

#### Example:
##### Get market details of a specific wearable
```
/lambdas/wearables/:wearableId/market-details
```

### Get a random list of equipped wearables (NEW ENDPOINT)
The user will be able to click on a [RANDOMIZE] button and equip a random list of wearables on his avatar.

![image](https://user-images.githubusercontent.com/64659061/229765018-95715b20-d55a-4296-b795-fe0d7f5b95e4.png)

In order to be able to do it, we will need to create a new endpoint that will return a random list of wearable ids from the owned wearables of the user.
The wearables must be from each category, avoiding conflicts with hides and replaces whenever possible.

#### Example:
##### Get random wearables of a specific user
```
/lambdas/users/:userId/random-wearables
```

### Outfits
![image](https://user-images.githubusercontent.com/64659061/229866578-4a39e202-03d8-407c-907b-aaf5509f21eb.png)

The outfit information should be stored in the catalyst because we need to support multi-platform.

~~On the other hand, we should avoid storing it in profiles since it is information that only each individual user needs and does not need to be shared with other users.
Adding it to the profiles would add an additional data transfer for each request unnecessarily.~~

**Update:** The outfit information will be stored in the user profile.

Regarding to the outfit image previews, they can be generated in the client when saving the outfit.
There is no need to store the images in the catalysts.

We may encounter the need of checking that the wearables in the outfit are valid for the current user. (What happens if the user does not have the wearable anymore?)

## Equip/save wearables

![image](https://user-images.githubusercontent.com/64659061/229867289-dafd7612-c4bd-4d71-a1a0-e02746290187.png)

We though about several alternatives to avoid performance issues by saving the profile every time you equip an item:

1. Equip all the items and only when the backpack is closed, make the request to save the profile.
2. The profile will be updated/saved in intervals of 20 seconds (to be defined) or whenever the user closes the backpack.
3. Save the profile when the user equips a wearable.

Saving the profile would mean that the nearby users will be able to see the changes as soon as possible.

**Update:** we will go for option 1, taking in consideration that we cant save the profile during the quitting of the application. It will only be saved when closing the backpack, just like the "save" button worked before.

## Emotes pagination

![image](https://user-images.githubusercontent.com/64659061/229866787-de1aa022-edee-4bea-b1f1-c138b1f5da82.png)

We will need to refactor the current emotes catalog, the same way on how we did on wearables catalog, so its supports pagination.
We will also reduce kernel responsibilities, moving all (or most) of the emote handling in the renderer.
No need backend support.
Open ticket: [#4429](https://github.com/decentraland/unity-renderer/issues/4429)

## BackpackEditorV2

In Unity we are going to implement a new UI for the backpack v2 requirements, including all the components needed.

We will keep retro-compatibility with the old one, including the UI, service calls and dependencies.

## Open questions

1. We need to define an approach on how to request/store the outfits information for every user (ref: outfits). **Its going to be stored in the user profile.**
2. We need to discuss and define an approach on when we should save the profile (ref: equip/save wearables). **Option 1.**
3. Is the preview image generation for outfits going to be a suitable approach? (ref: outfits). **Yes, it will be done in the client.**
4. In order to query market details for every wearable, we need to solve the specific minted wearableId (now the client uses the generic one). In case the user has many wearables of the same generic id, how are we going to display the information?
5. The randomizer will need a bounded scope because querying the whole wearables that the user may have would be too expensive. Is it ok that the randomized result is smaller?
6. Is it necessary that the nearby users see the avatar changes as soon as you equip a wearable in the backpack? Taking in consideration that we will go for option 1, the nearby users will only see the avatar changes when closing the backpack, very similar on how it works today.