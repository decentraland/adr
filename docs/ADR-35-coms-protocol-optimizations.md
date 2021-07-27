# Catalyst communication protocol optimizations

## Context and Problem Statement

We are facing some issues that need to be addressed. We can list a couple of them as important:

- The hard limit of 100 people we currently have is not that bad for small events or some games and expositions. But we have it for the whole world. We need to make better use of the 100 limit, which is of network size and not of people. We also need to improve this limit for some situations, like big events.
- New users have a hard time understanding realms. Since we didn’t make them an integral part of UI/UX, the only way a user can know in which realm they are is in URL.
- We don’t do enough to communicate the status of the realms to the users. A user can be alone in a realm and don’t know why they aren’t seeing anyone, given that there could be a lot of users in another realm.

## Decision

We will start rolling out a series of Protocol optimizations to help Decentraland communications systems to scale in different ways.

Planned optimizations topics are:
- Reduce complexity of layers for users, removing them completely, and by doing so, optimize "finding people in the world"
- Enable vertical & horizontal scallability
- Optimizing connections topologies in P2P networks
- Reduce latency between users
- Increase success rate in WebRTC P2P connections

### Rationale behind the removal of "layers"

Layers are logical "connection groups" inside the realms, as of today, realms are mapped 1to1 with a catalyst instance. Inside the catalyst, it would be sub-optimal to connect users all-to-all.

By default every catalyst have 28 layers, each one with a different color name. We can infer then, that the maximum amount of concurrent users connected to a catalyst is 2800 users (28 * 100).


Layers are the color after the name of the realm:
```
artemis-amber
        ^^^^^ layer
^^^^^^^       realm
```
Layers served some purposes during their existence:
- To enable horizontal scallability in catalysts, without the need of DAO approval, each catalyst have layers, which are groups of up to 100 users inside a catalyst.
- By separating users logically, that gives the renderer some room to render fewer avatars and therefore allocate more resources to the rendering of other assets.

Layers served their purpose in early stages of the project, but the time has come to evolve the protocol. Therefore we introduce _connection islands_.

#### What are connection islands?

Connection islands are groups of connections based on their geographical location, instead of logic layers.

The implementation performs real-time clustering, organizing connections in islands (clusters) of close peers, which will connect to each otheer

That solves many problems:
- Reduces the complexity to find people in the world: Only the realm is required now to find a friend.
- Optimizes finding people: it was common to join a realm with lots of people, but the connection is assigned to a layer without people in the parcel you are standing. While in other layers you may find people in that layer.
- Removes the 2800 user limit: there can be virtually infinite islands in a catalyst, as long as the resources of the server allow it.

The implementation of the algorithm can be found at https://github.com/decentraland/archipelago


## Status

Accepted


## Consequences

### Call to action for scene creators

The first change of those is the removal of layers. This week (July 26, 2021) the `peer-testing` catalyst will have the new API and it won't have layers. Since layers and realms were always a "packed-string", the changes in the protocol should not be harmful. But we understand some scenes _use the layers_ from the realms. And that will require adaptation from your end.

#### Changes to SDK API

Scene developers have access to a `EnvironmentAPI`, which they can use to get information about current realm.

No changes to types have been made to maintain code compatibility. But when the player enters a realm that doesn't have a layer (new API), it will now come with an empty string as layer.

```typescript
import { getCurrentRealm } from '@decentraland/EnvironmentAPI'

const realm = await getCurrentRealm()

realm.layer // Will be '' (empty string) if the realm is "new API"
```

This should work well for comparing a realm with another (for instance, if you need to check that two realms are the same, you can use the same logic as before).

Will probably result in minor issues when showing the realm. For instance, `artemis-`.

Keep in mind that realms with layers and realms without layers will coexist for some time, so it'd be ideal to support both empty layer and not-empty layer in code.

#### Changes to catalyst APIs

New catalysts won't have layers at all. This means:

* `GET /comms/status?includeLayers=true` won't include any layer
* All `GET /comms/layers/:layerId` endpoints have been removed

There are a couple of use cases for clients that have been considered, and new APIs have been implemented:
* `GET /comms/status?includeUsersParcels=true` now includes a field `usersCount` which contains the amount of users connected to this server. Also, it contains a field `usersParcels` which is a list of the parcels of the users, one entry for each user.
* `GET /comms/islands` will return information about the islands (clusters) calculated by the lighthouse. This may be disabled during high load because it can grow large.
* `GET /comms/islands/:islandId` will return information about a particular island.
* `GET /comms/peers` will return information about the peers currently registered by the lighthouse. This may be disabled during high load because it can grow large.

Keep in mind that realms with layers and realms without layers will coexist for some time, so you'll need to check the lighthouse version in order to see if it is old or new.

For instance:
* `GET /comms/status?includeLayers=true&includeUsersParcels=true` if it is a new catalyst will return something like this:

```json
{
  "name": "thor",
  "version": "1.0.0",
  "currenTime": 1627409585484,
  "env": {
    "secure": false,
    "commitHash": "53c191af95c8969a82d9a80acc58fd809f86ae11",
    "catalystVersion": "1.2.0"
  },
  "ready": true,
  "usersCount": 0,
  "usersParcels": [

  ]
}
```

Since it says "version 1.0.0", and it doesn't include the attribute `layers`, it doesn't have layers.

If it is an old catalyst, will return something like this:

```json
{
  "name": "heimdallr",
  "version": "0.2",
  "currenTime": 1627410339856,
  "env": {
    "secure": false,
    "commitHash": "3ce6eff06d4605655fc5b801bfcbca2af9ab7dd9",
    "catalystVersion": "1.2.0"
  },
  "ready": true,
  "layers": [...list of layers...]
}
```

You can also assume that if the response of `GET /comms/status?includeLayers=true&includeUsersParcels=true` includes the attribute `layers`, then it is an old catalyst. And if it includes the attribute `usersParcels` then it is a new catalyst.


## Participants

- @pablitar
- @menduz
- @pentreathm
