---
adr: 110
date: 2022-10-04
title: Realm description
authors:
  - agusaldasoro
  - hugoarregui
  - menduz
status: Living
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-10
---

# Abstract

This document defines the protocol to describe a realm.

## Realm

A `realm` is a set of services needed for the client to work: current there is comms, content and lambdas. A valid realm is pointed by a URL defining `/about` endpoint in the proper format, which describes the realm and its status.

## /about

This endpoint should return a json like [this](https://github.com/decentraland/protocol/blob/main/bff/http-endpoints.proto):

```typescript
type About = {
  healthy: boolean
  configurations: {
    networkId: number
    realmName?: string
    scenesUrn: string[]
    globalScenesUrn: string[]
  }
  content: {
    healthy: boolean
    version?: string
    commitHash?: string
    publicUrl: string
  }
  comms: {
    healthy: boolean
    protocol: string
    fixedAdapter?: string
    usersCount?: number
  }
  lambdas: {
    healthy: boolean
    version?: string
    commitHash?: string
    publicUrl: string
  }
  bff?: {
    healthy: boolean
    userCount: number
    commitHash?: string
    publicUrl: string
  }
}
```

Example:

```json
{
  "healthy": true,
  "content": {
    "healthy": true,
    "version": "5.1.2",
    "commitHash": "dce61c002c89db4966c0cdd008d3d654f297050b",
    "publicUrl": "https://peer.decentraland.org/content"
  },
  "configurations": {
    "realmName": "catalyst-4",
    "networkId": 1
  },
  "comms": {
    "healthy": true,
    "protocol": "v3",
    "fixedAdapter": "ws-room:mini-comms.decentraland.org/rooms/test-room"
  },
  "lambdas": {
    "healthy": true,
    "version": "5.1.2",
    "commitHash": "dce61c002c89db4966c0cdd008d3d654f297050b",
    "publicUrl": "https://peer.decentraland.org/lambdas"
  },
  "bff": {
    "healthy": true,
    "commitHash": "369c5dafeda62a1b16f5232cd477565cc3f3d513",
    "userCount": 0,
    "publicUrl": "/"
  }
}
```

## Health

If the realm is in healthy state, the endpoint must return a http status 200, otherwise it should return 503. This way just by checking the response http status, a client looking for a realm to connect may decide to connect or not to the realm.

The `healthy` field in the root of the structure) will be true only if all the referenced services are `healthy`.

## Comms description

There are several possible comms configs:

- If `protocol` is `v2` it will present an structure like:

```json
{
  "comms": {
    "healthy": true,
    "protocol": "v2",
    "version": "1.0.0",
    "commitHash": "43d2173cf5e2078b32bddab5adb90e4778170c44",
    "usersCount": 152
  }
}
```

- When `protocol` is `v3` there are two alternatives.

  - Fixed adapter

    ```json
    {
      "comms": {
        "healthy": true,
        "protocol": "v3",
        "fixedAdapter": "ws-room:mini-comms.decentraland.org/rooms/test-room"
      }
    }
    ```

    This means the client will connect to the provided adapter, there is no clustering process involved. The available adapters can be found at [ADR-180](/adr/ADR-180)

  - Clustering. If no `fixedAdapter` is provided, this means the client will negotiate through the BFF to join a cluster. For details about this check [ADR-70](adr/ADR-70)
