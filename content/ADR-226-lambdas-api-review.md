---
layout: adr
adr: 226
title: Lambdas API Review
date: 2023-04-28
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - hugoArregui
---

## Abstract

Catalyst's Lambdas is a service created to support many unrelated operations needed initially by the reference implementation client. As time goes by, new and more efficient endpoints with the same responsibilities are implemented, but the service still contains every iteration. The idea of this ADR is to describe those endpoints statuses to clean up the service, and have a more robust catalyst implementation.

## Context, Reach & Prioritization

Given its nature, the Lambdas service is one of the most complex pieces of software inside the catalyst node. Documenting the changes and being able to clean up the service drastically will improve the maintainability and efficiency of the catalyst itself.

## Specification

### GET /lambdas/health

Action: deletion

Lambdas' health endpoint has been replaced with the realm description endpoint `/about` specified by [ADR-110: Realm description](/adr/ADR-110).

This action was approved on [this DAO poll](https://governance.decentraland.org/proposal/?id=24f524f0-eb50-11ed-ac2d-876c6fc9416f).

### GET /lambdas/profiles

Action: deletion

This endpoint is replaced by `POST /lambdas/profiles`. It had a limit on the number of profiles you can request at once given by the URL length. The POST version of this endpoint removes this restriction.

This action was approved on [this DAO poll](https://governance.decentraland.org/proposal/?id=24f524f0-eb50-11ed-ac2d-876c6fc9416f).

### GET /lambdas/contentv2/parcel_info

Action: deletion

This endpoint is a proxy to the content-server `POST /entities/active`.

This action was approved on [this DAO poll](https://governance.decentraland.org/proposal/?id=709968b0-ef44-11ed-813c-b353c3943eab).

### GET /lambdas/contentv2/contents/:cid

Action: deletion

This endpoint is a proxy to the content-server `GET /contents/:hashId`.

This action was approved on [this DAO poll](https://governance.decentraland.org/proposal/?id=709968b0-ef44-11ed-813c-b353c3943eab).

### GET /lambdas/contentv2/scenes

Action: deletion

This endpoint is just a proxy to content-server's `POST /entities/active`.

This action was approved on [this DAO poll](https://governance.decentraland.org/proposal/?id=709968b0-ef44-11ed-813c-b353c3943eab).

### GET /lambdas/contracts/servers

Action: deletion

This endpoint is a proxy to the catalyst's smart contract that can be replaced by calling it directly. To make things easier for clients, a new version of the catalyst-client will be released, including both a way to query the contract if you have a web3 provider and a snapshot of the contract data at the time of the release.

### GET /lambdas/contracts/pois

Action: deletion

This endpoint is a proxy to the POIs' smart contract that can be replaced by calling it directly. To make things easier for clients, a new version of the catalyst-client will be released, including both a way to query the contract if you have a web3 provider and a snapshot of the contract data at the time of the release.

### GET /lambdas/contracts/denylisted-names

Action: deletion

This endpoint is a proxy to the names denylist smart contract that can be replaced by calling it directly. To make things easier for clients, a new version of the catalyst-client will be released, including both a way to query the contract if you have a web3 provider and a snapshot of the contract data at the time of the release.

### GET /lambdas/collections/wearables-by-owner/{address}

Action: deletion

Replaced by GET /lambdas/nfts/wearables/{address}, which returns the same data, but paginated.

### POST /lambdas/validate-signature

Action: deletion

This endpoint can be replaced by @dcl/crypto library validateSignature method. 
