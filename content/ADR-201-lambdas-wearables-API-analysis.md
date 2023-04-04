---
layout: adr
adr: 201
title: Lambdas Wearables API Analysis
date: 2020-04-03
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - pedrotambo
---

## Abstract

The Explorer uses the Lambdas API `/collections/wearables` to get Wearables. This API sometimes has bad performance, it has an ill design and the handrail between the Explorer and the Content Server through Lambdas might not be necessary. In this document we review the functionalities of this API and analyze solutions to these problems. 

## Context, Reach & Prioritization

During the last MVFW, bad performance of some APIs was reported. Among those APIs, there was the Lambdas endpoint `GET /collections/wearables`.

### API Functionality
First, a review of the functionalities of the API will be covered. The API, based on the request filters, gets the wearables from the Content Server, applies a small transform and returns the result to the client.

#### Request filters
The API allows three query parameters:

- `wearableIds`: A list of wearable URNs that the client requests. Just ask the Content Server for them and apply the transform. However, in some cases, when a large number of wearables are requested, the resulting URL string can exceed the maximum length allowed.
- `collectionIds`: A list of collection URNs that the client requests. When a `collectionId` is "off-chain" (base-avatars only), it requests the wearables directly to the Content Server. If a `collectionId` is "on-chain" (collections v1 and v2), it runs queries on The Graph using the wearable URNs from that collection, and then it fetches them from the Content Server. No third-party collections are included. Note: for the base-avatars collection it has a fixed list in a file listing all the urns.
- `textSearch`: A string value that is used to query The Graph. On-chain wearables have a metadata field called "searchText" that can have anything that is used for filtering. In some cases it has useful information but in other cases it has no meaningful info.

#### Transform: Wearables from the Content Server to the Client

1. First the wearable data from the Content Server is retrieved with this [schema](https://github.com/decentraland/schemas/blob/main/src/platform/entity.ts#L28-L37).
2. Then only the `metadata` of type [Wearable](https://github.com/decentraland/schemas/blob/main/src/platform/item/wearable/wearable.ts#L18-L26) is returned to the client, but a small transform is applied: the contents are extended with full url.

![Entity](/resources/ADR-201/entity-transform.png)

### Explorer use cases of the API
The API has many funcionalites, but the Explorer doesn't use all of them. After reviewing the `unity-renderer` repository, two use cases were recognized (check with Explorer Team): 
1. `wearableIds`: The Explorer request multiple wearables by URN. It reads from the user profiles the wearables that the user is wearing and request them. Note that the user can wear wearables from different collections.
2. `collectionIds='urn:decentraland:off-chain:base-avatars'`: It uses the API functionality of requesting items from a collection but **always** for the base-avatar one. It should be because it is always needed for configuring the backpack were the base avatars are always available.


## Solution Space Exploration

### Potential Solution 1: Redesign and Implement only used functionalities in Lamb2

Instead of having a single API supporting multiple functionalities, a new API schema is proposed only for the two use cases needed by the explorer:
- `POST /wearables { ids: string[]}`

  It receives in the POST request body a list of wanted ids and it returns the wearables for that urns. Consider implementing in the BFF as it only applies a small transformation.

- `GET /wearables/collections/:collectionId` (paginated)
  
  It receives a collectionId and it returns the wearables within that collection.

- Research if the functionality of searching wearables by `textSearch` is used in some other service and implement `POST /wearables/search { textSearch: string }`


### Potential Solution 2: Explorer directly hits the Content Server

Are these functionalities worthy enough to have a handrail between the Explorer and Content Server through Lambdas?
- For the use case 1, request all the ids to the Content Server and use them as-is.
- For the use case 2, have a fixed list of base-avatars ids (what currently Lambdas has) and request them to the Content Server.

This solution reduces traffic to Lambdas server and reduces the overall request time for the Explorer.


## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.