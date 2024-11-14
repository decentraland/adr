---
layout: adr
adr: 253
title: Light Sources
date: 2024-11-13
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

This document explores a new feature that has been missing from Decentraland scenes: letting creators control light. We will allow creators to define a limited number of entities in their scenes that will behave as sources of light, and offer a number of parameters to control the kind of light-source, color, luminosity, etc.

We also explore how we can make this work in an open world, and its implications.
We also discuss limitations that should be imposed, to prevent a degradation of the experience if this feature is misused.

# Context

Up until now, all light in Decentraland came from a single rigid source (the sun or moon). Enabling creators to create their own light sources enables a lot of creative possibilities. We see the control of light as important for the following:

- Creating ambience and enhance the architecture of a scene
- Flashy effects for music festivals, fashion week, and other events of high visual impact
- Light as a visual cue: guide the player towards what’s important in a scene by shining a light on it. Signal a change in what’s going on in the scene by switching the lights to a different intensity or color.
- Darkness as a mechanic for spooky games
- Flashlights as a mechanic: the act of having to point a light to reveal what’s there can be a whole game mechanic.

To be able to play with darkness, we'll also need to provide controls to be able to disable the global default light sources and play with that.

Note: Some GLTF models come with lights packaged as nodes inside the structure of the model. We should ignore those completely. The only lights we will be rendering are the ones defined via code using the LightSource component.

## Component description

We should create a `LightSource` component that, when added to an entity, tells the engine to shine a light from that entity’s Transform position.

A Type field will let you chose between _Spot_ and _Point_ light. We believe these two types of lights are enough for now, the component could be expanded in the future if we want to include other types.

A _Spot_ light projects a cone of concentrated light in a single direction, originating from a single point in the scene. It's ideal for shows and theatric effects, it can also be used to shine a light on something with a functional intention.

A _Point_ light expands in all directions from a point in the scene, illuminating the space in a more subtle way. The point of origin is often not easy to pinpoint for the player.

The following fields will be available on both types of light:

- Color: _Color4_ The color of the light
- Intensity: _number_ The luminosity value of the light, from 0 to 1.
- Range: _number_ The maximum distance that can be affected by the light source.
- Active: _boolean_ Determines if the light is currently on or not.

In lights of type _Spot_, we will also include:

- Inner angle: _number_ This angle, measured from the direction vertex, defines a cone where the light has full intensity. Max 180, can’t be more than outer angle.
- Outer angle: _number_ This angle, measured from the direction vertex, defines a cone where the light has an effect, the intensity decreases farther away from the inner cone. Max 180.

The `Active` flag lets creators easily turn a light source on or off. We could otherwise achieve the same by setting intensity to 0, but offering a switch makes it easier to retain the prior configuration.

## Shadows

Note: This feature will likely not ba a part of the initial implementation. It's included here to discuss the full vision, but field for this may not be present on the protocol or the SDK until later.

By default lights won’t have shadows. Each light source can chose if they want shadows or not, and if to use hard shadows or soft shadows.

We will add fields for this on the `LightSource` component:

- Shadow type: No shadows / Hard Shadows / Soft shadows

- The creator can chose the shadow resolution as a setting on each light source
- The shadow resolution is picked by the player in the user’s settings, as a global option. If they have low settings they’ll always use low res

## Limitations

Note: This aspect will likely not ba a part of the initial implementation. It's included here to discuss the full vision, but field for this may not be present on the protocol or the SDK until later. Although restrictions will be applied at an engine level, and each engine could theoretically have different values, it's ideal that we're all aligned on these values, so experiences don't differ accross engines.

We will start with restrictive limitations, and raise them gradually if necessary.

1 light source per parcel. We also need a maximum limit for large scenes.
What is a good number? TDB while developing and testing.

We should also constrain the maximum brightness, otherwise we could completely blind the player. TDB while developing and testing.

If a light is not being rendered because of going over the limits, the engine should print an error message to console, to make creators aware of the reasons.

## Open world considerations

We advise that each engine only renders the lights of the current scene you’re standing on. In this way:

- Neighboring scenes don’t get affected in performance
- Neighboring scenes don’t mess with the esthetic of others, at least not when you’re standing on that other scene.

Engines can add a default behavior of fading lights in/out over a period of a second whenever you switch scenes. This is to avoid abrupt light changes when you walk from one parcel to another.

### Affect global ambient light

Note: This point deserves its own ADR and will be addressed in the future, but it's good to start considering how it will interact.

Creators might want to turn off the default light of the sun, to have better control over lighting conditions. This is essential for example to create a spooky ambiance.

They could be done via a component on the root entity. Otherwise it could be a scene setting in the scene.json. TBD.

It should ideally be possible to do both in worlds and in Genesis City, but perhaps we can start with enabling it just in worlds for now if that’s easier.

To consider: Instead of turning on-off, can we also dim or tint the default light?

## Serialization

```yaml
parameters:
```

```protobuf

```

## Semantics

### Example
