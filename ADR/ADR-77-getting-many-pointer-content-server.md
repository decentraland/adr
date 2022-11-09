---
layout: doc
adr: 77
date: 2022-04-04
title: New endpoints to retrive pointers
status: ACCEPTED
authors:
  - agusaldasoro
type: Standards Track
spdx-license: CC0-1.0
---

## Context

The current implementation of content server allows clients to get entitites by entityId or by pointer. When doing that they have to send the filters as query parameters, this results in having a max amount of pointer/entityIds that can be sent in one request limited to the URL length and not by the server itself.

This change is necessary for the [ADR 58](/adr/ADR-58).

## Decision

In this proposal, the idea is to have a new endpoint to retrieve entities that implements the POST method, so all the filters can be sent in the body so the max amount of filters will be increased to 200, as that will be the limit from the server side.

The current endpoint `/content/entities/{entityType}` endpoint is very complex to use and has some UX problems. That endpoint can filter by entityId and by pointer, anyway when using the entityId filter, the entityType is ignored. This endpoint provides the functionality to specify which fields of the entities must be retrieved.

# Status

Accepted.

# Consequences

1. Deprecate `/content/entities/{entityType}` endpoint, it'll still be accessible for a period of time, but not documented.
2. Create a new endpoint `/content/entities/active` to get all active entities filtering by `entityId` or by `pointer`. As the user may be requesting many ids, then this endpoint will expose a POST method so all the needed ids/pointers will be included in the body of the request and there will be no limit for query parameters.
   - deprecate fields parameter: always return all fields from the entity.
   - deprecate entityType parameter: it's redundant
   - Allow filtering by ids field XOR pointers, one of them must be present but not both.

Request

```yaml
post:
  operationId: getListOfEntities
  summary: List of entities of the specified Type
  tags:
    - Content Server
  description: >-
    Returns the list of entities of the specified type with the specified id or
    pointers. Only one of these filters must be specified in the body.
  requestBody:
    content:
      application/json:
        schema:
          type: object
          properties:
            pointers:
              description: >-
                Entities must be filtered by pointer XOR entityId (ids). Use this parameter if
                you want to retrieve an entity of the specified type with this pointer.
              type: array
              items:
                type: string
                example: urn:decentraland:mumbai:collections-v2:0xf6426e0c70c17509038aba78137e721d187499d6:0
            ids:
              description: >-
                Entities must be filtered by pointer (pointers) XOR entityId. Use this parameter if
                you want to retrieve an entity of the specified type with this entityId.
              type: array
              items:
                type: string
                example: QmeA8RpAtqU6gCebNaWRXtM9nQs3ugzzbeQm3L7uKrP4Jp
  responses:
    "200":
      description: >-
        List of entities corresponding to the matching ids or pointers.
      content:
        application/json; charset=utf-8:
          schema:
            type: object
          example:
            $ref: ../../components/examples/content/200-entities-active.json
    "400":
      description: >-
        Bad request: ids or pointers must be present in the request, but not
        both
```

Response

```json
[
  {
    "version": "v3",
    "id": "QmQ9UorFsVTpaVpCwJZAzFyCmaGf7Ksi6aQHYTJVKyzVMh",
    "type": "scene",
    "timestamp": 1581034082829,
    "pointers": ["100,0"],
    "content": [
      {
        "file": "Fork_0.glb",
        "hash": "QmdnkhnMwaFWs5ysAQ4Y8r9CSYMoMvpiAcaLr1PJoQFbZU"
      },
      {
        "file": "game.js",
        "hash": "QmXdgLxwgBRr3igNoJAu7Qi6KtMR6WR5kUSRtZVERnQH9A"
      },
      {
        "file": "OpenRoad_0.glb",
        "hash": "QmRF2LA6AdTP8ZTsKpf6WGW8iZesfmKqMzYrg7Yx1nbLU9"
      },
      {
        "file": "scene.json",
        "hash": "QmPgaz3kzicJKAtagqGHN5LYFvECimz4te5CVU9y4EbPgo"
      }
    ],
    "metadata": {
      "display": {
        "title": "Road at 100,0 (open road OpenRoad_0)",
        "favicon": "favicon_asset"
      },
      "contact": {
        "name": "",
        "email": ""
      },
      "owner": "",
      "scene": {
        "parcels": ["100,0"],
        "base": "100,0"
      },
      "communications": {
        "type": "webrtc",
        "signalling": "https://signalling-01.decentraland.org"
      },
      "policy": {
        "contentRating": "E",
        "fly": true,
        "voiceEnabled": true,
        "blacklist": [],
        "teleportPosition": ""
      },
      "main": "game.js",
      "tags": []
    }
  }
]
```

---

More reading:

1. [Catalyst API spec](https://github.com/decentraland/catalyst-api-specs)
2. [ADR 58](/adr/ADR-58)
