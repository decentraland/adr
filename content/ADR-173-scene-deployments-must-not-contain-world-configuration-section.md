---
layout: adr
adr: 173
title: Scene deployments must not contain worldConfiguration section
date: 2023-01-11
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - marianogoldman
---

## Abstract

A scene is the only entity type that can be deployed in two different services: the Catalyst Network and the Worlds Content Server.

When deploying scenes to the Catalyst Network, a new validation will reject those that have the `worldConfiguration` property defined in their `scene.json` file as it doesn't make sense in the Genesis City and may lead to confusion about the same scene deployed in
the Worlds Content Server.

## Context, Reach & Prioritization

In order to deploy a scene to the Worlds Content Server it is mandatory to add a `worldConfiguration` property like the following in its `scene.json` file:

```json
{
  "worldConfiguration": {
    "name": "some-dcl-name.dcl.eth"
  }
}
```

This contains metadata that is important at the time of deployment. It may also contain other configuration, like skybox settings, communications transport to use, etc. None of these settings have any effect in the Catalyst Network, this information is completely ignored and may lead to confusion.

In a regular content creation flow, the developer could use Worlds as
a preview service, and once the scene is polished and finished he is ready to deploy to the Catalyst network under some owned parcel(s). At this stage, the `scene.json` should have the `worldConfiguration` property removed, so that the information between Worlds and the Genesis City is kept where it belongs.

## Decisions

A new validation is added to content validator so that the Catalysts can reject deployments of scenes containing the `worldConfiguration` property.

## Deadline

    ADR173_DEADLINE: 2023-01-17T15:00:00Z
    Unix Timestamp: 1673967600000

## Consequences

Entities that don't pass the validations will be rejected after the deadline.
