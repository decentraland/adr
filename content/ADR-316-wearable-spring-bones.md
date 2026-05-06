---
layout: adr
adr: 316
title: Wearable Spring Bones
date: 2026-03-13
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - rociocm
---

## Abstract

This ADR defines the standard for adding spring bone physics to Decentraland wearables. Spring bones are extra bones — not part of the base avatar armature — whose transforms are driven by a physics simulation rather than animation clips, enabling hair, earrings, capes, belts, and similar wearable elements to move dynamically in response to avatar locomotion and gravity. Parameters are stored in the wearable item's metadata at `wearable.data.springBones`, keyed by GLB content hash; the `.glb` file itself carries only the bone names and hierarchy. A spring root bone is identified by a node name containing `springbone` (case-insensitive) combined with an `isRoot: true` entry for that node in the metadata. All descendant bones of a root automatically form its spring chain. The parameter set mirrors the VRM `VRMC_springBone` convention. Colliders are out of scope for this version.

## Context, Reach & Prioritization

Currently all wearable elements that extend beyond the base avatar armature — hair, earrings, ponytails, capes, belts, and similar accessories — are completely static. They do not react to the avatar's movement, animations, or environmental forces such as gravity. This is a significant visual quality gap compared to industry-standard avatar formats such as VRM and MMD, which have supported spring/physics bones for years.

Decentraland avatars use a custom armature in `gltf` format (see [ADR-57](/adr/ADR-57)). Each wearable carries only the bones it needs and is fully autonomous. This architecture is compatible with adding optional spring bone definitions without affecting wearables that do not use them.

The implementation will use the UniVRM `VRMSpringBone` component in the Unity-based Explorer. The parameter set defined here is chosen to be directly compatible with that component's expectations, avoiding any translation layer between stored data and the simulation runtime.

This standard affects every system that renders avatars: the Explorer (local and remote players), the Builder wearable editor, the Marketplace avatar preview, and the login/backpack screen. A shared spec is required for all of these to interoperate correctly.

**Vocabulary:**

- **Spring bone / jiggle bone / physics bone:** A bone not part of the base armature whose transform is driven by physics simulation.
- **Spring root bone:** A node that owns a spring configuration. Identified by a node name containing `springbone` (case-insensitive, anywhere in the name) combined with an `isRoot: true` entry for that node in the wearable's `data.springBones` metadata.
- **Spring chain:** The spring root bone and all its glTF node descendants, simulated together.
- **Chain tip:** The deepest descendant in a spring chain. Acts as the geometric endpoint; its parameters are not used by the simulation.
- **`center`:** An optional reference node name. When specified, inertia is calculated relative to that node's space rather than world space, preventing excessive sway during locomotion.

## Solution Space Exploration

Multiple approaches were considered for where to store spring bone parameters.

### Option A: Root-level `extras`

Data lives in the root glTF object's `extras` field under a `DCL_springBones` key, with an explicit `springs` array listing chains and joints by node index. This mirrors how VRM's extension is structured.

**Not chosen** because it does not allow creators to set parameters directly in Blender using bone Custom Properties, and shares the issues of any in-GLB storage approach described in Option C.

### Option B: Node-level `extras`

Physics parameters live directly in each spring root bone's glTF node `extras` field. Chains are inferred at load time from the node hierarchy.

**Not chosen.** Native to standard glTF and allows node-level configuration, but using `extras` for structured data is less formal than a vendor extension. Shares the issues of any in-GLB storage approach described in Option C.

### Option C: Node-level Vendor Extension `DCL_spring_bone_joint`

Physics parameters live in a formal glTF vendor extension (`DCL_spring_bone_joint`) within each spring root bone's `extensions` field. Chains are inferred at load time from the node hierarchy. The extension is declared in the root `extensionsUsed` array.

**Not chosen.** This was the original choice, reversed during implementation. It offers clear intent and a Blender-native authoring path, but binds parameter tuning to GLB modification, which produces volatile content hashes on every parameter tweak and AB converter overload, because every parameter save re-enters the asset-bundle conversion queue even when the underlying model geometry is unchanged.

These effects are observed in practice and cannot be engineered away without separating parameters from the binary asset, which is what Option D does.

### Option D: Parameters in Item Metadata — **CHOSEN**

Spring bone parameters live on the wearable item's metadata at `wearable.data.springBones`. The `.glb` carries only the bone _names_ (with the `springbone` token) and the _hierarchy_. Parameters are stored as JSON, validated by `@dcl/schemas`' `SpringBonesData` schema, and read by the Explorer at avatar load time.

```json
{
  "version": 1,
  "models": {
    "<glbContentHash>": {
      "SpringBone_hair_left": {
        "stiffness": 2.0,
        "gravityPower": 0.8,
        "gravityDir": [0, -1, 0],
        "drag": 0.3,
        "center": "Avatar_Hips",
        "isRoot": true
      }
    }
  }
}
```

This approach provides:

- **No GLB churn.** Parameter edits never touch the `.glb`. The model's content hash and uploaded bytes are stable across tuning sessions.
- **No AB converter pressure.** Saves that only change spring bone parameters do not produce a new `.glb` and therefore do not trigger asset-bundle conversion.
- **Single authoring surface.** All parameter editing happens in the Builder UI with live preview. There is no second pipeline (Blender plugin, DCC export) to maintain or keep in sync.

The trade-off is that creators cannot author spring bone parameters in Blender or any external DCC tool. This is accepted: bone _discovery_ still happens through the GLB (the `springbone` naming convention is required upstream), but parameter _tuning_ is Builder-only.

## Specification

### Node Naming Convention

All spring bone nodes MUST have a name containing the substring `springbone` (case-insensitive). The substring can appear at any position in the name. The naming convention is the only signal that travels in the `.glb`; physics parameters travel separately in item metadata.

Examples:

| Node name | Valid? | Meaning |
| --- | --- | --- |
| `SpringBone_hair_left` | ✓ | Left hair chain root |
| `hair_springbone_l` | ✓ | Left hair chain root (variant) |
| `springbone_earring_r` | ✓ | Right earring chain root |
| `ponytail_SPRINGBONE` | ✓ | Ponytail chain root (case-insensitive) |
| `skirt_1` | ✗ | Not a spring bone (missing "springbone") |
| `SpringBoneCollider` | ✓ | Valid name, but only acts as a root when its metadata entry has `isRoot: true` |

The `springbone` substring is the convention by which artists and tooling identify spring bone nodes in the hierarchy. By itself, the name marks a node as a _candidate_ spring bone. The Explorer treats a candidate as a **spring root** only when the wearable's `data.springBones` metadata contains an entry for that node with `isRoot: true`.

### Spring Root Bone

A node is a **spring root bone** if and only if:

1. Its name contains the substring `springbone` (case-insensitive), AND
2. The wearable's `data.springBones.models[<glbContentHash>]` contains an entry for the node's name with `isRoot: true`.

Both signals are required. A node that satisfies the naming rule but has no matching metadata entry (or whose entry sets `isRoot: false`) is treated as a chain member, not a root.

The spring chain owned by a root consists of the root bone itself and all its glTF node descendants, traversed depth-first.

Each node in a spring chain SHOULD have at most one child that is also part of the chain, forming a linear sequence from root to tip. Branching topologies — where a node has more than one spring bone child — are not enforced against but MAY produce unexpected simulation behavior.

### Item Metadata Schema

Spring bone parameters live on `wearable.data.springBones` and follow the JSON schema defined by `SpringBonesData` in `@dcl/schemas`:

```json
{
  "version": 1,
  "models": {
    "<glbContentHash>": {
      "SpringBone_hair_left": {
        "stiffness": 2.0,
        "gravityPower": 0.8,
        "gravityDir": [0, -1, 0],
        "drag": 0.3,
        "center": "Avatar_Hips",
        "isRoot": true
      }
    }
  }
}
```

- `version` MUST be exactly `1`.
- `models` is keyed by the **GLB content hash** — the value found in `WearableEntity.content[<representation.mainFile>]`. Wearables whose male and female representations point at the same `.glb` bytes resolve to one entry; entries are stable across path renames.
- Inner keys are spring bone names exactly as they appear in the `.glb` (case-sensitive match against the GLB node `name`).

### Parameter Reference

`version` is a top-level field of `SpringBonesData` and MUST be `1`.

The following per-bone parameters apply to each entry in `models[<hash>]`:

| Parameter | Type | Range | Default | Description |
| --- | --- | --- | --- | --- |
| `stiffness` | float | `0–4` | `2.0` | Rigidity; how strongly the bone returns to its rest pose. `0` = fully loose, follows gravity only. Higher values = firmer, follows the body more closely. |
| `gravityPower` | float | `0–2` | `0` | Magnitude of the gravity force applied to the bone every frame. `0` = unaffected by gravity. |
| `gravityDir` | `[number, number, number]` | unit vector | `[0, -1, 0]` | Direction of the gravity force in world space. Default simulates natural downward gravity. Can be used to simulate wind or a floating effect. The Explorer MUST normalize the vector if it is not already a unit vector. |
| `drag` | float | `0–1` | `0.5` | Deceleration / damping. `0` = bone swings freely for a long time. `1` = bone settles almost instantly. |
| `isRoot` | boolean | — | OPTIONAL | Declares whether this node is the root of a spring chain (`true`) or a chain member that overrides inherited parameters (`false` or absent). Required to be `true` for a node to be treated as a spring root (see Spring Root Bone). |
| `center` | string (node name) | valid node name | OPTIONAL | Name of a reference bone node. When set, inertia is evaluated relative to that node's space, preventing excessive sway during locomotion. The referenced node MUST exist and MUST NOT be part of any spring chain. |

Parameter ranges (`stiffness`, `gravityPower`, `drag`) are enforced by the JSON schema in `@dcl/schemas` and verified at deploy time by the content validator (see Deploy-time Validation).

`gravityDir` reference values:

| Value        | Effect                                  |
| ------------ | --------------------------------------- |
| `[0, -1, 0]` | Downward (natural gravity, default)     |
| `[0, 1, 0]`  | Upward (floating / supernatural effect) |
| `[1, 0, 0]`  | Leftward                                |
| `[-1, 0, 0]` | Rightward                               |
| `[0, 0, 1]`  | Forward                                 |
| `[0, 0, -1]` | Backward                                |

Axes are in **world space**. Diagonal values are valid.

### Runtime Reconstruction

The Explorer MUST reconstruct spring chains at load time using the following procedure:

1. **Resolve representation**: pick the wearable representation matching the requested body shape and take its `mainFile`.
2. **Resolve hash**: look up `mainFile` in the entity's `content` array to obtain the GLB content hash.
3. **Look up parameters**: read `wearable.data.springBones?.models[hash]`. If absent, no spring bones apply for this representation.
4. **Version check**: verify that `wearable.data.springBones.version === 1`. If not, log a warning and skip spring bone simulation for this wearable.
5. **Discovery**: traverse all nodes in the `.glb`. A node is a spring bone candidate iff its name contains `springbone` (case-insensitive). For each candidate, look up its name in the metadata entry. A candidate is a **spring root** iff its metadata entry has `isRoot: true`.
6. **Chain construction**: starting from each spring root, collect all descendant nodes depth-first to form the chain. Descendant nodes inherit simulation behavior by hierarchy and do not need their own metadata entry. If a candidate is already a descendant of another spring root, the Explorer MAY discard its root status and treat it solely as a chain member.
7. **Tip identification**: the deepest node in each chain is the tip. Its parameters, if any, are not applied by the simulation. It exists solely to define the chain's geometric endpoint.
8. **Center resolution**: if `center` is specified, resolve the node name. If the name does not correspond to any node in the file, or if it points to a spring bone node, the Explorer SHOULD log a warning and MUST fall back to world space.

### Explorer Behaviour

The Explorer MUST apply spring bone simulation to all spring root bones found in any loaded wearable. This applies to the local player's avatar and all other players' avatars in the scene. The Explorer reads spring bone parameters from the wearable's item metadata (`data.springBones`); the `.glb` file is consulted only for bone names and hierarchy.

For performance reasons, the Explorer MAY disable spring bone simulation for avatars beyond a distance threshold from the local player. The threshold value is an implementation detail.

Spring bone simulation MUST also be active in all avatar renderers outside the main world, including but not limited to the login screen and the backpack/wearables preview.

### Builder Behaviour

The Builder MUST detect spring bone candidates in an uploaded `.glb` by scanning for nodes whose name contains `springbone` (case-insensitive). For each detected bone, the Builder MUST expose its parameters as editable controls and MAY prefill them with sensible defaults; existing values from the wearable's `data.springBones` metadata SHOULD be used to prefill when present.

When a creator saves changes, the Builder MUST write the updated parameter values into `item.data.springBones.models[<hash>]`, where `<hash>` is the content hash of the representation's `mainFile`. The `.glb` MUST NOT be modified by parameter edits.

The Builder MUST drop entries from `models` whose hash no longer matches any current representation's `mainFile`, so stale parameters from a prior model upload do not persist into a later save.

When a wearable's male and female representations point at the same `.glb` bytes, the Builder MUST write a single entry under that shared hash; there is exactly one parameter set per distinct GLB.

### Deploy-time Validation

Catalyst's content validator (`@dcl/content-validator`) enforces the following rules on `data.springBones` at deployment time. A wearable that fails any of these is rejected:

- The `springBones` value MUST conform to the `SpringBonesData` JSON schema in `@dcl/schemas` (parameter ranges, required fields, `gravityDir` as a 3-tuple of numbers, optional `center`/`isRoot`).
- Every key in `models` MUST equal the content hash of some current representation's `mainFile`. Filename-keyed entries and stale hashes from prior uploads are rejected.
- Every bone name in `models[<hash>]` MUST contain the `springbone` token (case-insensitive), matching the discovery rule.
- Each `models[<hash>]` entry MUST NOT contain more than 12 spring bone entries. Wearables that define more than 12 spring bones per GLB representation are rejected.

Structural and per-parameter range validation is delegated to the schema; the validator only enforces the cross-references that the schema cannot express on its own.

### Features Not Included in this version:

The following are explicitly excluded and MAY be addressed in a future revision:

- **Colliders`**: collision detection, response, and per-bone hit radius are not included in this version.
- **Collider groups**: springs have no grouping mechanism for selective collision.
- **Shared parameter groups**: each root bone owns its configuration independently.
- **Cross-wearable chain interactions**: chains are self-contained within a single wearable file.
- **Global wind system**: `gravityDir` can approximate per-wearable wind, but there is no scene-level wind force.

The schema is designed to allow future addition of colliders logic and other parameters without breaking existing files.

### Full Example

A complete spring-bone wearable is the combination of two artifacts: the `.glb` (carrying bone names and hierarchy) and the wearable item metadata (carrying parameters).

**`.glb` node hierarchy**:

```json
{
  "asset": {"version": "2.0"},
  "nodes": [
    {"name": "Avatar_Head", "children": [1, 2]},
    {"name": "SpringBone_earring_r", "children": [3]},
    {"name": "SpringBone_hair_left", "children": [4]},
    {"name": "springbone_earring_r_tip"},
    {"name": "SpringBone_hair_left_tip"}
  ]
}
```

**Wearable item metadata** (`wearable.data.springBones`):

```json
{
  "version": 1,
  "models": {
    "bafkreialsvt77jvpy673cnugp5ggnxfaalfncufweayuk3jbxskh3pelkm": {
      "SpringBone_earring_r": {
        "stiffness": 0.5,
        "gravityPower": 1.0,
        "gravityDir": [0, -1, 0],
        "drag": 0.6,
        "isRoot": true,
        "center": "Avatar_Hips"
      },
      "SpringBone_hair_left": {
        "stiffness": 2.0,
        "gravityPower": 0.8,
        "gravityDir": [0, -1, 0],
        "drag": 0.4,
        "isRoot": true
      }
    }
  }
}
```

In this example:

- The `.glb`'s content hash is `bafkrei...pelkm`, used as the outer key of `models`.
- Both `SpringBone_earring_r` and `SpringBone_hair_left` satisfy the naming rule and have metadata entries with `isRoot: true`, so they are spring roots.
- `SpringBone_earring_r -> springbone_earring_r_tip` and `SpringBone_hair_left -> SpringBone_hair_left_tip` each form a single chain by hierarchy.
- Both chains reference `Avatar_Hips` by name as their `center`.
- The `_tip` nodes are chain tips. They have no metadata entry; the simulation ignores any parameters that might be present on tips.
- If the same `.glb` is shared across male and female representations, `models` still has a single entry — one per distinct GLB hash.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
