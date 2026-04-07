---
adr: 295
date: 2026-03-23
title: Explorer realm modifiers for Worlds
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - aixaCode
---

## Abstract

This ADR describes the realm modifier system used in the Decentraland Explorer (decentraland/unity-explorer), which replaces the approach described in [ADR-128](/adr/ADR-128) (now deprecated). Realm modifiers allow the explorer to alter its behavior depending on whether the user is connected to a DAO catalyst realm or a World, using the ECS-based plugin and features architecture.

## Context, Reach & Prioritization

The old realm modifier system (ADR-128) was designed for the unity-renderer and used the old plugin architecture (ADR-56) with an `IRealmModifier` interface. Each modifier would receive an `OnEnteredRealm` callback with realm configuration data to enable or disable functionality.

The new explorer client uses an ECS-based architecture where realm state is represented as components and the FeaturesRegistry controls feature availability.

## Specification

### Realm State in ECS

When the explorer connects to a realm, the realm configuration (from the `/about` endpoint, as defined in [ADR-110](/adr/ADR-110)) is stored as ECS components in the Global world. Systems can query these components to determine the current realm type and configuration.

### Feature Toggling

The `FeaturesRegistry` singleton determines feature availability based on:
- Feature Flags fetched from the feature flags service
- App Arguments (command-line flags)
- Realm type (DAO catalyst vs. World)
- Dependencies on other features

Systems and plugins check `FeaturesRegistry.Instance.IsEnabled(FeatureId)` to conditionally enable realm-specific behavior.

### Modifier Patterns

Instead of a single `IRealmModifier` interface with callbacks, realm-specific behavior is implemented through:

1. **ECS Systems** that query realm configuration components and adjust behavior accordingly
2. **Plugin initialization** that checks realm type during setup
3. **FeaturesRegistry** for features that should be disabled in certain realm types (e.g., minimap blocking in Worlds)

### Key Differences from ADR-128

| Aspect | ADR-128 (Old) | This ADR (New) |
|--------|-------------|----------------|
| Interface | `IRealmModifier` with callbacks | ECS systems + FeaturesRegistry |
| State storage | DataStore | ECS components in Global world |
| Feature control | Per-modifier enable/disable | Centralized FeaturesRegistry |
| Registration | Plugin registers modifiers | Systems query realm components directly |

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
