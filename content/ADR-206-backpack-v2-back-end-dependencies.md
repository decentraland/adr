---
layout: adr
adr: 206
title: Back-end dependencies for the new Backpack V2
date: 2023-04-17
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - sandrade-dcl
  - lorux0
  - davidejensen
  - pedrotambo
  - marianogoldman
---

## Abstract
This is a technical proposal for the needs that we have from back-end to implement the new BackpackV2 feature.

![image](https://user-images.githubusercontent.com/64659061/229762895-ea269990-2b40-412b-be26-071228f6a226.png)

## Context, Reach & Prioritization
We currently have several lambdas endpoints (some of them compatible with pagination) that are already being used by the current version of the Backpack to retrieve the information about the wearables. These endpoints are:
- **Base Wearables**: `/lambdas/collections/wearables?collectionId=urn:decentraland:off-chain:base-avatars`
- **Owned Wearables**: `/lambdas/users/:userId/wearables?includeDefinitions=true`
- **Owned Emotes**: `/lambdas/users/:userId/emotes?includeDefinitions=true`
- **Third Party Wearables by collection**: `/lambdas/users/:userId/third-party-wearables/:collectionId&includeDefinitions=true`

In order to support the new features that come with the version 2 of the backpack, new endpoints are needed. We'll describe below the functional requirements that they must suffice.

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
/<lambdasEndPoint>/:userAddress/wearables?collectionCategory=on-chain
```
##### Only base collection
```
/<lambdasEndPoint>/:userAddress/wearables?collectionCategory=base-wearable
```
##### Several third party collections
```
/<lambdasEndPoint>/:userAddress/wearables?collectionCategory=third-party&collectionIds=urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff,...
```
##### Any combination
```
/<lambdasEndPoint>/:userAddress/wearables?collectionCategory=on-chain,base-wearable,third-party&collectionIds=urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff,...
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
/<lambdasEndPoint>/:userAddress/emotes?collectionCategory=on-chain
```
##### Only base collection
```
/<lambdasEndPoint>/:userAddress/emotes?collectionCategory=base
```
##### Any combination
```
/<lambdasEndPoint>/:userAddress/emotes?collectionCategory=on-chain,base
```

### Filter WEARABLES/EMOTES by text
The user will be able to filter the wearables/emotes by text.

![image](https://user-images.githubusercontent.com/64659061/229763852-181a0afb-1b34-486b-9df0-1fb249e71e87.png)

In order to be able to do it, we will need to add a new parameter to the existing endpoints that will be used to specify a text and return the list of wearables that match with that text. The new parameter will be called `textFilter` and will be a string that will accept any value.

In order to be able to manage this filter, we will need an endpoint (the same described in the previous sections) where we can specify a text and return the list of wearables that match with that text.

#### Examples:
##### Filter any combination of wearables by text
```
/<lambdasEndPoint>/:userAddress/wearables?collectionCategory=on-chain,base-wearable,third-party&collectionIds=urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff&name=aviator
```
##### Filter any combination of emotes by text
```
/<lambdasEndPoint>/:userAddress/emotes?collectionCategory=on-chain,base-wearable&name=chic
```

### Filter WEARABLES by category
The user will be able to filter the wearables by category.

![image](https://user-images.githubusercontent.com/64659061/229797308-983f7ef8-df3c-4f2c-a528-50fae4cb7b7d.png)

In order to be able to manage this filter, we will need an endpoint (the same described in the previous sections) where we can specify the category and return the list of wearables that match with that category.

#### Examples:
##### Filter any combination of wearables by category
```
/<lambdasEndPoint>/:userAddress/wearables?collectionCategory=on-chain,base-wearable,third-party&collectionIds=urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff&categories=hat
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
/<lambdasEndPoint>/:userAddress/wearables?collectionCategory=on-chain,base-wearable,third-party&collectionIds=urn:decentraland:matic:collections-thirdparty:cryptoavatars,urn:decentraland:matic:collections-thirdparty:kollectiff&orderBy=rarity&direction=ASC
```
##### Filter any combination of emotes by name A-Z
```
/<lambdasEndPoint>/:userAddress/emotes?collectionCategory=on-chain,base&orderBy=name&direction=ASC
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
/<lambdasEndPoint>/:wearableId/market-details
```

### Get a random list of equipped wearables (NEW ENDPOINT)
The user will be able to click on a [RANDOMIZE] button and equip a random list of wearables on his avatar.

![image](https://user-images.githubusercontent.com/64659061/229765018-95715b20-d55a-4296-b795-fe0d7f5b95e4.png)

In order to be able to do it, we will need to create a new endpoint that will return a random list of wearable ids from the owned wearables of the user.
The wearables must be from each category, avoiding conflicts with hides and replaces whenever possible.

#### Example:
##### Get random wearables of a specific user
```
/<lambdasEndPoint>/:userAddress/random-wearables
```

### Outfits
![image](https://user-images.githubusercontent.com/64659061/229866578-4a39e202-03d8-407c-907b-aaf5509f21eb.png)

The outfit information needs to be multi-platform support so it will be stored in the user profile.

Regarding to the outfit image previews, they can be generated in the client when saving the outfit.
There is no need to store the images in the back-end.

We may encounter the need of checking that the wearables in the outfit are valid for the current user. (What happens if the user does not have the wearable anymore?)

### Equip/save wearables

![image](https://user-images.githubusercontent.com/64659061/229867289-dafd7612-c4bd-4d71-a1a0-e02746290187.png)

We though about several alternatives to avoid performance issues by saving the profile every time you equip an item:

1. Equip all the items and only when the backpack is closed, make the request to save the profile.
2. The profile will be updated/saved in intervals of 20 seconds (to be defined) or whenever the user closes the backpack.
3. Save the profile when the user equips a wearable.

Saving the profile would mean that the nearby users will be able to see the changes as soon as possible.

The chosen option is the number 1, taking in consideration that we can't save the profile when the user quits the application. It will only be saved when closing the backpack, just like the "save" button worked before.

## Solution Space Exploration
### Functional requirements
By summarizing the requirements described above, we need to implement an endpoint that complies with the following:

Filter criteria:
1. Owner address (implicit in the URL as a path param). 
2. Collection Type (multiselect):
   - Off-chain (base-wearables)
   - On-chain (The Graph Ethereum and Matic)
   - ThirdParty (one API for each Third Party)
3. Name: “contains”, case insensitive. 
4. Category[]: included in categories.

Sorting criteria:
5. Date:
   - On-chain: use transferredAt field.
   - ThirdParty/BaseWearables: use the deploy timestamp of the entity stored in the Content Server .
6. Rarity (rarest / least_rare): consider Third Party as the rarest and Base Wearables as the least rarest. 
7. Name.

### Analyzed solutions
#### Option 1 - Single endpoint to fulfill UI
Create a single endpoint that is capable of returning a paginated collection of all wearable types unified. This includes base wearables, on-chain wearables and third-party wearables. It allows the required filtering criteria: category, name and collection type. And also the sorting criteria: date, rarity and name.
This aligns 100% with what the new UI design requires. However it has many API design issues that should not be added to an endpoint that becomes part of the DCL protocol. The main issues are:
- The return elements in the collection are of different kinds. It’s a heterogeneous collection consisting of 3 types: base, on-chain and third party wearables.
- Each type has different data.
- Some of the filtering criteria are valid for some types but not the others.
- Some sorting criteria are valid for some types but not the others.

The issues above should be sufficient for avoiding going that way. But also, the nature of the issue (different types of entities treated as if they were the same) also permeates to the client, where depending on the type there will be different options available. For example, for on-chain items it makes sense to show marketplace transactions, but not for the other two types. Third party and base wearables don’t have rarity, so a compromise needs to be made regarding where to display them when sorting by rarity. Whatever is chosen can make sense for UI but not for a general purpose endpoint exposed by the Catalyst.
The root cause of the issue comes from trying to treat different wearable types as if they were the same, when they are actually quite different. The forcing of this into similar-looking elements adds a lot of complexity to implementation and maintenance of the UI also.

#### Option 2 - Multiple endpoints - Front end code unifies
Leverage the existing endpoints created for passport, enhancing them with filtering and sorting capabilities. Change would be backwards compatible, it only adds specification for filtering and sorting criteria, but still behaves the same when nothing is specified.
This solution doesn’t serve exactly what the new UI design suggests, but the endpoints can still be used to provide the same approach (unified view) by implementing the unification in the client side.
The main advantages of this approach are:
- Clean API design.
- Very fast API dev time, as the endpoints already exist and work only involves adding support for filtering / sorting.

The disadvantage is that the UI needs to either implement the unification by consuming the existing endpoints + adding a layer of merging the different sources into a single collection.

#### Option 3 - Multiple endpoints - UI changes to show items separately
This option is similar to Option 2 in regards to the API endpoints: enhancing existing endpoints with filtering / sorting capabilities.
The difference would be that the UI changes to show the 3 types of wearables separately. So this makes the nature of the different types of wearables (which have different behavior) become visible to the user, rather than trying to hide it.
The UI should be iterated and adapted so it doesn’t try to force the unified view of entities of different kinds. It will be easier for users to understand what is happening. It will be easier for UI developers to develop and maintain in the future.
For e.g. users may wonder: why can’t I see transactions for this wearable (being a third party one)? Why are base wearables at the beginning / end when sorting by date? Or other things that make no sense in one type but do in others.

#### Option 4 - Unified intermediate service
This option aims to have an intermediary service, out of the Decentraland protocol, and enable use cases for our reference client.
In this approach we would be using the endpoints resulting from Option 3 in the service for wearables and doing the merge of the three while paginating the results to the client. In this case the solution in the frontend side would be similar to Option 1, having a single endpoint for paginating all kinds of wearables.
It remains to be analyzed where this intermediate service would be hosted, whether inside or outside the Catalysts.

## Conclusion
After discussing the different solutions between Platform, Renderer and Product team, we agreed to go with the **Option 4** since it has the best effort/benefit balance.

## Participants
- Santi Andrade
- Nico Lorusso
- Davide Jensen
- Matias Pentreath
- Pedro Tamborindeguy
- Mariano Goldman
- Miguel Oliva

## RFC 2119 and RFC 8174
> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
