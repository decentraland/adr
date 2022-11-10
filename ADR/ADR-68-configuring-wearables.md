---
layout: doc
adr: 68
date: 2022-05-10
title: Configuring wearables
status: Living
authors:
  - lpetaccio
  - nicosantangelo
  - menduz
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

As of today, when creating a wearable through the Builder UI, users have the possibility of uploading a ZIP file containing the asset's models and configuration file called `asset.json`. This JSON file is used to define some of the properties that the imported wearable will have (name, description, etc) or what the wearable type will be (standard wearable, smart-wearable, etc).

The format has a series of downsides that will be discussed below, but there's also one important subject to address: the responsibilities of information in the `asset.json` file are mixed. The file contains information the wearable needs and information that the Builder needs to import the wearable into the platform. These two responsibilities MUST be split in order to eventually be able to define wearables in other resources.

The current `asset.json` file has the following format:

```json
{
  "id": "4c381333-767a-4036-9959-0fde335a4568",
  "assetType": "portable-experience",
  "name": "Portable Experience Example",
  "description": "My new Portable Experience",
  "category": "eyewear",
  "rarity": "mythic",
  "thumbnail": "glasses.png",
  "menuBarIcon": "glasses.png",
  "model": "glasses.glb",
  "bodyShape": "both"
}
```

These properties are used with the purpose described below:

- The `id` property is the ID that the will have or has (if it's being updated) in the builder-server.
- The `assetType` is used to identify the type of the asset, wether it's a wearable or a smart item.
- The `name` is the name of the wearable, as it's seen in the Marketplace.
- The `description` is the description of the wearable.
- The `category` is the category of the wearable (eyewear, hat, etc).
- The `rarity` is the rarity of the wearable (unique, common, etc).
- The `thumbnail` is the path to the thumbnail of the wearable.
- The `menuBarIcon` is the path to the image to use on the “experiences” menu, to represent this portable experience.
- The `model` is the path to the model of the wearable. This implies that the wearable can have only one model for all representations.
- The `bodyShape` is the body shape of the wearable. This can only have one value, either `male`, `female` or `both`, implying

The current format has some downsides that we need to tackle:

1. It doesn't have the possibility to define representations with different 3D models, that is, a female and a male representation, each one with its 3D model shaped to their body shape.
2. Wearable tags can't be defined.
3. It's not possible to define which categories get to be hidden or replaced by the wearable and, as it doesn't allow each representation to be detailed, it doesn't allow overriding hides and replaces for each of representation.
4. The name of the file `asset.json` is confusing as assets already have a file with the same name on them.
5. The `id` property is used to identify the item in the builder-server, this doesn't describe the wearable.

These downsides make the current `asset.json` configuration file not suitable for describing wearables.

## Proposed solution

To solve the downsides described above, and to provide a configuration file that only describes wearables two changes are proposed:

1. The configuration file (former `asset.json`) should be named `wearable.json`.
2. A new format is defined for the `wearable.json` that describes everything about a wearable. This format is taken from the wearable's entity metadata.
3. All the information about the Builder and the platform is defined in another file in the [ADR-69](/adr/ADR-69).

Although the format for the `wearable.json` is exactly the same as the wearables entity metadata, this ADR presents it to show how it solves the problem:

```typescript
type Wearable = {
  /** The URN of the wearable */
  id: string
  /** Name of the wearable */
  name: string
  /** Description of the wearable */
  description?: string
  data: {
    /** Wearables to replace when equipping the wearable */
    replaces: WearableCategory[]
    /** Wearables to hide when equipping the wearable */
    hides: WearableCategory[]
    /** Tags to identify the wearable */
    tags: string[]
    /** Representations of the wearable */
    representations: WearableRepresentation[]
    /** Category of the wearable */
    category: WearableCategory
  }
  /** Wearable's translated resources */
  i18n: I18N[]
  /** Thumbnail's path */
  thumbnail: string
  /** Image's path */
  image: string
  /** Rarity of the wearable */
  rarity?: Rarity
  /** Collection address of the standard wearable */
  collectionAddress?: string
  /** Contents map (file name -> hash) described in the ADR 62 for the third party items */
  content?: Record<string, string>
  /** Merkle proof, described in the ADR 62 for the third party items */
  merkleProof?: MerkleProof
}

type WearableRepresentation = {
  /** Body shape of the representation */
  bodyShapes: BodyShape[];
  /** File path to the main file of the representation (GLB, GLTF, etc) */
  mainFile: string;
  /** A list of the file paths of the files that belong to the representation */
  contents: string[];
  /** Wearables to hide when equipping this representation */
  overrideHides: WearableCategory[];
  /** Wearables to replace when equipping this representation */
  overrideReplaces: WearableCategory[];
}

type I18N = {
  code: Locale
  text: string
}

enum Locale {
    EN = "en",
    ES = "es"
}

enum Rarity = {
  UNIQUE = 'unique',
  MYTHIC = 'mythic',
  LEGENDARY = 'legendary',
  EPIC = 'epic',
  RARE = 'rare',
  UNCOMMON = 'uncommon',
  COMMON = 'common'
}

enum WearableCategory = {
  EYEBROWS = 'eyebrows',
  EYES = 'eyes',
  FACIAL_HAIR = 'facial_hair',
  HAIR = 'hair',
  HEAD = 'head',
  BODY_SHAPE = 'body_shape',
  MOUTH = 'mouth',
  UPPER_BODY = 'upper_body',
  LOWER_BODY = 'lower_body',
  FEET = 'feet',
  EARRING = 'earring',
  EYEWEAR = 'eyewear',
  HAT = 'hat',
  HELMET = 'helmet',
  MASK = 'mask',
  TIARA = 'tiara',
  TOP_HEAD = 'top_head',
  SKIN = 'skin'
}

enum WearableBodyShape {
  MALE = 'urn:decentraland:off-chain:base-avatars:BaseMale',
  FEMALE = 'urn:decentraland:off-chain:base-avatars:BaseFemale'
}
```

Where, although defined here, I18N, Locale, category, rarity, wearable representation and the body shapes are types borrowed from the current schemas defined in the `common-schema` [repository](https://github.com/decentraland/common-schemas).

Using the wearable metadata solves the problems of the old schema by:

1. Having the `representations` property, where each representation can be detailed by specifying the `body shape` (`urn:decentraland:off-chain:base-avatars:BaseMale` or `urn:decentraland:off-chain:base-avatars:BaseFemale`), the `main file` (the file path of the main 3D asset that is used in the representation) and the `contents` (a list of file paths belonging to the content) of each representation.
2. Having the `tags` property to be able to define tags for the wearable.
3. Defining the `hides`, `replace` properties for the whole wearable and along with the representations' data the `overrideHides` with `overrideReplaces` properties, solving the issue of customizing how the wearable and its representations hide or replace other wearables.
4. Removing the `assetType` and `menuBarIcon` as they don't define the wearable, they're properties that are used in the SDK side and will be moved to another file for its configuration on the SDK side.
5. Changing the `id` property to decouple the format to describe the wearable from the information that the Builder needs. The `id` is now the URN of the wearable.

The following example shows how a standard wearable could be described using the `wearable.json` format:

```json
{
  "id": "urn:decentraland:matic:collections-v2:0x588dab7702ae280e7c8967de8999eb635e4b5c2e:0",
  "name": "test",
  "rarity": "common",
  "description": "a description",
  "data": {
    "replaces": [],
    "hides": [],
    "tags": ["special", "new", "eyebrows"],
    "representations": [
      {
        "bodyShapes": ["urn:decentraland:off-chain:base-avatars:BaseMale"],
        "mainFile": "aModelFile.glb",
        "contents": ["aModelFile.glb", "aTextureFile.png", "thumbnail.png"],
        "overrideHides": [],
        "overrideReplaces": []
      }
    ],
    "category": "eyebrows"
  },
  "i18n": [{ "code": "en", "text": "test" }],
  "thumbnail": "thumbnail.png",
  "image": "image.png",
  "collectionAddress": "0x588dab7702ae280e7c8967de8999eb635e4b5c2e"
}
```

An example on how a third party or linked wearable is defined using the `wearable.json` format can be found in the [ADR-62](/adr/ADR-62).
