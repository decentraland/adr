---
layout: doc
rfc: 2
date: 2022-09-01
title: Content server synchronization protocol
authors:
- agusaldasoro
status: ACCEPTED
---

# Abstract

This document describes the minimum mandatory synchronization protocol between content servers. It does not specify any validations for the entitites, it rather focuses on the endpoints and information flows instead. For validations of entities refer to [ADR-51](/adr/ADR-51). An initial version of this document lives on the [ADR-52](/adr/ADR-52).

# Introduction

## Content Server Synchronization

Each Content server in a Catalyst bundle stores the assets of the deployed entities. Those entities are replicated in all DAO Content Servers.

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

The full mechanism of Content Sync is defined in [ADR-52](https://github.com/decentraland/adr/blob/main/docs/ADR-52-content-new-sync.md)

## Which endpoints are used?

> The library used to query the following endpoints is [snapshots-fetcher](https://github.com/decentraland/snapshots-fetcher). It serves as reference implementation of the synchronization.

### `GET /content/snapshots`

This endpoint returns the hash id of a file that contains all the active entities of the server. Then, the file can be downloaded from the server and parsed to deploy the changes locally.

The format of the snapshots is a list of JSONs also known as [ndjson](http://ndjson.org/), so it can be read line by line and each of them can be parsed as a valid JSON.

### `GET /content/contents/{ipfsCid}`

Endpoint to retrieve all files: snapshots files, entity.json files and content files.

### `GET /content/pointer-changes`

Enpoint that returns all the deployed entities in a period of time.
