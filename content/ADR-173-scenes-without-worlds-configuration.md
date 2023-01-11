---
layout: adr
adr: 173
title: Catalyst Network to reject scene deployments that contain worldConfiguration section
date: 2023-01-11
status: Review
type: Standards Track
spdx-license: CC0-1.0
authors:
- marianogoldman

---

## Abstract

Scene is the only entity type that can be deployed in two different
services: the Catalyst Network and the Worlds Content Server.

When deploying scenes to Catalyst Network a new validation will reject those
that have `worldConfiguration` section as it doesn't make sense in Genesis
City and may lead to confusions with regard to the same scene deployed in
Worlds Content Server.

## Context, Reach & Prioritization

In order to deploy to Worlds Content Server it is mandatory to add a section
like the following in `scene.json`.

```json
{
  "worldConfiguration": {
    "name": "some-dcl-name.dcl.eth"
  }
}
```

This contains metadata that is important at the time of deployment. In the
Catalyst Network this information is completely ignored, and hence, unnecessary.

In a regular flow while creating content, the developer could use Worlds as
a preview service, and once the scene is polished and final he is ready to
deploy to the Catalyst network under some owned parcel(s). At this stage, that
`scene.json` should have the `worldConfiguration` section removed, so that
information between Worlds and Genesis City is kept where it belongs.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "
> SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL"
> in this document are to be interpreted as described in RFC 2119 and RFC 8174.
