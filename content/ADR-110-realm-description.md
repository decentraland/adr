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

This endpoint should return a well-known schema defined [in the protocol repository](https://github.com/decentraland/protocol/blob/main/bff/http-endpoints.proto):

```typescript
type About = {
  healthy: boolean
  acceptingUsers: boolean
  configurations: {
    networkId: number
    realmName?: string
    scenesUrn: string[]
    globalScenesUrn: string[]
    cityLoaderContentServer?: string
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

Example https://peer.decentraland.org/about:

```json
{
  "healthy": true,
  "content": {
    "healthy": true,
    "version": "6.0.6",
    "commitHash": "d2eeccaffe2a9c22ac963348851c7791b63fc517",
    "publicUrl": "https://peer-ec2.decentraland.org/content/"
  },
  "lambdas": {
    "healthy": true,
    "version": "6.0.6",
    "commitHash": "d2eeccaffe2a9c22ac963348851c7791b63fc517",
    "publicUrl": "https://peer-ec2.decentraland.org/lambdas/"
  },
  "configurations": {
    "networkId": 1,
    "globalScenesUrn": [],
    "scenesUrn": [],
    "realmName": "hela"
  },
  "comms": {
    "healthy": true,
    "protocol": "v3",
    "commitHash": "b3ec3327ceef53473853068dcdad8ea08d7a0f9c"
  },
  "bff": {
    "healthy": true,
    "commitHash": "1a2ff915a216191ecc6ef85f3822f0809fe16f3c",
    "userCount": 4,
    "protocolVersion": "1.0_0",
    "publicUrl": "/bff"
  },
  "acceptingUsers": true
}
```

Example https://worlds-content-server.decentraland.org/world/menduz.dcl.eth/about:

```json
{
  "healthy": true,
  "configurations": {
    "networkId": 1,
    "globalScenesUrn": [],
    "scenesUrn": [
      "urn:decentraland:entity:bafkreihiv5zkzjui46gvxtsnk5pfogmq7kyzijxpf3gjqlb2ivydcuwgxq?baseUrl=https://worlds-content-server.decentraland.org/contents/"
    ],
    "minimap": {
      "enabled": false
    },
    "skybox": {},
    "realmName": "menduz.dcl.eth"
  },
  "content": {
    "healthy": true,
    "publicUrl": "https://peer.decentraland.org/content"
  },
  "lambdas": {
    "healthy": true,
    "publicUrl": "https://peer.decentraland.org/lambdas"
  },
  "comms": {
    "healthy": true,
    "protocol": "v3",
    "fixedAdapter": "signed-login:https://worlds-content-server.decentraland.org/get-comms-adapter/world-prd-menduz.dcl.eth"
  },
  "acceptingUsers": true
}
```

## Health property

`healthy: boolean` is used to inform whether the realm is in healthy state, the endpoint must return a http status 200, otherwise it should return 503. This way just by checking the response http status, a client looking for a realm to connect may decide to connect or not to the realm.

The `healthy` field in the root of the structure) will be true only if all the referenced services are `healthy`.

## Accepting users property

`acceptingUsers: boolean` is used to inform whether is accepting new users. It differs from `healthy` in conditions like "maximum communications capacity" or "high server load".

## Configurations section

Describes explorer-specific configurations.

- `realmName?: string` is used to set a human readable name for the realm
- `networkId?: uint` defines the EVM network id in which this realm is configured, defaults to `1`
- `globalScenesUrn?: string[]` declares which global scenes should be loaded by default on the realm. This is used to show custom "in-world" UIs or to enable cross-scene mechanics.
- `scenesUrn?: string[]` declares the list of scenes to be loaded. This feature enables World realms [ADR-111](/adr/ADR-111)
- `minimap?: {enabled: boolean, dataImage: string, estateImage: string}` configures the minimap of the explorer
- `skybox?: {fixedHour: float}` configures the skybox hour
- `cityLoaderContentServer?: string` defines the baseUrl to enable genesis-city-like scene loading. It uses the endpoint /entities/active to fetch the scenes around the user. Defaults to `https://peer.decentraland.org/content`. If null and `scenesUrn` are provided, then city-loading behaviors will be disabled. <todo>City loading ADR is pending</todo>

## Comms section

Describes the communications services parameters and connection information.

When `protocol: "v3"` is currently the only valid and implemented version of comms.

- When `fixedAdapter` is provided, it means the client will connect to the provided adapter, there is no clustering process involved. The available adapters can be found at [ADR-180](/adr/ADR-180)

  ```json
  {
    "comms": {
      "healthy": true,
      "protocol": "v3",
      "fixedAdapter": "ws-room:mini-comms.decentraland.org/rooms/test-room"
    }
  }
  ```

- If no `fixedAdapter` is provided, this means the client will negotiate through the BFF to join a cluster. For details about this check [ADR-70](adr/ADR-70)

<details>
<summary><code>protocol: v2</code> was deprecated. Expand this view to see an example</summary>
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

</details>
