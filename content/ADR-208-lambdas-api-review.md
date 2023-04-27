---
layout: adr
adr: 208
title: Lambdas API Review
date: 2020-02-20
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - hugoArregui
---

## Abstract

Catalyst's Lambdas is a service created to support many unrelated operations needed originally by the reference implementation client, but as time goes by, new, more efficient endpoints or ways of performing the same operation are implemented, but the service still contains every one of this iterations. The idea of this ADR is to describe the status of those endpoints in order to be able to clean up the service and have a more robust catalyst implementation.

## Context, Reach & Prioritization

Given the nature of the service lambdas is one of the most complex pieces of software inside the catalyst node, documenting the changes and been able to cleanup the service drasticaly will improve the mantenability and efficence of the catalyst itself.

## Specification

### GET /lambdas/health

Action: deletion

Lambdas health endpoint has been replaced for the realm description endpoint `/about` specified by [ADR-110: Realm description](./ADR-110-realm-description.md).

### GET /lambdas/contentv2/parcel_info

Action: deletion

This endpoint is just a proxy to content-server's `POST /entities/active'.

### GET /lambdas/contentv2/contents/:cid

Action: deletion

This endpoint is just a proxy to content-server's `GET /contents/:hashId'.

### GET /lambdas/scenes

Action: deletion

This endpoint is just a proxy to content-server's `POST /entities/active'.

### GET /lambdas/profiles

Action: deletion

This endpoint is replaced by `POST /lambdas/profiles`, this endpoint had a limit on the number of profiles you can request at once given by the lenght of the url, the POST version of this endpoint removes this restriction.

### GET /lambdas/profiles/{id}

Action: deletion

This endpoint is replaced by `POST /lambdas/profiles`, in which many profiles can be requested at once.

### GET /lambdas/contracts/servers

Action: deletion

This endpoint is a proxy to the catalyst smart contract, this can be replaced by a call to the contract. To make things easier for clients, a new version of the calyst-client will be released, including both a way to query the contract if you have a web3 provider and a snapshot of the data of the contract at the time of the release.

### GET /lambdas/contracts/pois

Action: deletion

This endpoint is a proxy to the POIs smart contract, this can be replaced by a call to the contract. To make things easier for clients, a new version of the calyst-client will be released, including both a way to query the contract if you have a web3 provider and a snapshot of the data of the contract at the time of the release.

### GET /lambdas/contracts/denylisted-names

Action: deletion

This endpoint is a proxy to the names denylist smart contract, this can be replaced by a call to the contract. To make things easier for clients, a new version of the calyst-client will be released, including both a way to query the contract if you have a web3 provider and a snapshot of the data of the contract at the time of the release.
