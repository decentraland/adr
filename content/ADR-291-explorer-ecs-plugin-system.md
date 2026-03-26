---
adr: 291
date: 2026-03-23
title: ECS-based plugin system for Explorer
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - aixaCode
---

## Abstract

This ADR describes the ECS-based plugin architecture used in the Decentraland Explorer (decentraland/unity-explorer), which replaces the DataStore/Bridge/HUD plugin pattern described in [ADR-56](/adr/ADR-56) (now deprecated). The new system uses `IDCLPlugin` with Global and World scopes, dependency injection via containers, and an Entity Component System architecture built on top of the Arch ECS framework.

## Context, Reach & Prioritization

The old plugin system (ADR-56) was designed around the unity-renderer architecture which relied on DataStore, Bridges, HUDs, and subsystems. With the migration to unity-explorer, the entire runtime architecture was rebuilt around ECS principles, making the old plugin pattern obsolete.

The new architecture needs to support:

- Two world types: a Global world (player, camera, avatars, realm lifecycle) and per-scene worlds (one per JavaScript scene)
- Plugin-level dependency management and lifecycle control
- Feature toggling via a FeaturesRegistry singleton
- Clean disposal of scene worlds independently

## Specification

### Plugin Scopes

Plugins are defined with two scopes:

- **Global Plugins**: Registered once, operate on the Global world. Handle realm lifecycle, player/camera entities, avatar rendering, and cross-cutting concerns.
- **World Plugins**: Instantiated per-scene world. Handle scene-specific SDK component processing, CRDT synchronization, and scene-level systems.

### Plugin Interface

All plugins implement `IDCLPlugin` which provides:
- Registration of systems into the appropriate world
- Dependency injection via containers
- Clean lifecycle management (creation, disposal)

### Component Registration

Components are registered at the plugin level via `ComponentsContainer` using `RegisterComponent`. Each component has a unique ID (12xx for main, 14xx for experimental, 16xx for Regenesis Labs).

### Dependency Management

Containers manage dependencies between plugins. Plugins declare their dependencies, and the container resolves them at initialization time.

### Feature Toggling

The `FeaturesRegistry` singleton determines if a feature is enabled based on Feature Flags, App Arguments, or other conditions. Plugins can check `FeaturesRegistry.Instance.IsEnabled(FeatureId)` to conditionally enable functionality.

### Key Differences from ADR-56

| Aspect | ADR-56 (Old) | This ADR (New) |
|--------|-------------|----------------|
| Data storage | DataStore (ScriptableObjects) | ECS components, single-instance entities |
| Communication | Bridges + events | ECS systems reading/writing components |
| UI | HUDController | MVC pattern (ControllerBase/ViewBase/MVCManager) |
| Lifecycle | Plugin class with Initialize/Dispose | IDCLPlugin with container-managed lifecycle |
| Threading | Main thread only | MultiThreadSync queue-based mutex + SyncedGroup guards |

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
