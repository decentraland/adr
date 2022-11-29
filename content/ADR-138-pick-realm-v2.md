---
layout: adr
adr: 138
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

The logic on the realm scoring algorithm should be improved to take into consideration more variables in order for a server to be more eligible. As with the current model, any added variable needs to be modifiable through Feature Flags so that they can be changed in case of need without a release or a reboot of the server.

## Context, Reach & Prioritization

Some aspects that should be considered:

- Resources: if a server is with the CPU at 90%, don't add more load to that server, same for memory
- Catalyst version: if the version of the node is behind the network, it should be less eligible


## Solution Space Exploration

The current implementation as described in [Realm Picking Algorithm ADR](/adr/ADR-86) is expansible by adding new links. In this proposal two new links need to be added: resources and version, as the traffic will need to be prioritized to instances that have the latest version and more resources available.


## Specification

### Resources Link

Expose publicly the resources availables of a Catalyst Node is a security risk, so the estimation of resources available should be done in the Catalyst (specifically in the BFF) and not in Kernel.

### Catalyst Version Link

Each Catalyst (BFF) exposes the version of Content and Lambdas that it's using. Kernel should read that field, compare them and prioritize the ones that have the greatest value.

