---
adr: 294
date: 2026-03-23
title: Explorer ECS runtime architecture
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - aixaCode
---

## Abstract

This ADR describes the ECS runtime architecture used in the Decentraland Explorer (decentraland/unity-explorer), which replaces the runtime architecture described in [ADR-67](/adr/ADR-67) (now deprecated). The new architecture is built on the Arch ECS framework with a dual-world system, automated system ordering, and a hybrid ECS approach that allows Unity MonoBehaviours as components.

## Context, Reach & Prioritization

The old runtime architecture (ADR-67) was designed for unity-renderer and focused on component registration patterns to avoid a god-object anti-pattern where the runtime knew about all components. It used UPM packages for segregation.

The new explorer client was built from scratch using a pure ECS approach with the Arch framework, introducing fundamentally different patterns for component registration, system lifecycle, and world management.

## Specification

### Dual-World Architecture

The runtime maintains two types of worlds:

- **Global World**: A single instance created at startup. Handles realm and scene lifecycle, player and camera entities, avatars received from comms, and cross-cutting concerns.
- **Scene Worlds**: One per JavaScript scene. Fully independent, can be disposed separately. No peer communication between scene worlds is allowed.

### System Lifecycle

Systems run on the main thread once per frame, organized into system groups. The [Arch.SystemGroups](https://github.com/mikhail-dcl/Arch.SystemGroups) library automates system creation and dependency resolution.

Key design rules:
- Systems are the only authoring point for entity logic
- Systems should not maintain persistent collections across frames
- Single Responsibility: split systems exceeding ~200 lines
- Structural changes (Add/Remove components) invalidate `ref` pointers and must be applied last

### Component Design

Components follow these guidelines:
- Prefer structs (value types) to reduce memory footprint
- Classes are used for: MonoBehaviours (hybrid ECS), existing classes with external lifecycle management (e.g., `ISceneFacade`), and components referenced from other worlds
- Components must not contain logic beyond pool management, static factories, and constructors

### Cross-World Communication

Two patterns for communication between Global and Scene worlds:

- **Pattern A (Direct Access)**: Systems in scene worlds directly read from the global world for input, camera, and settings data
- **Pattern B (CRDT Bridge)**: `IECSToCRDTWriter` bridges data from the global world to scene-visible CRDT components. Used for data that scenes need to observe (e.g., player transforms)

Safety guards:
- `ISceneIsCurrentListener` prevents background scenes from modifying global state
- `IFinalizeWorldSystem` ensures cleanup on world disposal
- `SyncedGroup` system guards ensure operations only run when the scene is in Running state

### Async Integration

ECS and async/await are married through the Asset Promise pattern:
- `AssetPromise<TAsset, TLoadingIntention>` represented as entities
- Polled by systems each frame
- Consumed and destroyed when resolved
- No blocking of the main thread

### Events and Callbacks

Callbacks are explicitly forbidden in ECS. No delegates, events, or subscriptions. Systems execute logic only in their `Update` function. Data propagation from Unity objects to systems must go through components, not events.

### Key Differences from ADR-67

| Aspect | ADR-67 (Old) | This ADR (New) |
|--------|-------------|----------------|
| Framework | Custom component registration | Arch ECS framework |
| Worlds | Single world | Dual-world (Global + per-scene) |
| System ordering | Manual | Automated via Arch.SystemGroups |
| Component storage | Plugin-level registration | ComponentsContainer with unique IDs |
| Threading | Main thread only | Job System + MultiThreadSync mutex |
| Unity integration | Traditional MonoBehaviour | Hybrid ECS (MonoBehaviours as components) |

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
