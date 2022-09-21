---
layout: doc
adr: 79
date: 2022-09-18
title: Method to download the content from an entity
status: ACCEPTED
authors:
  - menduz
---

## Abstract

This document describes the method to access and download all the files of an entity from a content server. It MUST be consistent with all entity types and content servers.

The algorithm to download an entity starts with an entity or pointer in the content server or using an entity ID directly. This document describes both mechanisms.

## Resolving pointers

To resolve entity of a specific pointer, the endpoint defined at [ADR-77](/adr/ADR-77) may be used.

```http
POST /content/entities/active HTTP/1.1
Host: https://peer.decentraland.org
Content-Type: application/json

{
  "pointers": ["-49,-100"]
}
```

The response to the previous request is the list of active entities corresponding to the deployed pointers provided by the POST body.

The type of the response is the standard entity type for content servers and deployments defined in [ADR-80](/adr/ADR-80).

```yaml
[
  {
    "version": "v3",
    # we care about this ID 👇
    "id": "bafkreif5c6rjswu6cbj5astv5uuc7yrxbm73tycegrnjqhhp3q6qeop3ym",
    "type": "scene",
    "pointers": [
      "-49,-100",
      "-49,-99",
      "-48,-100",
      "-48,-99",
      "-47,-100",
      "-47,-99"
    ],
    "timestamp": 1656605369643,
    "content": [ ... ],
    "metadata": { ... }
  }
]
```

## Downloading content using the entity ID

Now that the entity ID has been found (`bafkreif5c6rjswu6cbj5astv5uuc7yrxbm73tycegrnjqhhp3q6qeop3ym`) the next thing to do is to download the entity from the content server. The entity is a deployed file and thus, the `/content/contents/:cid` endpoint can be used both for the entity itself and for all the content files of the response. This mechanism is used to download and synchronize all the assets for Decentraland.

### Downloading the entity file and resolving all files

```http
GET /content/contents/bafkreif5c6rjswu6cbj5astv5uuc7yrxbm73tycegrnjqhhp3q6qeop3ym HTTP/1.1
Host: https://peer.decentraland.org
```

<details>
<summary>Show response</summary>

```json
{
  "version": "v3",
  "type": "scene",
  "pointers": [
    "-49,-100",
    "-49,-99",
    "-48,-100",
    "-48,-99",
    "-47,-100",
    "-47,-99"
  ],
  "timestamp": 1656605369643,
  "content": [
    {
      "file": "bin/game.js",
      "hash": "bafybeianxkwd7i4cgxdat7mu4nbxfyic6qtswxlq2ehk634xefsscxsuya"
    },
    {
      "file": "scene-thumbnail.png",
      "hash": "bafkreihykskexrtmeilyl5eukvc2da2w523mwraklmqp34xm2oyxt3ahmi"
    },
    {
      "file": "package.json",
      "hash": "bafkreibinrrx4j4qj66xpphm7tqrqaa6mhf3doef4oyco4w5f7zkjk3req"
    },
    {
      "file": "scene.json",
      "hash": "bafkreiezhvidcduvcoou6vovjij42mbxjuww7wrcjbigk7cbxpv5jdojam"
    },
    {
      "file": "tsconfig.json",
      "hash": "bafkreiggh76i724airh4qayp3surhpizy5wlliadu7bwb7l62azmiqsvmm"
    },
    {
      "file": "c9b17021-765c-4d9a-9966-ce93a9c323d1/FloorBaseGrass_01/FloorBaseGrass_01.glb",
      "hash": "bafkreibytthve4zjlvbcnadjec2wjex2etqxuqtluriefzwwl4qe2qynne"
    },
    {
      "file": "c9b17021-765c-4d9a-9966-ce93a9c323d1/FloorBaseGrass_01/Floor_Grass01.png.png",
      "hash": "bafkreid2fuffvxm6w2uimphn4tyxyox3eewt3r67zbrewbdonkjb7bqzx4"
    },
    {
      "file": "c9b17021-765c-4d9a-9966-ce93a9c323d1/FloorBaseGrass_01/thumbnail.png",
      "hash": "bafkreiettvk4675jx7oi7pofbggn5kbgu6s6gqztiw4bcxhbik4actedge"
    },
    {
      "file": "c4a799c1-9ef8-4787-914e-4f8c15357881/tsconfig.item.json",
      "hash": "bafkreid3hvglniaeel3pekpe46t6vkuv4q23va5yavih242amp7sgnwhue"
    },
    {
      "file": "c4a799c1-9ef8-4787-914e-4f8c15357881/package.json",
      "hash": "bafkreidf2t3j5bilj6altj6c2tdyuhwalrtyxyd5nkvnxgh6kkauxmarz4"
    },
    {
      "file": "c4a799c1-9ef8-4787-914e-4f8c15357881/bin/game.js",
      "hash": "bafkreidfvoyks35qkxhsawvwv7rrdebvat2vra7e53upohmrppmf3x7xnu"
    },
    {
      "file": "c4a799c1-9ef8-4787-914e-4f8c15357881/bin/item.js",
      "hash": "bafkreifhd5vmhbwffy3uxok3spka4aludpasghnzylqnv2y2lmduw37hoe"
    },
    {
      "file": "c4a799c1-9ef8-4787-914e-4f8c15357881/bin/game.js.lib",
      "hash": "bafkreifs5klsfkon5mwgds33evwkia37bmuzj57e42pm6gf4jsrj5uqs2m"
    },
    {
      "file": "c4a799c1-9ef8-4787-914e-4f8c15357881/models/Billboard_Black.glb",
      "hash": "bafybeifeh3zekilxykag27ajw62n27xn4xhrdbhukyglescqii2efeubva"
    },
    {
      "file": "0ee46c79-338c-445a-a506-ea26d80fbe46/package.json",
      "hash": "bafkreigyepxkbwabsbwtzn7sz4umyv4dkqqapmfy6qoqs6dipg6koxjl4m"
    },
    {
      "file": "0ee46c79-338c-445a-a506-ea26d80fbe46/teleport.zip",
      "hash": "bafkreihi5gt5pygtkvnbcj24ha6eyyiogdbczwa5tuywtc2y3jt2ivt5ty"
    },
    {
      "file": "0ee46c79-338c-445a-a506-ea26d80fbe46/bin/game.js",
      "hash": "bafkreiemafttpkvk554ok65nrckaalmkkwvwppheeyq67hhvemteos5dui"
    },
    {
      "file": "0ee46c79-338c-445a-a506-ea26d80fbe46/models/teleport.glb",
      "hash": "bafkreibvpocch7j6n3xemoopx4ktpkk44ov6umj4vyvwhkljysqfr3ufzi"
    },
    {
      "file": "ab84996d-dcdc-429c-818e-a7640239c803/package.json",
      "hash": "bafkreiamlhdxedwxknhvsxguo2mdqd66dcnekprqcqyog3ijcrky5wetda"
    },
    {
      "file": "ab84996d-dcdc-429c-818e-a7640239c803/tsconfig.item.json",
      "hash": "bafkreid3hvglniaeel3pekpe46t6vkuv4q23va5yavih242amp7sgnwhue"
    },
    {
      "file": "ab84996d-dcdc-429c-818e-a7640239c803/bin/game.js",
      "hash": "bafkreihyccictew7eez6jwgg7z5rlc3jstkhaas4dhgi2dhxvh2pvceyoa"
    },
    {
      "file": "ab84996d-dcdc-429c-818e-a7640239c803/bin/game.js.lib",
      "hash": "bafkreicici73fjyvqym357xqdksd5ublfk2e22xdw7gnrs3waydrohcljy"
    },
    {
      "file": "ab84996d-dcdc-429c-818e-a7640239c803/bin/item.js",
      "hash": "bafkreieaxdkdf7smrbwebowadpinj66wxm5dobuner67pqqgpafhxjyzsq"
    },
    {
      "file": "ab84996d-dcdc-429c-818e-a7640239c803/models/SomeText.glb",
      "hash": "bafkreihqhy2jk2l2w3gcmtnpzlbcrj6ngjonsv4hifhlsw5ulwcst66f4e"
    }
  ],
  "metadata": {
    "display": {
      "title": "We have moved!",
      "favicon": "favicon_asset",
      "navmapThumbnail": "scene-thumbnail.png"
    },
    "owner": "",
    "contact": {
      "name": "Blue",
      "email": ""
    },
    "main": "bin/game.js",
    "tags": [],
    "scene": {
      "parcels": [
        "-49,-100",
        "-49,-99",
        "-48,-100",
        "-48,-99",
        "-47,-100",
        "-47,-99"
      ],
      "base": "-49,-100"
    },
    "source": {
      "version": 1,
      "origin": "builder",
      "projectId": "116570f2-8bdc-4887-a0fd-11ed8d5c8f20",
      "point": {
        "x": -49,
        "y": -100
      },
      "rotation": "north",
      "layout": {
        "rows": 2,
        "cols": 3
      }
    }
  }
}
```
</details>

In the entity response, as defined in ADR-80, all the content files can be found in the `.content` section. All content files MUST be available for actively pointed entities.

```json
{
  "version": "v3",
  "type": "scene",
  "pointers": [ "-49,-100", "-49,-99", "-48,-100",
                "-48,-99", "-47,-100", "-47,-99" ],
  "timestamp": 1656605369643,
  "content": [
    {
      "file": "bin/game.js",
      "hash": "bafybeianxkwd7i4cgxdat7mu4nbxfyic6qtswxlq2ehk634xefsscxsuya"
    },
    ...
  ],
  ...
}
```

As an ilustrative example, to resolve the `bin/game.js` in the content server, the download URL would be `/content/contents/bafybeianxkwd7i4cgxdat7mu4nbxfyic6qtswxlq2ehk634xefsscxsuya`.
