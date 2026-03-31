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

This ADR defines the standard for embedding spring bone physics parameters in Decentraland wearable `.gltf` model files using a glTF vendor extension. Spring bones are extra bones — not part of the base avatar armature — whose transforms are driven by a physics simulation rather than animation clips, enabling hair, earrings, capes, belts, and similar wearable elements to move dynamically in response to avatar locomotion and gravity. A spring root bone is identified by a node name containing `springbone` (case-insensitive) combined with the presence of the `DCL_spring_bone_joint` extension in its glTF node `extensions` field. All descendant bones of a root automatically form its spring chain. The parameter set mirrors the VRM `VRMC_springBone` convention. Basic collider support via `hitRadius` is defined for future use; collision logic is out of scope for this version.

## Context, Reach & Prioritization

Currently all wearable elements that extend beyond the base avatar armature — hair, earrings, ponytails, capes, belts, and similar accessories — are completely static. They do not react to the avatar's movement, animations, or environmental forces such as gravity. This is a significant visual quality gap compared to industry-standard avatar formats such as VRM and MMD, which have supported spring/physics bones for years.

Decentraland avatars use a custom armature in `gltf` format (see [ADR-57](/adr/ADR-57)). Each wearable carries only the bones it needs and is fully autonomous. This architecture is compatible with adding optional spring bone definitions without affecting wearables that do not use them.

The implementation will use the UniVRM `VRMSpringBone` component in the Unity-based Explorer. The parameter set defined here is chosen to be directly compatible with that component's expectations, avoiding any translation layer between stored data and the simulation runtime.

This standard affects every system that renders avatars: the Explorer (local and remote players), the Builder wearable editor, the Marketplace avatar preview, and the login/backpack screen. A shared spec is required for all of these to interoperate correctly.

**Vocabulary:**

- **Spring bone / jiggle bone / physics bone:** A bone not part of the base armature whose transform is driven by physics simulation.
- **Spring root bone:** A node that owns a spring configuration. Identified by a node name containing `springbone` (case-insensitive, anywhere in the name) and the presence of the `DCL_spring_bone_joint` extension.
- **Spring chain:** The spring root bone and all its glTF node descendants, simulated together.
- **Chain tip:** The deepest descendant in a spring chain. Acts as the geometric endpoint; its parameters are not used by the simulation.
- **`center`:** An optional reference node name. When specified, inertia is calculated relative to that node's space rather than world space, preventing excessive sway during locomotion.

## Solution Space Exploration

Multiple approaches were considered for where to store spring bone parameters.

### Option A: Root-level `extras`

Data lives in the root glTF object's `extras` field under a `DCL_springBones` key, with an explicit `springs` array listing chains and joints by node index. This mirrors how VRM's extension is structured.

**Not chosen** because it does not allow creators to set parameters directly in Blender using bone Custom Properties. This approach would require parameters to be entered entirely through the Builder UI or a future Blender plugin, which is an unnecessary constraint. Node-level configuration is natively exported by Blender without any plugin.

### Option B: Parameters in Item Metadata

Spring bone parameters live in the wearable item's metadata, stored externally as JSON and fetched independently from the `gltf` model at runtime. The model contains only the bone nodes; the physics configuration is not embedded in the file.

```json
{
  "springBones": [
    {
      "name": "SpringBone_hair_l",
      "stiffness": 2.0,
      "gravityPower": 0.3,
      "gravityDir": [0, -1, 0],
      "drag": 0.5
    }
  ]
}
```

**Not chosen** because it introduces two sources of truth that must be kept in sync indefinitely. If a creator renames or restructures bones in their model and re-uploads the `.glb`, the metadata references break silently. This desynchronization risk is structural, it cannot be fully engineered away. Additionally, the Explorer would need to reconcile two separate resources at avatar load time, adding error surface. Backend schema changes and migrations would be required. Creators coming from Blender or any DCC tool would lose any authoring work done outside the Builder, as there is no mechanism to carry node-level properties into external metadata.

### Option C: Node-level `extras`

Physics parameters live directly in each spring root bone's glTF node `extras` field. Chains are inferred at load time from the node hierarchy.

This approach was native to standard glTF and allowed node-level configuration. However, using `extras` for structured data is less formal and makes the intent of the data less clear to tooling and other readers.

### Option D: Node-level Vendor Extension `DCL_spring_bone_joint`

Physics parameters live in a formal glTF vendor extension (`DCL_spring_bone_joint`) within each spring root bone's `extensions` field. Chains are inferred at load time from the node hierarchy. The extension is declared in the root `extensionsUsed` array.

This approach provides:

- **Clear intent**: the `extensions` object signals to all tooling that this is structured, spec-driven data
- **Future-proof**: the `version` field allows for schema evolution without breaking parsing
- **Authoring simplicity**: node-level configuration works with Blender's native Custom Properties export
- **No breaking changes**: existing files remain valid; the extension is optional
- **Vendor flexibility**: we define the schema now and may submit for formal Khronos registration later, but immediate functionality does not require approval

The trade-off is that chain topology must be reconstructed from the hierarchy at load time rather than read from an explicit list. This is addressed by the `springbone` naming convention, which makes spring bone nodes unambiguous to both artists and tooling.

## Specification

### Node Naming Convention

All spring bone nodes MUST have a name containing the substring `springbone` (case-insensitive). The substring can appear at any position in the name.

Examples:

| Node name | Valid? | Meaning |
| --- | --- | --- |
| `SpringBone_hair_left` | ✓ | Left hair chain root |
| `hair_springbone_l` | ✓ | Left hair chain root (variant) |
| `springbone_earring_r` | ✓ | Right earring chain root |
| `ponytail_SPRINGBONE` | ✓ | Ponytail chain root (case-insensitive) |
| `skirt_1` | ✗ | Not a spring bone (missing "springbone") |
| `SpringBoneCollider` | ✓ | Valid name, but not a root unless it also has the extension |

The `springbone` substring is the convention by which artists and tooling identify spring bone nodes in the hierarchy. The Explorer identifies spring root bones by the combination of a node name containing `springbone` (case-insensitive) and the presence of the `DCL_spring_bone_joint` extension. Both signals are required.

### Spring Root Bone

A node is a **spring root bone** if and only if:

1. Its name contains the substring `springbone` (case-insensitive), AND
2. Its `extensions` object contains the `DCL_spring_bone_joint` key

The spring chain owned by a root consists of the root bone itself and all its glTF node descendants, traversed depth-first.

Each node in a spring chain SHOULD have at most one child that is also part of the chain, forming a linear sequence from root to tip. Branching topologies — where a node has more than one spring bone child — are not enforced against but MAY produce unexpected simulation behavior.

### Node Extension Schema

```json
{
  "extensionsUsed": ["DCL_spring_bone_joint"],
  "nodes": [
    {
      "name": "SpringBone_hair_left",
      "extensions": {
        "DCL_spring_bone_joint": {
          "version": 1,
          "stiffness": 1.0,
          "gravityPower": 1.0,
          "gravityDir": [0, -1, 0],
          "drag": 0.5,
          "hitRadius": 0.02,
          "isRoot": true,
          "center": "Avatar_Hips"
        }
      }
    }
  ]
}
```

The `DCL_spring_bone_joint` extension object resides within a node's `extensions` field. All parameters are OPTIONAL. When absent, the defaults defined below apply. The root glTF object MUST declare `DCL_spring_bone_joint` in its `extensionsUsed` array if any node uses this extension.

### Parameter Reference

| Parameter | Type | Range | Default | Description |
| --- | --- | --- | --- | --- |
| `version` | integer | ≥ 1 | required (must be 1) | Schema version for forward compatibility. Current version is `1`. Required to identify the extension schema variant. |
| `stiffness` | float | ≥ 0 | `1.0` | Rigidity, how strongly the bone returns to its rest pose. `0` = fully loose, follows gravity only. Higher values = firmer, follows the body more closely. |
| `gravityPower` | float | ≥ 0 | `1.0` | Magnitude of the gravity force applied to the bone every frame. `0` = unaffected by gravity. |
| `gravityDir` | vec3 normalized | — | `[0, -1, 0]` | Direction of the gravity force in world space. Default simulates natural downward gravity. Can be used to simulate wind or a floating effect. |
| `drag` | float | 0–1 | `0.5` | Deceleration / damping. `0` = bone swings freely for a long time. `1` = bone settles almost instantly. |
| `isRoot` | boolean | — | `true` | Declares this node as the root of a spring chain. Reserved for future use; currently, presence of the extension automatically marks a node as root. |
| `hitRadius` | float | ≥ 0 | `0.02` | Radius used for collision detection. Currently unused; reserved for future collider implementation. |
| `center` | string (node name) | valid node name | none | OPTIONAL. Name of a reference bone node. When set, inertia is evaluated relative to that node's space, preventing excessive sway during locomotion. The referenced node MUST exist and MUST NOT be part of any spring chain. |

`gravityDir` SHOULD be a unit vector. If the provided vector is not normalized, the Explorer MUST normalize it before use.

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

1. **Extension Declaration Check**: verify that the root `extensionsUsed` array includes `DCL_spring_bone_joint`. If not, no spring bones are present in the file.
2. **Discovery**: traverse all nodes in the file. Collect every node whose name contains `springbone` (case-insensitive) and whose `extensions` field contains the key `DCL_spring_bone_joint`.
3. **Version Check**: for each discovered node, read the `version` field in the extension. If `version` is not `1`, log a warning and skip that node (or handle according to implementation strategy for unknown versions).
4. **Chain construction**: starting from each discovered node (spring root), collect all descendant nodes depth-first to form the chain. Descendant nodes do not need to carry the extension — they are chain members by hierarchy. If a discovered node is already a descendant of another discovered node, the Explorer MAY discard it as a root and treat it solely as a chain member.
5. **Tip identification**: the deepest node in each chain is the tip. Its parameters, if any, are not applied by the simulation. It exists solely to define the chain's geometric endpoint.
6. **Center resolution**: if `center` is specified, resolve the node name. If the name does not correspond to any node in the file, or if it points to a spring bone node, the Explorer SHOULD log a warning and MUST fall back to world space.

### Explorer Behaviour

The Explorer MUST apply spring bone simulation to all spring root bones found in any loaded wearable. This applies to the local player's avatar and all other players' avatars in the scene.

For performance reasons, the Explorer SHOULD disable spring bone simulation for avatars beyond a distance threshold from the local player. The threshold value is an implementation detail.

Spring bone simulation MUST also be active in all avatar renderers outside the main world, including but not limited to the login screen and the backpack/wearables preview.

### Builder Behaviour

The Builder MUST detect all spring root bones in an uploaded `.glb` by scanning for nodes whose name contains `springbone` (case-insensitive) and whose `extensions` field contains the key `DCL_spring_bone_joint`. For each detected root, the Builder MUST expose its parameters as editable controls and SHOULD prefill them with the values found in the extension.

When a creator saves changes, the Builder MUST write the updated parameter values back directly into the `DCL_spring_bone_joint` extension object of each affected node in the `.glb`. The `.glb` is always the authoritative source of spring bone configuration.

### Features Not Included in this version:

The following are explicitly excluded and MAY be addressed in a future revision:

- **Colliders logic**: `hitRadius` is defined in the schema and MAY be exported/imported by tools, but collision detection and response are not implemented in this version.
- **Collider groups**: springs have no grouping mechanism for selective collision.
- **Shared parameter groups**: each root bone owns its configuration independently.
- **Cross-wearable chain interactions**: chains are self-contained within a single wearable file.
- **Global wind system**: `gravityDir` can approximate per-wearable wind, but there is no scene-level wind force.

The schema is designed to allow future addition of colliders logic and other parameters without breaking existing files.

### Full Example

```json
{
  "asset": {"version": "2.0"},
  "extensionsUsed": ["DCL_spring_bone_joint"],
  "nodes": [
    {"name": "Avatar_Head", "children": [1, 2]},
    {
      "name": "SpringBone_earring_r",
      "children": [3],
      "extensions": {
        "DCL_spring_bone_joint": {
          "version": 1,
          "stiffness": 0.5,
          "gravityPower": 1.0,
          "gravityDir": [0, -1, 0],
          "drag": 0.6,
          "hitRadius": 0.02,
          "isRoot": true,
          "center": "Avatar_Hips"
        }
      }
    },
    {
      "name": "SpringBone_hair_left",
      "children": [4],
      "extensions": {
        "DCL_spring_bone_joint": {
          "version": 1,
          "stiffness": 2.0,
          "gravityPower": 0.8,
          "gravityDir": [0, -1, 0],
          "drag": 0.4,
          "hitRadius": 0.02,
          "isRoot": true,
          "center": "Avatar_Hips"
        }
      }
    },
    {"name": "springbone_earring_r_tip"},
    {"name": "SpringBone_hair_left_tip"}
  ]
}
```

In this example:

- Root `extensionsUsed` declares `DCL_spring_bone_joint` availability
- Both nodes `springbone_earring_r` and `SpringBone_hair_left` are spring roots (both contain the extension and have `springbone` in their names)
- `springbone_earring_r -> springbone_earring_r_tip` hangs from `Ear_R`
- `SpringBone_hair_left -> SpringBone_hair_left_tip` hangs from `Neck`
- Both chains reference `Avatar_Hips` by name as their `center`
- The `_tip` nodes are chain tips and their extension parameters (if any) are ignored by the simulation

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
