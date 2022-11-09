---
layout: doc
adr: 9
date: 2020-10-22
title: DecentralandInterface evolution plan
status: Stagnant
authors:
- nchamo
- menduz
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

How should we proceed to maintain compatibility between the current SDK and the next-gen SDK currently being developed?

Taking into consideration:
* All the scenes currently deployed must work as they work today.
* `DecentralandInterface` should work indefinitely to maintain backwards compatibility.
* Maintainance costs should be taken into account

## Considered Options

1. Develop the next-gen SDK on top of the DecentralandInterface
2. Develop a new and clean interface for the next-gen SDK, then create an adapter for the legacy `DecentralandInterface`

## Decision Outcome

We decided to develop a new and clean interface for the next-gen SDK, then create an adapter for the legacy `DecentralandInterface` (option 2) because:

* We should not be limited by the decisions of the past SDK
* The new SDK must eventually prove itself by reaching a feature parity with the current interface
* Avoid sunk cost fallacy with the old SDK
