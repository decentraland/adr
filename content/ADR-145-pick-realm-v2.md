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

- Resources: if a server is with the CPU at 90%, don't add more load to that server, same for memory
- Catalyst version: if the version of the node is behind the network, it should be less eligible


## Solution Space Exploration

The current implementation as described in [Realm Picking Algorithm ADR](/adr/ADR-86) is expansible by adding new links. In this proposal two new links need to be added: resources and version, as the traffic will need to be prioritized to instances that have the latest version and more resources available.


## Specification

### Resources Link

Publicly exposing the Catalyst Node's available resources is a security risk, so their estimation should be done in the Catalyst (specifically in the BFF) and not in the Kernel.

This way, the BFF will leverage the usage of the field `accepting_users` in the `/about` endpoint.

The logic from the Kernel side will be simple: it will filter out the catalysts having that value as false.

On the other hand, the BFF will have a set of rules to calculate that value. The accepting users' field will be false if:
- The max amount of users for the server is reached
- The CPU is at 90% or higher
- The memory usage is at 90% or higher

### Catalyst Version Link

Each Catalyst (BFF) exposes the version of Content and Lambdas that it's using. The Kernel should read that field, compare them and prioritize the ones having the highest value.

