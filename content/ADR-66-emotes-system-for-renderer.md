---
adr: 66
date: 2022-04-07
title: Emotes System for Renderer (Unity)
status: Draft
authors:
- AjimenezDCL
type: Standards Track
spdx-license: CC0-1.0
---

## Problem Statement

NFT emotes are arriving to Decentraland with a whole new set of requirements and challenges for the _Renderer_.

Emotes are in the essence just _wearables_ with some extra data. The same UX expected from _wearables_ are now expected from emotes. They have representations, rarity, tags, you can sell or trade them...

The client now longer will contain all the emotes embedded, most of them will live in the _ContentServer_ and this process must be invisble to the user.

Additionally due to memory limitations, the users can now equip up to ten emotes. Any emote not equipped cannot be played.

## Needs

- Receiving and understanding Emotes metadata properly.
- Distinct them from Wearables.
- Download and catalog emotes from the _ContentServer._
- Minimize the usage in memory by dispossing any downloaded emote not in use.
- Give a good UX with a revamped UI allowing you to preview and equip your emotes.

## Glossary

- _Emote_: An emote is a special kind of wearable holding animations to be played by the users. The animation itself is contained in a .gltf or .glb model.
- _Plugin_: A feature implemented in a pattern followed by the renderer: [ADR](/adr/ADR-56).
- _DataStore:_ Containers for Data, accessible project-wide without business logic.

## Approach

### Tracking Emotes usage

Knowing which emotes are equipped is important to optimize the memory usage.

A new collection has been implemented to ease this task: `RefCountedCollection` track the amount of uses for a `key`. This allows prioritization of what emotes must be loaded and disposed.

Therefore, the _DataStore_ contains an `emotesOnUse : RefCountedCollection`.

### Emotes Animations Plugin

The GLTFs carrying the animation must be downloaded for the ones on use.

A plugin has been implemented to react to changes in `emotesOnUse`, download the _GLTF_, retrieve the animation and place it for usage.

Any animation already retrieved and ready will be collected in a _Dictionary_ in the _DataStore_, allowing completely decoupling with the plugin itself for every _Animation_ consumer.

![EmotesDiagram](resources/ADR-66/emotes-diagram.png)

\*When unloading animations, the disposal of GLTF takes effect after the removal of the anim (so every system using the animation can react before it gets unloaded). For readability sakes in the diagram, it has been placed inversely.

### Avatar

Emotes are tied to the avatar itself. The ones equipped by a user will be retrieved along the other wearables in the profile and they must be treated specifically as emotes. Also, the bodyshape affects the representation used in the GLTF downloaded and due to the limitations in the legacy animation flow, animations must be prewarmed at an specific point in the avatar loading process.

The Avatar System is complex enough to be explained in its own [ADR-65](/adr/ADR-65).

The usage of runtime animations forced the GLTFImporter implementation to rely in legacy animations. There’s lot of accesible bibliography on this matter but basically the old system uses an `Animation` component and the new one uses an `Animator` component based on Mechanim. There's an on-going research to evaluate if newer Unity’s versions allow the usage of runtime animations with an `Animator` but at the moment, the implementation is tied to the legacy one.

### UI

Most of the UI complexity is just Unity specific and falls over the ADR’s scope. The key requirement from the architecture is already constrained by the use of DataStore.

UI can request emotes to be loaded (in the backpack for example) with `EmotesOnUse` and known when an animation is ready by listening to changes in `Animations`.

## Tests

The systems created are easily testable thanks to the architecture used. The Data Driven Design taking place in the DataStore allows the dependencies to be mocked entirely leaving the test suite as simple as possible.

_e.g._

- `EmotesAnimationPlugin` can be fully tested by mocking emote requests in `EmotesOnUse`
- Every UI can be also tested by injecting embedded animations in `Animations` without the need of `EmotesAnimationPlugin`

## Benefits

Giving the spotlight to the data itself, instead of the systems, permit easy decoupling between all the actors working with emotes. It also eases the testing process because mocked data can be injected at any time in the flow.

`EmotesAnimationPlugin` also includes embedded emotes making the rest of the system completely agnostic to them. Embedded emotes allows on-going discussions such as “how to handle base-wearables in a decentralized way” to be meditated properly without becoming a blocker.

## Competition

Downloading animations, controlling their lifecycle and disposing them is the heavy lifting of this system. There's a handful of valid approaches to this problem and few reasons to pick one over another; even a singleton (forbidden word) would solve it in a fairly clean way.

Since the plugin system is already consolidated in the renderer architecture, there's no need to stray apart from it. You can read about the benefits of using it
[here](/adr/ADR-56).
