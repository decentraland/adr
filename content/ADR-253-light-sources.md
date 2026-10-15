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

A Type field will let you chose between _Spot_, _Point_ and _Global_ light. We believe these types of lights are enough for now, the component could be expanded in the future if we want to include other types.

A _Spot_ light projects a cone of concentrated light in a single direction, originating from a single point in the scene. It's ideal for shows and theatric effects, it can also be used to shine a light on something with a functional intention.

A _Point_ light expands in all directions from a point in the scene, illuminating the space in a more subtle way. The point of origin is often not easy to pinpoint for the player.

A _Global_ light overrides the default ambient light from the sun or moon. It can only be added to the scene _root_ entity.

The following fields will be available on all types of light:

- Color: _Color4_ The color of the light
- Brightness: _number_ The luminosity value of the light. For _Spot_ and _Point_ light, this value is expressed in Lumens, for _Global_ light, it's expressed in Lux units (lumens per square metre).
- Range: _number_ The maximum distance that can be affected by the light source.
- Active: _boolean_ Determines if the light is currently on or not.
- Shadows: _enum_. See [Shadows](#shadows)

In lights of type _Spot_, we will also include:

- Inner angle: _number_ This angle, measured from the direction vertex, defines a cone where the light has full intensity. Max 180, can’t be more than outer angle.
- Outer angle: _number_ This angle, measured from the direction vertex, defines a cone where the light has an effect, the intensity decreases farther away from the inner cone. Max 180.

In lights of type _Global_, we will also include:

- direction: _Vector3_ Sunlight direction.
- ambientColor: _Color3_; // Sky/environment contribution
- ambientBrightness: _number_; // Overall scene brightness multiplier

We will create helpers to make it easier for creators to create these components. For example:

`LightSource.create(myEntity, { color: { r:1, g:0, b:0.5 }, type: LightSource.Type.Spot({ innerAngle: 30, outerAngle: 50 }) })`

The `Active` flag lets creators easily turn a light source on or off. We could otherwise achieve the same by setting intensity to 0, but offering a switch makes it easier to retain the prior configuration. Another option debated was to use the `Visibility` component to turn off a light, but decided that we wanted to keep the visibility of any meshes as a separate independent consideration.

## Shadows

Note: This feature it's included here to discuss the full vision, but field for this may change later.

All light sources will have a `shadows` property that determines if a light will cast shadows and if these are low or high quality (Hard and Soft shadows).

Default values should differ by light type:

- Point/Spot lights: false (performance consideration)
- Global light: true (essential for scene depth)

Each engine is free to determine considerations like shadow resolutions, or putting a limit on the number of shadows being computed and how to prioritize these. It's recommendable to make these variables dependent on user quality settings.

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

This will be done by adding a `LightSource` component to the root entity, using the type `Global`. This will override the default directional light from the sun or moon.

Default values:

- Default directional light should match typical daylight
- Direction could vary with time-of-day (if implemented)
- Reasonable ambient light for scene visibility

It should be possible to do both in worlds and in Genesis City.

## Serialization

```yaml
parameters:
  COMPONENT_ID: 1079
  COMPONENT_NAME: core::LightSource
  CRDT_TYPE: LastWriteWin-Element-Set
```

```protobuf
message PBLightSource {
  optional bool active = 4;                       // default = true, whether the lightSource is active or not.
  optional decentraland.common.Color3 color = 1;  // default = Color.white, the tint of the light, in RGB format where each component is a floating point value with a range from 0 to 1.
  optional float brightness = 2;                  // default = 250, ranges from 1 (dim) to 100,000 (very bright), expressed in Lumens for Point and Spot.
  optional float range = 3;                       // default = 10, how far the light travels, expressed in meters.

  oneof type {
    Point point = 6;
    Spot spot = 7;
  }

  message Point {
    optional ShadowType shadow = 5; // default = ShadowType.ST_NONE The type of shadow the light source supports.
  }

  message Spot {
    optional float inner_angle = 1;                                     // default = 21.8. Inner angle can't be higher than outer angle, otherwise will default to same value. Min value is 0. Max value is 179.
    optional float outer_angle = 2;                                     // default = 30. Outer angle can't be lower than inner angle, otherwise will inner angle will be set to same value. Max value is 179.
    optional ShadowType shadow = 5;                                     // default = ShadowType.ST_NONE The type of shadow the light source supports.
    optional decentraland.common.TextureUnion shadow_mask_texture = 8;  // Texture mask through which shadows are cast to simulate caustics, soft shadows, and light shapes such as light entering from a window.
  }

  enum ShadowType {
    ST_NONE = 0;  // No shadows are cast from this LightSource.
    ST_SOFT = 1;  // More realistic type of shadow that reduces block artifacts, noise or pixelation, but requires more processing.
    ST_HARD = 2;  // Less realistic type of shadow but more performant, uses hard edges.
  }
}
```

## Semantics

### Example

Basic Spot Light with all default values
```ts
LightSource.create(myEntity, { type: LightSource.Type.Spot({}) })
```

Basic Point Light with all default values
```ts
LightSource.create(myEntity, { type: LightSource.Type.Point({}) })
```

Point Light with green color and big intensity and range
```ts
LightSource.create(myEntity,
{
  color: { r: 0, g: 1, b: 0 },
  brightness: 10000,
  type: LightSource.Type.Point({})
})
```

Spot Light with complete declaration including shadows and shadow mask
```ts
LightSource.create(myEntity, {
      color: { r: 0, g: 1, b: 0 },
      range: 15,
      active: true,
      brightness: 1500,
      shadow: PBLightSource_ShadowType.ST_HARD,
      type: LightSource.Type.Spot({
          innerAngle: 35,
          outerAngle: 55,
          shadowMaskTexture: Material.Texture.Common({src: "assets/window_frame_mask.png"})
        })
    })
```
