---
layout: doc
adr: 74
date: 2022-06-09
title: Add Emote schema and versioning
status: ACCEPTED
authors:
- pedrotambo
- marianogoldman
- agusaldasoro
---

## Context and Problem Statement

Currently, `Emotes` are being deployed as `Wearables` in the Catalysts. Even though they are very similar, they are not. For instance, there are emotes deployed with the arbitrary category "hat" just to pass the validations.
Secondly, emotes metadata structure is likely to change so versioning of this changes are needed. This way, its changes can be tracked over time and validations can be done according to its corresponding timestamp. For instance, when starting a new Catalyst from scratch, entities from different timestamps will be received and will need to validate them with the validations that **_where present at that timestamp_**.

## Proposed solution

Add Emotes schema as similar as possible to the current schema but flexible enough to add versioning.

Let's see first the current schema of a Wearable (also used for Emotes):

```typescript
export type Wearable = {
  id: string;
  name: string;
  description: string;
  i18n: I18N[];
  thumbnail: string;
  image: string;
  metrics?: Metrics;
  content?: Record<string, string>;
  collectionAddress: string;
  rarity: Rarity;
  merkleProof: MerkleProof;
  data: {
    replaces: WearableCategory[];
    hides: WearableCategory[];
    tags: string[];
    representations: WearableRepresentation[];
    category: WearableCategory;
  };
};
```

### Changes involved

##### 1. Share common properties

Share some common properties between Wearables/Emotes that are not expected to change in the feature, so there will be no versioning for them (at least in the way described later). Move `content?: Record<string, string>` to `ThirdPartyProps` as they're only used in that case. Compared to the current schema, all properties are present except the `data` property (that will go in the versioned part) and `content` (that is removed):

```typescript
export type BaseItem = DisplayableDeployment & {
  id: string;
  name: string;
  description: string;
  i18n: I18N[];
  thumbnail: string;
  image: string;
  metrics?: Metrics;
};
```

##### 2. Add Emote versioned data

```typescript
export type StandardProps = {
  collectionAddress: string;
  rarity: Rarity;
};
export type ThirdPartyProps = {
  merkleProof: MerkleProof;
  content: Record<string, string>;
};
export type EmoteDataADR74 = {
  category: EmoteCategory;
  representations: EmoteRepresentationADR74[];
  tags: string[];
};

export type EmoteADR74 = BaseItem &
  (StandardProps | ThirdPartyProps) & { emoteDataADR74: EmoteDataADR74 };

// hypothetical future ADR 102
export type EmoteADR102 = BaseItem & { emoteDataADR102: EmoteDataADR102 };
export type Emote = EmoteADR74 | EmoteADR102;
```

##### 3. Create new EmoteCategory and EmoteRepresentation types specific for Emotes.

Although they're pretty similar, they are different to the ones for Wearables and may diverge more in the future. They will also be included in the versioned properties.
One caveat, _EmoteCategory_ is imported from _src/dapps_ but it's not versioned as there only matters the latest version in that context. For that, this proposal suggests changing the dependency to the other way, the latest version is imported in _src/dapps from src/platform/_.
If a new category is added, it will be added to _EmoteCategory_ and a new type called _EmoteCategoryADR74_ will be created to validate emotes before this new change.

```typescript
// <src/platform/…>
export type EmoteRepresentationADR74 = {
 bodyShapes: BodyShape[]
 mainFile: string
 contents: string[]
}

export enum EmoteCategory {
 SIMPLE = 'simple',
 LOOP = 'loop'
}
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// <src/dapps/…>
import { EmoteCategory } from '.../src/platform/...'
```

##### 4. Stop exporting qualitative types.

(Breaking change) Stop exporting the ThirdPartyWearable, StandardWearable and don't export the analogues for Emote. Instead, the exported types will be Wearable, Emote, StandardProps, ThirdPartyProps and the functions isStandard, isThirdParty. This way, the explosion of the combination of those types (and future properties added) will be prevented:

```typescript
export function isStandard(item: Item): item is Item & StandardProps {. . .}
export function isThirdParty(item: Item): item is Item & ThirdPartyProps {. . .}
// Instead of
export type ThirdPartyEmote
export type StandardEmote
export type ThirdPartyWearable
export type StandardWearable
// Now imaging that we add a new set of properties, let's call it t'Magical' that is combinable with the others:
export type ThirdPartyEmote
export type StandardEmote
export type ThirdPartyWearable
export type StandardWearable
export type MagicalThirdPartyEmote
export type MagicalStandardEmote
export type MagicalThirdPartyWearable
export type MagicalStandardWearable
// and so on ...
```

##### 5. Extend Collection contract metadata to store the `loop` value
Since the ADR74 Emotes will have proper categories now, we need to start saving the `loop` value in another field, as it used to be stored as the category in the contract metadata. It will be stored at the end of the current metadata string as `0` (`false`) or `1` (`true`). It's added at the end to avoid introducing breaking changes.
In summary, for emotes, the metadata stored in the contract will now be:
`${version}:${type}:${name}:${description}:${category}:${bodyShapeTypes}:${loop}`

## Benefit

The bigger benefit is that the validation of schemas over the time becomes somehow trivial\*:

```typescript
function validate(emote) {
   adrXX = identifyADR(emote.timestamp)
   if (emote does not have the field 'emoteData' + ardXX) return false
   Emote.schema.validate(emote)
}
```

\*under the assumption that the common properties do not change.
This would give the possibility to iterate schema changes quicker and also easily identify the versions over the time along with its reasons explained in the specific ADR.

### Date: 2022-09-12T13:00:00Z (timestamp 1669852800000)
