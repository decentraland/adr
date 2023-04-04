---
adr: 138
date: 2023-04-04
title: Technical Assessment for the new Backpack V2
authors:
  - sandrade-dcl
  - lorux0
  - davidejensen
status: Review
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-1
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
- Platform: for the modification of the already existing lambdas endpoints in order to make them compatible with the new requirements (sorting wearables by different criteria, filtering them by different criteria, etc.) and the creation of new ones required.
- dServices: for managing the new way of saving the equipped wearables and outfits from the new Backpack.

## Back-end dependencies

We currently have several lambdas endpoints (compatible with pagination) that are already being used by the current version of the Backpack to retrieve the information about the wearables. These endpoints are:
- **Base Wearables**: `/lambdas/collections/wearables?collectionId=urn:decentraland:off-chain:base-avatars`
- **Owned Wearables**: `/lambdas/users/:userId/wearables?includeDefinitions=true`
- **Owned Emotes**: `/lambdas/users/:userId/emotes?includeDefinitions=true`
- **Third Party Wearables by collection**: `/lambdas/users/:userId/third-party-wearables/:collectionId&includeDefinitions=true`

We're going to need to modify some of these endpoints in order to make them compatible with the new requirements. The following is a description of each one of the new requirements and how they will affect the current endpoints:

### Possibility of including the collection id in the owned wearables lambdas
In order to give the user the possibility of seeing and manage any type of wearables, base, owned, third party together in the backpack, we will be able to include them as part of the result returned by the owned wearables endpoint instead of having to request them separately.

![image](https://user-images.githubusercontent.com/64659061/229766671-009331d0-b6db-42db-89c2-9b6d76249dcb.png)
![image](https://user-images.githubusercontent.com/64659061/229814201-e2518fb9-336d-4adb-b113-f1e803d97607.png)

In order to be able to do it, we will need to add a new parameter to the existing Owned Wearables endpoint that will be used to specify the collection ids, either Decentraland, 'urn:decentraland:off-chain:base-avatars' or any third party collection, and return the list of wearables that match with that collections. The new parameter will be called `collectionId` and will be a string that will accept any value.
We should be able to specify more than one collection id separated by commas.

#### Endpoints affected:
- **Owned Wearables**: `/lambdas/users/:userId/wearables?includeDefinitions=true&collectionId=:collectionId1,:collectionId2...`

### Possibility of including the collection id in the owned emotes lambdas
In order to give the user the possibility of seeing and manage any type of emotes, base, owned, together in the backpack, we will be able to include them as part of the result returned by the owned emotes endpoint instead of having to request them separately.

![image](https://user-images.githubusercontent.com/64659061/229766671-009331d0-b6db-42db-89c2-9b6d76249dcb.png)

In order to be able to do it, we will need to add a new parameter to the existing Owned Emotes endpoint that will be used to specify the collection ids, either Decentraland or base, and return the list of emotes that match with that collections. The new parameter will be called `collectionId` and will be a string that will accept any value.
We should be able to specify more than one collection id separated by commas.

#### Endpoints affected:
- **Owned Emotes**: `/lambdas/users/:userId/emotes?includeDefinitions=true&collectionId=:collectionId1,:collectionId2...`

### Filter wearables/emotes by text
The user will be able to filter the wearables/emotes by text.

![image](https://user-images.githubusercontent.com/64659061/229763852-181a0afb-1b34-486b-9df0-1fb249e71e87.png)

In order to be able to do it, we will need to add a new parameter to the existing endpoints that will be used to specify a text and return the list of wearables that match with that text. The new parameter will be called `textFilter` and will be a string that will accept any value.

#### Endpoints affected:
- **Owned Wearables**: `/lambdas/users/:userId/wearables?includeDefinitions=true&textFilter=:anyText`
- **Owned Emotes**: `/lambdas/users/:userId/emotes?includeDefinitions=true&textFilter=:anyText`

### Filter wearables by category
The user will be able to filter the wearables by category. 

![image](https://user-images.githubusercontent.com/64659061/229797308-983f7ef8-df3c-4f2c-a528-50fae4cb7b7d.png)

In order to be able to do it, we will need to add a new parameter to some of the existing endpoints that will be used to specify the category and return the list of wearables that match with that category. The new parameter will be called `category` and will be a string that will accept any value.

#### Endpoints affected:
- **Owned Wearables**: `/lambdas/users/:userId/wearables?includeDefinitions=true&category=:categoryText`

### Sort wearables/emotes
The user will be able to sort the wearables/emotes by different criteria: **newest/oldest**, **rarest/less rare** or **name A-Z/name Z-A**.

![image](https://user-images.githubusercontent.com/64659061/229763267-0bbfc68a-0066-46d3-9d50-bd8addcc508f.png)

In order to be able to do it, we will need to add a new parameter to the existing endpoints that will be used to specify the sorting criteria. The new parameter will be called `sort` and will be a string that will accept the following values:
- `newest` (this should be the default sorting criteria)
- `oldest`
- `rarest`
- `less_rare`
- `name_a_z`
- `name_z_a`

#### Endpoints affected:
- **Owned Wearables**: `/lambdas/users/:userId/wearables?includeDefinitions=true&sort=:sortingCriteria`
- **Owned Emotes**: `/lambdas/users/:userId/emotes?includeDefinitions=true&sort=:sortingCriteria`

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

In order to be able to do it, we will need to create a new endpoint that will return the details of a specific wearable:
- **Wearable details**: `/lambdas/wearables/:wearableId/market-details`

### Get a random list of equipped wearables (NEW ENDPOINT)
The user will be able to click on a [RANDOMIZE] button and equip a random list of wearables on his avatar.

![image](https://user-images.githubusercontent.com/64659061/229765018-95715b20-d55a-4296-b795-fe0d7f5b95e4.png)

In order to be able to do it, we will need to create a new endpoint that will return a random list of wearable ids from the owned wearables of the user.
The wearables must be from each category, avoiding conflicts with hides and replaces whenever possible.

- **Random list of wearables**: `/lambdas/users/:userId/random-wearables`

## Outfits
The information of the outfits should be stored in the catalysts because we need cross-platform support. On another hand we should avoid storing it in the profile because this information is only needed by its own user and it's not needed to share to other users.