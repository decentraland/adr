# Configuring wearables

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
2. A new format is defined for the `wearable.json` that describes everything about a wearable.
3. All the information about the Builder and the platform is defined in another file in the [ADR-68](docs/ADR-68-importing-wearables.md).

The format proposed is the following:

```typescript
type WearableAsset = {
  /** Name of the wearable */
  name: string;
  /** Description of the wearable */
  description?: string;
  /** Rarity of the wearable */
  rarity?: Rarity;
  /** Category of the wearable */
  category: WearableCategory;
  /** Wearables to hide when equipping the wearable */
  hides: WearableCategory[];
  /** Wearables to replace when equipping the wearable */
  replaces: WearableCategory[];
  /** Tags to identify the wearable */
  tags: string[];
  /** Representations of the wearable */
  representations: WearableRepresentation[];
}

type WearableRepresentation = {
  /** Body shape of the representation */
  bodyShape: BodyShape;
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

enum BodyShape = {
  MALE = 'male';
  FEMALE = 'female';
  BOTH = 'both';
}
```

Where, although defined here, category, rarity, wearable-representation and the body shapes are types borrowed from the current schemas defined in the `common-schema` [repository](https://github.com/decentraland/common-schemas).

The new schema solves the issues of the old one by:

1. Adding the `representations` property, where each representation can be detailed by specifying the `body shape` (`male`, `female` or `both` which will be used to build two representations), the `main file` (the file path of the main 3D asset that is used in the representation) and the `contents` (a list of file paths belonging to the content) of each representation.
2. Adding the `tags` property to be able to define tags for the wearable.
3. Defining the `hides`, `replace` properties for the whole wearable and along with the representations' data the `overrideHides` with `overrideReplaces` properties, solving the issue of customizing how the wearable and its representations hide or replace other wearables.
4. Removing the `assetType` and `menuBarIcon` as they don't define the wearable, they're properties that are used in the SDK side and will be moved to another file for its configuration on the SDK side.
5. Removes the `id` property to decouple the format to describe the wearable from the information that the Builder needs.

Alongside this changes,

The following example shows how a wearable could be described using the new `wearable.json` format:

```json
{
  "name": "test",
  "category": "eyebrows",
  "rarity": "common",
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
- @menduz
