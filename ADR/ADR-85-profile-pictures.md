---
layout: doc
adr: 85
date: 2022-10-20
title: Profile Pictures
status: ACCEPTED
authors:
  - guidota
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

While developing Channels' social feature, it was needed to render profile images when listing channel members or displaying messages for people that is not a friend or is not nearby in the world.
Retrieving a profile image from the Catalysts implies knowing which is the file in the Content server and it can be hard to know with just the address of the user.

## Considered options

- Fetch profile information and store it in the Catalog as we do for Friends
- Users share their image hash, communicating it to the Matrix server and coupling the logic to the existence of the file in the Content server.
- Expose an endpoint that given an address it returns the image

## Decision

The first option implies a huge impact on performance and user experience because it has to wait for all users to resolve their profiles in order to display the information.
The second option implies the possibility of inconsistencies. It introduces a complex logic in the Kernel that is hard to maintain and doesn't guarantee the existence of the image.

The decision is to implement an HTTP endpoint that given a user address it returns the corresponding image from the Catalysts. It can also be re-used by other systems:

`GET https://synapse.decentraland.org/profile-pictures/{address}`

Internally, it will retrieve the user Profile from Lambdas and redirect the request to the corresponding URL (`face256`) or a default image in case of Profile absense.

## Status

Accepted
