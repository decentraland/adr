---
layout: adr
adr: 400
title: Render to Texture
date: 2025-03-03
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - robtfm
---

## Abstract

This document describes an approach for allowing scenes to render alternative world views to textures, for use in UI and in-world displays.

This allows creating UIs with rendered 3d objects like an inventory display, custom map displays, video screens viewing other parts of a scene, and many other use cases. 

## Render to Texture

The heart of the approach is to define multiple "rendering layers", which are like distinct visual worlds. We add 3 new components, `CameraLayer` for layer specification, `CameraLayers` for layer membership, and `TextureCamera` for rendering.

Layer 0 is the main world, and is the layer viewed by the default camera. The explorer MUST support at least 3 layers (the main layer and additional layers 1 and 2). It MAY support further layers.

Entities can belong to multiple layers, cameras can only render a single layer, but multiple cameras may render the same layer:

![LayersDiagram](resources/ADR-400/layers-diagram.png)

Layers are only used for rendering (entities with `GltfContainer`s, `MeshRenderer`s or light components, and any future types of rendered entities), all other entity properties (collisions, audio sources, etc) will not make any use of layer information.

## Managing Layer Properties

Layer properties are managed via the `CameraLayer` component. This component can be added to any entity. There should not be more than 1 such component for each layer: if multiple components exist specifying the same layer the results are undefined.

layer 0, the main world, cannot be modified by scenes, and a `CameraLayer` affecting layer 0 will be ignored. Additional layers are managed fully by scenes. Various properties of the layer (lighting, avatar rendering, etc) can be managed via this component.

```
message PBCameraLayer {
    // layer to which these settings apply. must be > 0
    // Layer 0 is the default "real world" layer viewed by the player and cannot be modified.
    uint32 layer = 1;

    // should the sun light affect this layer? default false
    optional bool directional_light = 2;

    // should this layer show player avatars? default false
    optional bool show_avatars = 3;

    // should this layer show the sky? default false
    optional bool show_skybox = 4;

    // should this layer show distance fog? default false
    optional bool show_fog = 5;

    // ambient light overrides for this layer. default -> use same as main camera
    optional decentraland.common.Color3 ambient_color_override = 6;
    optional float ambient_brightness_override = 7;
}
```

## Assigning Objects to Layers

The `CameraLayers` component is used to assign entities to layers. Like `Visibility` it is propagated to children automatically until overridden by a child with a defined `CameraLayers` of its own.

```
message PBCameraLayers {
    repeated uint32 layers = 1;
}
```

Entities can belong to multiple layers, and will be visible in cameras rendering any layer that they are in.

## Rendering

The `TextureCamera` component creates a new texture, and renders the viewpoint from this entity onto that texture. The texture can then be used via a `VideoTexture` with `video_player_entity` set to the camera entity. 

```
message PBTextureCamera {
    // rendered texture width
    optional uint32 width = 1;
    // rendered texture height
    optional uint32 height = 2;
    // which layer of entities to render. entity layers can be specified by adding PBCameraLayers to target entities.
    // defaults to 0
    optional uint32 layer = 3;

    // default black
    optional decentraland.common.Color4 clear_color = 6;
    // default infinity
    optional float far_plane = 7;

    oneof mode {
        Perspective perspective = 8;
        Orthographic orthographic = 9;
        /* Portal portal = 10; */ 
    };
}

message Perspective {
    // vertical field of view in radians
    // defaults to pi/4 = 45 degrees
    optional float field_of_view = 1;
}

message Orthographic {
    // vertical extent of the visible range in meters
    // defaults to 4m
    optional float vertical_range = 1;
}
```

Rendering MUST be active while the avatar is within the scene. It MAY be active at other times, depending on explorer implementation.

## Limits

Explorers SHOULD limit the number of `TextureCamera`s which can be active, to avoid bad performance or crashes in case of scene authors creating cameras in a loop.

## Implementation Notes

We limit the minimum required number of layers to 3 so that engines (such as unity) with limited layers, and in which objects are constrained to a single layer, can support the layers fully. We expect unity to designate a layer for 0, a layer for 1, a layer for 2, and layers for each combination of 0+1, 0+2, 1+2, 0+1+2. This allows objects to exist on multiple layers using only 2^n-1 unity layers.

Following unity's native layer definition (1 layer per object, cameras target multiple layers) was considered, but we find that many scenarios would require duplicating the entire scene, which is a very high overhead. For example a top-down map view which removes the roof of the building the avatar is in, would require duplicating the entire scene (except the roof) to a second layer (it could also be accomplished by allowing scenes to set multiple layers on the primary camera, but this has introduces complexity for viewing other scenes from within a scene which modifies the primary camera).

## Additional supporting changes

- To make use of the textures in UIs, `UiBackgroundProps` should be extended with a `videoTexture` field for displaying videos and rendered cameras in ui elements. This mirrors the existing `avatarTexture` field.

- Billboards will continue to target the primary camera. Note that they cannot target multiple cameras because a single transform must be used for positioning children of billboard entities in the scene hierarchy. To allow billboarding to be useful with multiple cameras we suggest adding an optional `target` field to the billboard component. As well as allowing for billboards to work with multiple cameras, this is potentially useful in a more general scope.
