---
layout: adr
adr: 259
title: Skybox Time
date: 2025-03-13
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---


## Abstract

The current protocol supports allowing a scene to have a fixed time of day, but it doesn't allow the creators to change it on the fly.

This is a problem if we want to make time of day feel more dynamic and alive. It could be used as a narrative element, or to enhance the experience of a scene, ie: have the sun come up on queue at the end of a dj set.

This ADR proposes a new component that will allow creators to change the time of day on the fly.


## Skybox Time Component

The new component will be called `SkyboxTime`. It's meant to be added to the root entity of the scene. It will have the following properties:

- `fixedTime`: The fixed time of day, represented as a number of seconds since the start of the day (in Decentraland time).

- `transitionMode` (optional): Allows to specify the direction of the transition. It can be `forward` or `backward`. It should be `forward` by default.

Tip: To interpret to this value, divide the seconds value by 60 to obtain minutes, and by 60 again to obtain the hours since the start of the day. For example, if the seconds value is 36000, it corresponds to 10:00 am.

This form of expressing the time of day is consistent with the way we express the `fixedTime` on the scene.json file.

If this component is not present, the scene will follow the same day/night cycle as Genesis City. If the component is present, the scene will have a fixed time of day, using the time value specified by the component.


## Transitioning time

Whenever the `fixedTime` property changes, the scene will transition to the new time of day over a period of time to avoid abrupt changes. The details about this transition are to be defined by each engine. We're intentionally not exposing a `transitionTime` property in this component, as we want to provide that control to the engine.

If the component is removed, the scene will transition back to the prior day/night time.


## Hierarchy of day/night definitions

Since day/night settings can be defined at various levels, we need to define the hierarchy of these settings. From highest to lowest priority, the weight of the settings are:

1. The `SkyboxTime` component.
2. The `fixedTime` property in the scene.json file.
3. The fixed time of day defined by the player via the UI.
4. The time of day as defined globally in Decentraland.

This component will take hierarchy over any other day/night definitions. While this component is present, players will not be able to force the day/night cycle to change from their UI.


### Code helpers

Since the form of expressing time is not entirely intuitive, we'll explore providing a helper function on the component, to allow expressing the time of day in a more natural way. The exact details are yet to be defined.


## Serialization

```yaml
parameters:
  COMPONENT_ID: 1210
  COMPONENT_NAME: core::SkyboxTime
  CRDT_TYPE: LastWriteWin-Element-Set
```

```protobuf
// The SkyboxTime component allows controlling the time of day for the skybox,
// affecting the lighting and appearance of the sky in the scene.
message PBSkyboxTime {
  The fixed time of day, represented as a number of seconds since the start of the day (in Decentraland time).
  uint32 fixed_time = 1;  // fixed time of day, represented as a number of seconds since the start of the day, where 0 is 00:00hs, 43200 is 12:00hs and 86400 is 24:00hs
  optional TransitionMode transition_mode = 2;  // default = TransitionMode.TM_FORWARD, controls the direction of time transitions
}

// Controls the direction for animated skybox transitions
enum TransitionMode {
  TM_FORWARD = 0;   // transitions forward (default)
  TM_BACKWARD = 1;  // transitions backward
}
```

## Semantics

### Example

Basic SkyboxTime with a fixed time value and default TM_FORWARD transition mode
```ts
SkyboxTime.create(engine.RootEntity, { fixedTime: 43200 })
```

SkyboxTime with a fixed time value and a transition mode set
```ts
SkyboxTime.create(engine.RootEntity, { fixedTime: 43200, transitionMode: TransitionMode.TM_BACKWARD })
```
