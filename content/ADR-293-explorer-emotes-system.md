---
adr: 293
date: 2026-03-23
title: Explorer emotes system
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - aixaCode
---

## Abstract

This ADR describes the emotes system used in the Decentraland Explorer (decentraland/unity-explorer), which replaces the emotes system described in [ADR-66](/adr/ADR-66) (now deprecated). The new system uses Unity's Mecanim AnimatorController, ECS components for state tracking, and an asset-bundle-based pipeline for emote loading.

## Context, Reach & Prioritization

The old emotes system (ADR-66) was built on the unity-renderer architecture, relying on DataStore for state management, RefCountedCollections for lifecycle tracking, and the plugin pattern from ADR-56.

The new explorer client uses the Mecanim animation system instead of Legacy Animation, requiring a different approach to loading and playing emotes at runtime.

## Specification

### Animation System

The explorer uses Unity's **Mecanim** system with `AnimatorController` for emote playback. This enables complex animation transitions with the locomotion system.

Since Unity does not allow creating non-legacy animation clips at runtime, the asset bundle conversion pipeline was modified: each emote's asset bundle now includes a pre-built `AnimatorController` with a simple transition and a trigger named after the clip.

### Emote Playback Flow

1. An entity receives a `CharacterEmoteIntent` component (the intent to play an emote)
2. `CharacterEmoteSystem` consumes the intent
3. If the emote asset is loaded, the avatar clip is assigned to the Avatar's AnimatorController and the trigger is fired
4. If the emote has extended props, the prop clip is triggered separately
5. The `CharacterEmoteComponent` tracks the current emote state on the entity

### Extended Emotes (Props)

Extended emotes support props via a naming convention for clips:
- Avatar animation clips use the avatar nomenclature
- Prop clips are identified separately and played on prop GameObjects

Documentation: https://docs.decentraland.org/creator/emotes/props-and-sounds/

### EmotePlayer

The `EmotePlayer` class handles:
- Playing and stopping emotes
- Pool management (multiple avatars can play the same emote simultaneously)
- `EmoteReferences` (MonoBehaviour with references) serves as pool key

### Embedded Emotes

Non-blockchain emotes are stored in the `EmbeddedEmotes/ExtendedEmotes` folder. Old emotes (legacy animation clips) are converted to the AnimatorController format via an editor script (`EmbeddedEmotesEditor.cs`).

### Key Differences from ADR-66

| Aspect | ADR-66 (Old) | This ADR (New) |
|--------|-------------|----------------|
| Animation system | Legacy Animation component | Mecanim AnimatorController |
| State management | DataStore + RefCountedCollection | ECS components (CharacterEmoteComponent) |
| Intent system | DataStore events | CharacterEmoteIntent ECS component |
| Architecture | Plugin pattern (ADR-56) | ECS systems in DCL/AvatarRendering/Emotes/Systems |
| Asset format | GLB with animation clips | Asset Bundles with pre-built AnimatorController |

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
