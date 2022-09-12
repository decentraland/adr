---
layout: adr
slug: adr/ADR-53
adr: 53
date: 2020-01-53
title: Test collections in the explorer
---

## Statement of the problem

The current wearable editor does not support ambient occlusion and interactions like jumping, running, and visiting places. Therefore, we need a way to test the wearables
and assets in the explorer.

## Solution proposed

Support query params in the explorer:

- BUILDER_SERVER_URL: Define which URL we should use in order to fetch things builder-server like. E.g: `https://builder-api.decentraland.org/v1`

- WITH_COLLECTIONS: Collections urn or UUIDs comma separated. If the collection is an `urn` it should fetch the collection from the catalyst. The catalyst to be used will be the one set in the `CATALYST_URL` query param or the connected catalyst if the query param is not set. If the collection is a UUID, it should fetch the collection from the `BUILDER_SERVER_URL`.
  `WITH_COLLECTIONS` must work only when the `NETWORK` query parameter is set to `ropsten`. E.g: `urn:decentraland:collection1,urn:decentraland:collection2,1234-123123-1231231`.

## Participants

- @menduz 

- @Shibu

- @Nacho
