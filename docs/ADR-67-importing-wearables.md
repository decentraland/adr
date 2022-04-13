# Importing wearables

## Context and Problem Statement

As of today, when creating a wearable through the Builder UI, users have the possibility of uploading a ZIP file containing the asset's models and configuration file called `asset.json`. This JSON file is used to define some of the properties that the imported wearable will have (name, description, etc) or what the wearable type will be (standard wearable, smart-wearable, etc).

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
4. The collection where the wearable is created into can't be specified.
5. The name of the file `asset.json` is confusing as assets already have a file with the same name on them.

These downsides make the current `asset.json` configuration file not suitable for importing wearables.

## Proposed solution

To solve the downsides described above, two changes are proposed:

1. The configuration file (former `asset.json`) should be named `wearable.json`.
2. A new format, with an upgraded schema.

The format proposed is the following:

```typescript
{
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    collectionId: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string" },
    urn: { type: "string" },
    rarity: { $ref: "#/$defs/rarity" },
    category: { $ref: "#/$defs/category" },
    hides: {
      type: "array",
      items: { $ref: "#/$defs/category" },
    },
    replaces: {
      type: "array",
      items: { $ref: "#/$defs/category" },
    },
    tags: { type: "array", items: { type: "string" } },
    representations: {
      type: "array",
      items: { $ref: "#/$defs/wearable-representation" },
    },
  },
  required: ["name", "rarity", "category", "representations"],
  additionalProperties: false,
  $defs: {
    rarity: {
      type: "string",
      enum: [
        "unique",
        "mythic",
        "legendary",
        "epic",
        "rare",
        "uncommon",
        "common",
      ],
    },
    category: {
      type: "string",
      enum: [
        "eyebrows",
        "eyes",
        "facial_hair",
        "hair",
        "head",
        "body_shape",
        "mouth",
        "upper_body",
        "lower_body",
        "feet",
        "earring",
        "eyewear",
        "hat",
        "helmet",
        "mask",
        "tiara",
        "top_head",
        "skin",
      ],
    },
    "wearable-representation": {
      type: "object",
      properties: {
        bodyShape: {
          type: "string",
          enum: ["both", "female", "male"],
        },
        mainFile: {
          type: "string",
          minLength: 1,
        },
        contents: {
          type: "array",
          items: {
            type: "string",
          },
          minItems: 1,
          uniqueItems: true,
        },
        overrideHides: {
          type: "array",
          items: { $ref: "#/$defs/category" },
        },
        overrideReplaces: {
          type: "array",
          items: { $ref: "#/$defs/category" },
        },
      },
      additionalProperties: false,
      required: [
        "bodyShapes",
        "mainFile",
        "contents",
        "overrideHides",
        "overrideReplaces",
      ],
    },
  },
}
```

Where, although defined here, category, rarity, wearable-representation and the body shapes are schemas borrowed from the current schemas defined in the `common-schema` [repository](https://github.com/decentraland/common-schemas).

The new schema solves the issues of the old one by:

1. Adding the `representations` property, where each representation can be detailed by specifying the `body shape` (`male`, `female` or `both` which will be used to build two representations), the `main file` (the file path of the main 3D asset that is used in the representation) and the `contents` (a list of file paths belonging to the content) of each representation.
2. Adding the `tags` property to be able to define tags for the wearable.
3. Defining the `hides`, `replace` properties for the whole wearable and along with the representations' data the `overrideHides` with `overrideReplaces` properties, solving the issue of customizing how the wearable and its representations hide or replace other wearables.
4. Adding the `collectionId` property to specify in which collection the wearable should be imported to.

Additionally, the new schema removes the `assetType` and `menuBarIcon` as the `assetType` is not required anymore because
of the file being named `wearable.json` for the only purpose of configuring a wearable and the `menuBarIcon` is moved
to another file for its configuration o the SDK side.

The following example shows how a wearable could be described using the new `wearable.json` format:

```json
{
  "id": "f12313b4-a76b-4c9e-a2a3-ab460f59bd67",
  "name": "test",
  "category": "eyebrows",
  "rarity": "common",
  "collectionId": "272233f5-e539-4202-b95c-aa68b0c8f190",
  "description": "a description",
  "hides": [],
  "replaces": [],
  "tags": ["special", "new", "eyebrows"],
  "representations": [
    {
      "bodyShape": "male",
      "mainFile": "aModelFile.glb",
      "contents": ["aModelFile.glb", "aTextureFile.png", "thumbnail.png"],
      "overrideHides": [],
      "overrideReplaces": []
    }
  ]
}
```

## Participants

- @lpetaccio
- @nicosantangelo