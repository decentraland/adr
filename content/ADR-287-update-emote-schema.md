---
adr: 287
date: 2025-09-01
title: Update Emote schema with outcomes (Social Emotes)
authors:
  - cyaiox
status: Draft
type: Standards Track
spdx-license: CC0-1.0
---

## Abstract

We are implementing a new feature named **Social Emotes**, which will allow multiple players to interact with this new kind of emote.

These new emotes will have a new property named `outcomes`, which lets authors define the animation to execute and specify whether it loops or not.

## Context, Reach & Prioritization

- **Why this matters**: ADR-74 introduced emote versioning and extended the on-chain metadata with `loop` and `additionalProperties` (sound/geometry) while keeping richer data off-chain. Social Emotes require multiple animation outcomes for better player interaction, but we want to avoid bloating the on-chain metadata.
- **Decision scope**: Authoring tools, validators, and runtimes that read emote JSON; Collection contract metadata parsers.
- **Urgency**: Needed for the Social Emotes feature rollout while keeping backward compatibility with ADR-74 parsers.
- **Terms**:
  - **Simple outcome (so)**: single deterministic outcome.
  - **Multiple outcome (mo)**: several deterministic options.
  - **Random outcome (ro)**: randomly chosen among candidates.

## Solution Space Exploration

- **All outcomes on-chain** — Rejected. Bloats the metadata string, increases parsing complexity, and is brittle.
- **Only a discriminator on-chain (chosen)** — Minimal, backward compatible; rich data stays off-chain in JSON; aligns with ADR-74’s approach of small, append-only metadata changes.
- **No on-chain hint** — Rejected. Runtimes benefit from a cheap, parse-time discriminator to quickly branch behavior.

## GLB Authoring: Naming Convention

To ensure consistency across exported GLB clips, we suggest the use of the following pattern: `<Action>_(Start | Start_Prop | Avatar | Prop | AvatarOther)`

### Rules

- **Action**: Should be written in PascalCase (e.g., `HighFive`, `WaveHello`).
- **Multiple words**: Combine into PascalCase (no spaces or underscores).
- **Suffix**: Always appended with an underscore `_`, followed by one of the predefined roles (`Start`, `Start_Prop`, `Avatar`, `Prop`, `AvatarOther`).
- **Compound suffixes**: Use underscores between suffix parts (e.g., `Start_Prop`, `AvatarOther`).

Examples:

- `HighFive_Start`
- `HighFive_Start_Prop`
- `HighFive_Avatar`
- `HighFive_Prop`
- `HighFive_AvatarOther`

**Rationale**

- Improves readability, maintenance, and debugging through self-describing names.
- Decouples DCC tooling (e.g., Blender NLA tracks) from runtime configuration.
- Enables Builder to validate naming patterns on import and provide filtered dropdowns by action/step.

## Specification

### Versioned schema (off-chain)

```ts
export type ArmatureId = 'Armature' | 'Armature_Prop' | 'Armature_Other'

export type EmoteClip = {
  animation: string // GLB clip name "HighFive_Avatar" (suggested, not enforced)
  loop: boolean
}

export type StartAnimation = {
  Armature: EmoteClip
  Armature_Prop?: EmoteClip
}

export type OutcomeGroup = {
  title: string
  // Any subset of armatures; validated at runtime to ensure at least one
  clips: Partial<Record<ArmatureId, EmoteClip>>
}

export type EmoteDataADR287 = {
  category: EmoteCategory
  representations: EmoteRepresentationADR74[]
  tags: string[]
  loop: boolean
  startAnimation: StartAnimation
  randomizeOutcomes: boolean
  outcomes: OutcomeGroup[]
}
```

- Reuses ADR-74 `EmoteCategory` and `EmoteRepresentationADR74` to avoid churn.
- Keeps top-level `loop` for compatibility, but **emote SHOULD prefer the selected outcome’s `loop`** if present.

Example (two-armature outcomes):

```ts
const emoteWithADR287Data = {
  // ...,
  emoteDataADR287: {
    // ...,
    startAnimation: {
      Armature: {
        animation: 'HighFive_Start',
        loop: true,
      },
    },
    randomizeOutcomes: false,
    outcomes: [
      {
        title: 'High Five',
        clips: {
          Armature: {
            animation: 'HighFive_Avatar',
            loop: false,
          },
          Armature_Other: {
            animation: 'HighFive_AvatarOther',
            loop: false,
          },
        },
      },
    ],
  },
}
```

### Outcome semantics

- **so**: `outcomes.length === 1` always that outcome.
- **mo**: `outcomes.length > 1` **and** no `randomizeOutcomes: true` deterministic selection policy (implementation-defined).
- **ro**: `outcomes.length > 1` **and** `randomizeOutcomes: true` choose randomly among all outcomes.

### Contract metadata (on-chain)

ADR-74 extended the metadata to include `loop` and then `additionalProperties` (sound/geometry) by appending fields on the right to avoid breaking older parsers. We follow the same pattern:

- **ADR-74 (current)**

  ```
  ${version}:${type}:${name}:${description}:${category}:${bodyShapeTypes}:${loop}:${additionalProperties}
  ```

- **ADR-287 (append-only)**

  ```
  ${version}:${type}:${name}:${description}:${category}:${bodyShapeTypes}:${loop}:${additionalProperties}:${outcomeType}
  ```

Where:

- `outcomeType ∈ { so | mo | ro }`
- **Only `outcomeType` is stored on-chain.** The full `outcomes[]` list remains **off-chain** in the emote JSON.

### Deriving `outcomeType` from the schema

- If `outcomes.length === 1`: `so`
- Else if `outcomes.length > 1 && randomizeOutcomes === true`: `ro`
- Else: `mo`
- If `outcomes` is empty (legacy), treat as `so` using the default animation.

### Type unions

```ts
export type Emote = EmoteADR74 | EmoteADR287

export type EmoteADR287 = BaseItem & (StandardProps | ThirdPartyProps) & { emoteDataADR287: EmoteDataADR287 }
```

(Union pattern follows ADR-74’s versioned types approach.)

### Validation

- Each outcome's `armature` MUST be a non-empty string.
- Within a given outcome, each `armature` MUST be unique across all clips (no duplicates).
- Each outcome's `animation` MUST be a non-empty string.
- Each outcome's `loop` MUST be a boolean.
- An emote MUST define at most **3 outcomes** (hard limit to ensure manageable complexity).
- The on-chain `outcomeType` MUST be consistent with the off-chain `outcomes[]` derivation.
- `additionalProperties` continues to accept `s | g | sg` (sound/geometry) as per ADR-74.
- Older clients that parse up to `additionalProperties` MUST continue to function.

### Examples

**Random outcomes (off-chain)**

```ts
const emoteWithADR287Data = {
  // ...,
  emoteDataADR287: {
    // ...,
    startAnimation: {
      Armature: {
        animation: 'Hug_Start',
        loop: true,
      },
    },
    randomizeOutcomes: true,
    outcomes: [
      {
        title: 'Hug Short',
        clips: {
          Armature: {
            animation: 'HugShort_Avatar',
            loop: false,
          },
          Armature_Other: {
            animation: 'HugShort_AvatarOther',
            loop: false,
          },
        },
      },
      {
        title: 'Hug Long',
        clips: {
          Armature: {
            animation: 'HugLong_Avatar',
            loop: false,
          },
          Armature_Other: {
            animation: 'HugLong_AvatarOther',
            loop: false,
          },
        },
      },
    ],
  },
}
// outcomeType => "ro"
```

**Resulting on-chain metadata (example)**

```
${version}:${type}:${name}:${description}:${category}:${bodyShapeTypes}:${loop}:${additionalProperties}:ro
```

> Note: The actual list of `outcomes[]` is **not** encoded on-chain.

#### References

- [ADR-74: Add emote schema and versioning](https://adr.decentraland.org/adr/ADR-74)
