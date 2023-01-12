---
adr: 103
date: 2022-09-01
title: Content server synchronization protocol
authors:
  - agusaldasoro
status: Living
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-3
---

# Abstract

This document describes the minimum mandatory synchronization protocol between content servers. It does not specify any validations for the entitites, it rather focuses on the endpoints and information flows instead. For validations of entities refer to [ADR-51](/adr/ADR-51). An initial version of this document lives on the [ADR-52](/adr/ADR-52) which was then upgraded to a new version described in the [ADR-116](/adr/ADR-116). This is a living document.

# Introduction

## Content Server Synchronization

Each Content server in a Catalyst bundle stores the assets of the deployed entities. Those entities are replicated in all DAO Content Servers. The schemas of the entities is defined in [ADR-80](/adr/ADR-80)

## What to expect from this document?

This document serves as reference to outline the boundaries of what the Decentraland protocol for Content Synchronization _is_. It defines the common mechanisms and protocols (sometimes including its messages and serializations) to make that information available to implementers willing to create their own versions of the Content Server.

## How does sync work?

Every server will check the deployment history the others provide, and detect when a new deployment is made. All servers have a deployments endpoint that exposed all deployments that happened on the server, sorted chronologically. So it's rather simple for other peers to pick up on new events.

So the workflow looks like this.

1. Server learns about new deployment in a remote server
2. It downloads all associated files and date
3. Then it performs all validations
4. If it ends up being valid, then it will be deployed locally

It is important to re-iterate that before updating its own vision of the Metaverse, each node will validate the entity again (the auth chain, the hashes, everything). If the validation fails, then that change will be ignored. Besides cryptographic signatures and smart contracts, there are no trusted parties involved in the process.

The full mechanism of Content Sync is defined in [ADR-116](/adr/ADR-116) and [ADR-52](/adr/ADR-52).

## Which endpoints are used?

> The library used to query the following endpoints is [snapshots-fetcher](https://github.com/decentraland/snapshots-fetcher). It serves as reference implementation of the synchronization.

### `GET /content/snapshots`

This endpoint returns the hash ids of the files that contain all the active entities of the server. Each file contains all the deployments in a server for a specific time range. The timeranges of all the files don't overlap and together complete a timeline with all the changes in the server from the beginning of Decentraland to one day before the present. Then, each file can be downloaded from the server and parsed to deploy the changes locally.

The format of the snapshots is a list of JSONs also known as [ndjson](http://ndjson.org/), so it can be read line by line and each of them can be parsed as a valid JSON.

### `GET /content/contents/{ipfsCid}`

Endpoint to retrieve all files: snapshots files, entity.json files and content files. The semantics of this endpoint are also explained in [ADR-79](/adr/ADR-79)

### `GET /content/pointer-changes`

Endpoint that returns all the deployed entities in a period of time.
