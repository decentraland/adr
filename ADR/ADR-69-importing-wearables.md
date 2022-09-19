---
layout: doc
adr: 69
date: 2022-05-10
title: Importing wearables
status: ACCEPTED
authors:
  - lpetaccio
  - menduz
---

## Context and Problem Statement

In order to import an item into the Decentraland platform, more specifically, into the Builder, the user needs to upload a ZIP file containing its configuration in a file called `asset.json`. This JSON file has information with mixed responsibility. The [ADR-68](/adr/ADR-69) sets up a new format to describe the properties that describe a wearable but, to be able to import it into the Builder, it needs specific information about the item in the platform. Besides the problem of the information having mixed responsibilities, the current `asset.json` format doesn't fullfil the requirements that the platform currently has, specially because there's no way to set a `collection` or a `URN` for the wearable on its own.

The [ADR-68](/adr/ADR-69) also provides a strict schema, based on the wearables entities metadata, but the Builder platform doesn't require all of that information to import an item as it can auto-generate it to make the user experience better.

## Proposed solution

To import items into the platform, a ZIP file with the following files will be required:

- An optional builder configuration file, to set information that can be required or wanted for the Builder platform.
- A wearable configuration file, to specify every detail about the wearable that it's going to be imported.
- The model files, that is, the GLBs, GLTFs, and texture files that the wearable has.

### Builder configuration file

To be able to provide a configuration file for our platform that doesn't mix the information between the wearable itself and what the platform needs, a new file, called `builder.json` can be included alongside the other files.

In this first version of the file, the following information can be included:

```typescript
type BuilderWearableConfig = {
  /** UUID of the item in the builder server */
  id?: string
  /** UUID of the collection of the wearable in the builder server */
  collectionId?: string
}
```

Where the `id` will be used to identify which item to update or which UUID to use when creating a new item, the `collectionId` will be used to identify the collection where the item will be created.

The following is an example of the `builder.json` file:

```json
{
  "id": "f12313b4-a76b-4c9e-a2a3-ab460f59bd67",
  "collectionId": "272233f5-e539-4202-b95c-aa68b0c8f190"
}
```

This file describes that the data about to import of a wearable will be of an item with id `f12313b4-a76b-4c9e-a2a3-ab460f59bd67` and will belong to a collection with id `272233f5-e539-4202-b95c-aa68b0c8f190`.

### Wearable configuration file

The [ADR-68](/adr/ADR-69) describes how wearables can be configured, but, to simplify the user's experience, the following properties are slightly modified:

- The `collectionAddress`, `content`, `merkleProof`, `thumbnail`, `image` and `i18n` although required for the different type of wearables available, when importing the wearable they must be omitted as they're going to be auto-generated eventually in the platform.
- The `id` property becomes **optional for the third party or linked wearable items** and **it is ignored or shouldn't be included for the standard items**. The id will be used to set the URN of third party or linked wearable items or to identify an item to be updated by its URN.

The simplified wearable configuration file looks like this:

```typescript
type WearableConfiguration = {
  /** The URN of the wearable */
  id?: string
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
  /** Rarity of the wearable () */
  rarity?: Rarity
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

Where, although defined here, category, rarity, wearable representation and the body shapes are types borrowed from the current schemas defined in the `common-schema` [repository](https://github.com/decentraland/common-schemas).

The following is an example on how the `wearable.json` file for a standard wearable looks like:

```json
{
  "name": "Special hat",
  "category": "hat",
  "rarity": "common",
  "description": "A description of the wearable",
  "hides": ["hair"],
  "replaces": [],
  "tags": ["special", "new", "hat"],
  "representations": [
    {
      "bodyShapes": ["urn:decentraland:off-chain:base-avatars:BaseMale"],
      "mainFile": "aMaleModelFile.glb",
      "contents": ["aMaleModelFile.glb", "aTextureFile.png", "thumbnail.png"],
      "overrideHides": [],
      "overrideReplaces": []
    },
    {
      "bodyShapes": ["urn:decentraland:off-chain:base-avatars:BaseFemale"],
      "mainFile": "aFemaleModelFile.glb",
      "contents": ["aFemaleModelFile.glb", "anotherTextureFile.png", "thumbnail.png"],
      "overrideHides": [],
      "overrideReplaces": []
    }
  ]
}
```

And this is an example on how a `wearable.json` file looks like for a third party or linked wearable:

```json
{
  "id": "urn:decentraland:mumbai:collections-thirdparty:third-party-id:collection-id:0",
  "name": "Special hat",
  "category": "hat",
  "description": "A description of the wearable",
  "hides": ["hair"],
  "replaces": [],
  "tags": ["special", "new", "hat"],
  "representations": [
    {
      "bodyShapes": ["urn:decentraland:off-chain:base-avatars:BaseMale"],
      "mainFile": "aMaleModelFile.glb",
      "contents": ["aMaleModelFile.glb", "aTextureFile.png", "thumbnail.png"],
      "overrideHides": [],
      "overrideReplaces": []
    },
    {
      "bodyShapes": ["urn:decentraland:off-chain:base-avatars:BaseFemale"],
      "mainFile": "aFemaleModelFile.glb",
      "contents": ["aFemaleModelFile.glb", "anotherTextureFile.png", "thumbnail.png"],
      "overrideHides": [],
      "overrideReplaces": []
    }
  ]
}
```

### The model files

These files are what are used by the platform to render the wearable in word and in any of our services (builder, marketplace, etc).

Each representation, as defined in the `Builder configuration file` section, defines which are the files that will be used for each of the body shapes. The included files must match with the ones that are described in the `contents` property of the `WearableRepresentation` object. These files are GLBs, GLFTs, png, jpg or other supported file that can be loaded by the platform and, alongside them, a custom `thumbnail` image can be provided. This thumbnail image is **optional** and will be used to represent the wearable in the different services the platform has. Thumbnails must be PNGs with a 512 by 512px size and must have a transparent background.

## Summary

Importing wearables in the Builder platform can be done by uploading a ZIP file with the following files:

- An optional `builder.json` file if there's the need to identify an item in the platform to be updated or to create a new one (not required as it is usually auto generated).
- A `wearable.json` file with the information about the wearable.
- The GLB, GLTFs or other files that define the wearable's models.
