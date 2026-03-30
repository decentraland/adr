---
adr: 292
date: 2026-03-23
title: Explorer avatar rendering pipeline
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - aixaCode
---

## Abstract

This ADR describes the GPU skinning pipeline used for avatar rendering in the Decentraland Explorer (decentraland/unity-explorer), which replaces the modular avatar system described in [ADR-65](/adr/ADR-65) (now deprecated). The new pipeline uses compute shaders, a Global Vertex Buffer (GVB), the AvatarCelShading shader, and Unity's Job System for high-performance avatar rendering at scale.

## Context, Reach & Prioritization

The old avatar system (ADR-65) was designed for the unity-renderer and used a modular pattern with a curator, loader, animator, GPU skinning module, LOD module, and visibility module, all coordinated through the DataStore plugin pattern.

The new explorer client required a fundamentally different approach to handle large numbers of avatars efficiently. The key challenge is that Unity's `SkinnedMeshRenderer` does not scale well, so a custom skinning pipeline was needed.

## Specification

### Avatar Structure

Each avatar consists of:
- An **AvatarBase** prefab containing the bone structure and an invisible skinned mesh renderer that drives animation via a Mecanim Animator component
- **Wearable GameObjects** downloaded from the asset bundle server, converted from `SkinnedMeshRenderer` to `MeshRenderer` for scalability

### Rendering Pipeline

The pipeline has three stages:

#### 1. Unity Job System (CPU)

The `StartAvatarMatricesCalculationSystem` dispatches a job early in the frame to transform animated bone matrices into local space, using Unity's Burst compiler for parallelization. The `FinishAvatarMatricesCalculationSystem` completes the job as late as possible to maximize parallelism.

#### 2. Compute Shader (GPU)

The bone matrices are sent to the GPU via a single `SetData` call. The compute shader performs 4-weight bone skinning, calculating position, normals, and tangents for every vertex. Results are written into the **Global Vertex Buffer (GVB)**.

The GVB stores vertex info for all instantiated avatars. When an avatar is removed, its space is freed for reuse. The `FixedComputeBufferHandler` and `MakeVertsOutBufferDefragmentationSystem` manage buffer fragmentation.

#### 3. AvatarCelShading Shader (Rendering)

The AvatarCelShading shader reads from the GVB using indexes set during setup. Textures are stored in texture arrays to minimize binding costs between draw calls, enabling efficient SRP batching.

### Key Design Decisions

- **No mesh combining**: Each wearable remains an independent mesh renderer and material. Only the vertex buffer is shared. This makes wearable swapping instantaneous.
- **Texture arrays**: Reduce texture binding overhead across all avatar draw calls.
- **Frame-parallel computation**: Bone matrix calculations run in parallel with other systems via the Job System.

### Key Differences from ADR-65

| Aspect | ADR-65 (Old) | This ADR (New) |
|--------|-------------|----------------|
| Skinning | Module-based GPU skinning | Compute shader + GVB pipeline |
| Rendering | Standard Unity rendering | AvatarCelShading with texture arrays |
| Architecture | Modular OOP (Curator/Loader/Animator) | ECS systems pipeline |
| Wearable swap | Mesh recombination needed | Instant (buffer index update) |
| Coordination | DataStore plugin pattern | ECS single-instance entities |

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
