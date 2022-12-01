---
layout: adr
adr: 145
title: Pick Realm Algorithm V2
date: 2022-11-28
status: Draft
type: RFC
spdx-license: CC0-1.0
slug: /adr/TEMPLATE
authors:
  - agusaldasoro
---

## Abstract

This document describes the changes needed in the realm picking algorithm to take into account the resources of the computer and the catalyst version.

The logic on the realm scoring algorithm should be improved to take into consideration more variables in order for a server to be more eligible. As with the current model, any added variable needs to be modifiable through Feature Flags so that they can be changed in case of need without a release or a reboot of the server.

## Context, Reach & Prioritization

Some aspects that should be considered:

- Resources: if a server has either CPU or memory at 90%, don't add more load to that server.
- Catalyst version: if the version of the node is behind the network, it should be less eligible.


## Solution Space Exploration

The current implementation (as described in [Realm Picking Algorithm ADR](/adr/ADR-86)) is expansible by adding new links. In this proposal a filter and a new link will be added: 
- Accepting Users Filter: Will filter out if the amount of resources for that Catalyst is at limit.
- Version Link: the algorithm will prioritize sending traffic to instances that have the latest version


## Specification

### Accepting Users Filter

_Description_:

Publicly exposing the Catalyst Node's available resources is a security risk, so their estimation should be done in the Catalyst (specifically in the BFF) and not in the Kernel.

This way, the BFF will leverage the usage of the field `accepting_users` in the `/about` endpoint.

The logic from the Kernel side will be simple: it will filter out the catalysts having that value as false.

On the other hand, the BFF will have a set of rules to calculate that value. The `accepting_users` field will be false if:
- The max amount of users for the server is reached
- The CPU is at 90% or higher
- The memory usage is at 90% or higher


_Pseudo Code_:

To filter out a new check will need to be added to:
https://github.com/decentraland/kernel/blob/main/packages/shared/dao/index.ts#L69


```typescript
export function fetchCatalystStatus() {

  if (currentChecks && result.accepting_users) {
    ...
  }

  return undefined
}
```

_Configuration_:

This configuration will be at BFF (Catalyst) level

```typescript
export type AcceptingUsersConfig = {
  config?: 
          { maxAmountOfUsers: number;
            maxCpu: number;
            maxMemory: number;
          }
}
```


### Catalyst Version Link


_Description_:

Each Catalyst (BFF) exposes the version of Content and Lambdas that it's using. The Kernel should read that field, compare them and prioritize the ones having the highest value.
As Content Server and Lambdas share the same version for each Catalyst and they are using semver, there is always an unique way to sort the candidates.


_Pseudo Code_:

```typescript
export function versionLink() {
  const catalystsWithVersio: { realm: string, version: string } = peers.sortByVersion()
  const versionBuckets: PriorityQueue<{ realm: string, version: string }[]> = groupByVersions(catalystsWithVersion)
  // This selects randomly between the candidates in the selected bucket 
  // And choses the bucket with the same algorithm used for close peers
  return selectFirstByScore(context, score, definitiveDecisionThreshold)
}
```
