---
layout: adr
adr: 170 
title: Subgraph Cloudflare Worker
date: 2023-01-10
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - fzavalia
---

## Abstract

Using a [Cloudfare Worker](https://workers.cloudflare.com/) to make graphql queries to subgraphs hosted by different providers to increase reliability.

## Context, Reach & Prioritization

Different applications in the Decentraland ecosystem require making graphql queries to different subgraphs to obtain indexed data from the blockchain.

Before the solution proposed in this document. All subgraphs were hosted on [TheGraph's Hosted Service](https://thegraph.com/hosted-service).

This service provides free subgraph deployments and no cost to execute queries. However, there were times in which the subgraphs were corrupt or lagging behind, affecting the whole ecosystem. There were also mentions of the service [sunset](https://thegraph.com/blog/sunsetting-hosted-service/) in favor of [TheGraph's Decentralized Network](https://thegraph.com/studio/)

When the subgraph is lagging, users are not able to see the latest things that happened on the blockchain. This means that they might have bough a LAND, but are unable to deploy a scene because the subgraph is not updated yet. A user might purchase a wearable in the Marketplace, the transaction is mined successfully, but if the subgraph is not updated soon, the wearable will not be displayed in their possession and might cause the user to send another transaction to purchase it by mistake.

On a particular occasion, the [collections subgraph](https://thegraph.com/hosted-service/subgraph/decentraland/collections-matic-mainnet) indexed incorrectly, having erroneous data that affected the whole subgraph. This caused users to see things that were incorrect.

There was a need to start exploring other providers to prevent future issues, and with talks of the sunset, despite being postponed, we knew that new solutions would be needed on the short time.

Just replacing the provider would not be enough. What would happen if the new provider fails and another had to be used? The provider urls would need to be changed on all applications manually. Moreover, if some sort of logic for error handling and fallback was to be applied, each application would have to apply it independently. Also, some providers require secrets that cannot go on the frontend and might not be convenient to have distributed in different applications in case there is a leak and they have to be rotated.

### Solution

Use a Cloudflare Worker as a provider proxy used to make the queries that the different Decentraland applications have been making all this time, but abstracting the knowledge of what subgraph provider is being used to obtain the data. 

By using a worker, different strategies used by all applications can be coded there to pick a provider and handle errors accordingly, abstracting this logic from the application level into a single endpoint.

The current implementation of the worker allows querying different subgraphs like any other graphql endpoint by sending a POST request to the worker url and the name of the subgraph to be queried. For example, querying for the id of all nfts in the collections-matic-mainnet subgraph would look like this:

```sh
curl --request POST 
  --url $WORKER_URL/collections-matic-mainnet \
  --data '{"query":"{\n  nfts {\n    id\n  }\n}"}'
```

The configured strategy, called `RandomAndFallback` will forward the query to a random provider. If that random provider fails to be fetched or returns a non 200 response, the rest of the providers will be used as fallback until one responds correctly.

## Solution Space Exploration

All Decentraland applications should start querying subgraphs trough the worker. Meaning that in order to use it, they should update the current endpoints they are using to the new one. The API is exactly the same, so queries remain the same.

The worker might not have all subgraphs configured. The following request can be used to get a list of all subgraphs that can be consumed with it.

```bash
curl --request GET \
  --url $WORKER_URL
```

Example response: 

```json
[
  "collections-matic-mainnet",
  "marketplace",
  "rentals-ethereum-mainnet"
]
```


## Specification

The worker is up and running and being consumed by the nft-server as of Nov 7, 2022

Current strategy deployed into the worker on Jan 4, 2023 

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
