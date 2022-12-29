---
layout: adr
adr: 158 
title: Enforce contents field present in profile deployment
date: 2022-12-22
status: Final
type: Standards Track
spdx-license: CC0-1.0
authors:
  - agusaldasoro
---

## Abstract

As the deployments to the content server can exclude existing files, that ended up in the clients to forget to reference those files in the entity. The format of the profiles is already standarized, so a new validation needs to be added that checks that in the `contents` field of a deployment, it includes the files: `face.png` and `body256.png`.

## Context, Reach & Prioritization

Not validating the contents field of the profile deployments ended up in an inconsistent state of the Content Servers, as when running garbage collection the files of active profiles weren't being referenced so they were deleted.
More info at [Catalyst Issue](https://github.com/decentraland/catalyst/issues/1370)

## Solution Space Exploration

Before activating this validation, all clients need to fix the way they are deploying profiles. In particular: update [Decentraland dApps](https://github.com/decentraland/decentraland-dapps/blob/de92b4cc4ac701e6f51a92802bbaa27fdda22897/src/lib/entities.ts#L94) to send the necessary `hashesByKey` when making a deployment with the Catalyst Client using the `buildEntityWithoutNewFiles`. An example of that can be found at [Kernel](https://github.com/decentraland/kernel/blob/3eb437a4a956abaa4dfd287eb5c85c0d5b1d9112/packages/shared/profiles/sagas.ts#L452)


## Specification

This new validation will take place starting from the date GMT: Tuesday, January 10, 2023 3:00:00 PM as documented in [ADR-51](/adr/ADR-51)

`1673362800000 = 2023-01-10T15:00:00Z`

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
