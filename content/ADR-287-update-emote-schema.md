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

We are implementing a new feature named **Social Emotes**, which will allow multiple players to interact with this new kind of emotes.

These new emotes will have a new property named `outcomes`, where the author can define the animation to be executed and whether it loops or not.

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

To standardize clips exported in GLBs, we adopt: `Action_(Start | Avatar)`

Examples:

- `HighFive_Start`
- `HighFive_Avatar`
- `HighFive_AvatarOther`

**Rationale**

- Self-describing names improve readability, maintenance, and debugging.
- Decouples DCC tooling (e.g., Blender NLA tracks) from runtime configuration.
- Builder can enforce/validate this pattern on import and provide dropdowns filtered by action/step.

## Specification

### Versioned schema (off-chain)

```ts
export type ArmatureId = 'Avatar' | 'Avatar_Other' | string

export type EmoteClip = {
  armature: ArmatureId
  animation: string // GLB clip name (e.g., "HighFive_Avatar")
  loop: boolean
  randomize: boolean
}

export type OutcomeGroup = EmoteClip[]

export type EmoteDataADR287 = {
  category: EmoteCategory
  representations: EmoteRepresentationADR74[]
  tags: string[]
  loop: boolean
  startAnimation?: Omit<EmoteClip, 'randomize'>[]
  outcomes: OutcomeGroup[]
}
```

- Reuses ADR-74 `EmoteCategory` and `EmoteRepresentationADR74` to avoid churn.
- Keeps top-level `loop` for compatibility, but **emote SHOULD prefer the selected outcome’s `loop`** if present.

Example (two-armature outcomes):

```ts
startAnimation: [
  {
    armature: "Avatar",
    animation: "HighFive_Start",
    loop: true
  },
],
outcomes: [
  [
    {
      armature: "Avatar",
      animation: "HighFive_Avatar",
      loop: false,
      randomize: false
    },
    {
      armature: "Avatar_Other",
      animation: "HighFive_AvatarOther",
      loop: false,
      randomize: false
    }
  ],
]
```

### Outcome semantics

- **so**: `outcomes.length === 1` always that outcome.
- **mo**: `outcomes.length > 1` **and** no `randomize: true` deterministic selection policy (implementation-defined).
- **ro**: any outcome with `randomize: true` choose randomly among those with `randomize: true`; if none marked, fall back to **mo**.

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
- Else if `outcomes.some(o => o.randomize)`: `ro`
- Else: `mo`
- If `outcomes` is empty (legacy), treat as `so` using the default animation.

### Type unions

```ts
export type Emote = EmoteADR74 | EmoteADR287

export type EmoteADR287 = BaseItem & (StandardProps | ThirdPartyProps) & { emoteDataADR287: EmoteDataADR287 }
```

(Union pattern follows ADR-74’s versioned types approach.)

### Validation

- Each outcome's `animation` MUST be a non-empty string.
- Each outcome's `loop` and `randomize` MUST be booleans.
- The on-chain `outcomeType` MUST be consistent with the off-chain `outcomes[]` derivation.
- `additionalProperties` continues to accept `s | g | sg` (sound/geometry) as per ADR-74.
- Older clients that parse up to `additionalProperties` MUST continue to function.

### Examples

**Random outcomes (off-chain)**

```ts
outcomes: [
  [
    {
      armature: 'Avatar',
      animation: 'HugShort_Avatar',
      loop: false,
      randomize: true,
    },
    {
      armature: 'Avatar_Other',
      animation: 'HugShort_AvatarOther',
      loop: false,
      randomize: true,
    },
  ],
  [
    {
      armature: 'Avatar',
      animation: 'HugLong_Avatar',
      loop: false,
      randomize: true,
    },
    {
      armature: 'Avatar_Other',
      animation: 'HugLong_AvatarOther',
      loop: false,
      randomize: true,
    },
  ],
]
// outcomeType => "ro"
```

**Resulting on-chain metadata (example)**

```
${version}:${type}:${name}:${description}:${category}:${bodyShapeTypes}:${loop}:${additionalProperties}:ro
```

> Note: The actual list of `outcomes[]` is **not** encoded on-chain.

#### References

- [ADR-74: Add emote schema and versioning](https://adr.decentraland.org/adr/ADR-74)
