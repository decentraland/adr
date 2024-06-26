---
layout: adr
adr: 250
title: Explorer Minimap Standard
date: 2024-05-13
status: Review
type: Standards Track
spdx-license: CC0-1.0
authors:
- kuruk-mm
- leanmendoza
---

# Abstract

This ADR proposes standardizing how we consume the Minimap data and how the Explorers should render it. The objective is to have a standard way of doing that for each Realm and World, not just for Genesis City.

# Context

At the date of publishing this ADR, the Explorers have a Minimap specific to Genesis City. The Expansion of Decentraland created new realms and worlds that were not in Genesis City. More general support requires a common way of displaying the map in the Explorers, including metadata for detailing where the districts are, empty parcels, owned lands, and more.

# Proposal

This proposal maintains compatibility with the current Explorers Minimaps implementation. Also, at the time this is proposed, no known explorer is using the current parameters in the `/about` endpoint.

So, to show the Minimap's data, the protocol for the [/about](https://decentraland.github.io/catalyst-api-specs/#tag/Global/operation/getAboutCatalystInfo) is modified [here](https://github.com/decentraland/protocol/blob/main/proto/decentraland/realm/about.proto), and the `MinimapConfiguration` is modified, making the old parameters deprecated. The new `MinimapConfiguration` is:

```proto
message MinimapConfiguration {
  bool enabled = 1;

  // deprecated parameters
  reserved 2;
  reserved 3;
  
  repeated decentraland.common.BorderRect sizes = 4; 
  message ImageViewWithZoomLevel {
    string version = 1; 
    optional string base_url = 2;
    optional string suffix_url = 3;
 }
  
  message ParcelView {
    string version = 1; 
    optional string image_url = 2;
 }

  optional ImageViewWithZoomLevel satellite_view = 5;
  optional ParcelView parcel_view = 6;
  optional ImageViewWithZoomLevel thumbnail_view = 7;
}

```

Example for genesis city:
```json
{
  "sizes": [
 { "left": -150, "top": -150, "right": 150, "bottom": 150 },
 { "left": 62, "top": 151, "right": 162, "bottom": 158 },
 { "left": 151, "top": 59, "right": 163, "bottom": 150 }
 ],
  "satelliteView": {
    "version": "v1",
    "baseUrl": "https://genesis.city/map/latest",
    "suffixUrl": ".jpg"
 },
  "parcelView": {
    "version": "v1",
    "imageUrl": "https://api.decentraland.org/v1/minimap.png"
 }
}
```


## size
- The union of all rectangles here represents the places where can have scenes
- All the other parcels are considered empty; it is up to the explorer to decide if they are walkable or not

With these parameters we can compute an important square, which is the contained one, and the following vertices determine it:
  - top-left = (minX, maxY) 
  - bottom-left = (minX, minX) 
  - top-right = (maxX, maxY) 
  - bottom-right = (maxX, maxY) 

## Image view with zoom-level (version `v1`)
This option is inspired by the current implementation, which the reference client takes from the `genesis.city` grant. It takes satellite pictures of the World with Orthographic projection and multiple resolutions.

| Note: The specifics of the implementation for image generation are beyond the scope of this proposal and depend on the tools that will be developed. This is ultimately up to the developers. However, the following will outline how the Explorers should utilize the generated data.

The endpoint base URL specified in the Realm follows the next schema:
```javascript
const { baseUrl, suffixUrl } = realmAbout.minimaps.satelliteView
const imageUrl = `${baseUrl}/${zoom}/${x},${y}${suffixUrl}
```

Where the zoom is 1 to N (from far to near), and the `{x},{y}` is the quadrant you want to get. Both `baseUrl` and `suffixUrl` are to give flexibility when hosting this service.

For `zoom=1`, the pixel-per-parcel ratio MUST be `3.2`. This means every 32x32 pixels represents 10x10 parcel size (or 160x160 m² area).

|Zoom|Ratio (pixels per parcel width) | 10x10 parcels in pixels |
|----|------------|-----------|
|1   |3.2         | 32x32 |
|2   |6.4         | 64x64 |
|3   |12.8        | 128x128 |
|4   |25.6        | 256x256 |
|5   |102.4       | 1024x1024 |
|6   |204.8       | 2048x2048 |

It allows the Explorers at least to render a basic shape to Explore every Realm.

## Parcel view
This option is based on the also implemented in the reference client with colored parcels. Due to the little information needed for each parcel, an RGB pixel is an oversized amount of data. However, a simple and extensible solution is that each pixel represents each parcel. 

Image specification:
- The 0,0 pixel MUST map to the top-left contained square
- The contained square MUST fit inside
- The metadata of each MUST follow the next specs (already implemented on https://github.com/decentraland/atlas-server/blob/af371f2a59745a1f50b0b0b2382984288c4ae891/src/adapters/mini-map-renderer.ts#L27):
  1. In the channel red, the `top` and `left` specify if there is a separation within parcels in the border
  2. In the channel green is specified the type of parcel, if it's a `road`, a `district` or an `owned` parcel.

| Bit Position | Bitmask Value | Condition |
|--------------|---------------|-----------|
| 3 (0b1000)   | 8             | `top` |
| 4 (0b10000)  | 16            | `left` |

| Bit Position  | Bitmask Value | Condition  |
|---------------|---------------|------------|
| 5 (0b100000)  | 32            | `district` |
| 6 (0b1000000) | 64            | `road` |
| 7 (0b10000000)| 128           | `owned` |

The next one is an example of a Godot shader to render this image:
```gdshader
shader_type canvas_item;

varying vec2 world_position;
uniform mat4 global_transform;
uniform sampler2D map_data;

uniform float size = 16.0;
uniform float line_width_px = 1.0;

uniform vec2 selected_tile = vec2(20.0, 20.0);

const vec3[] colors = {
 vec3(0.0, 0.0, 0.0), // without 
 vec3(0.314,0.329,0.831), // district
 vec3(0.439,0.675,0.463), // plaza
 vec3(0.443,0.424,0.478), // road
 vec3(0.239,0.227,0.275), // onwed
 vec3(0.035,0.031,0.039), // unowned
 vec3(0.0, 0.0, 0.0),
 vec3(0.0, 0.0, 0.0)
};

void vertex() {
 world_position = VERTEX;
}

void fragment() {
 float line_width = line_width_px / size;
 vec2 frag_position = floor(world_position);
 float fx = frag_position.x / size, fy = (frag_position.y / size) + 1.0;
 float cx = floor(fx), cy = floor(fy);
  
 vec4 pixel_data = texelFetch(map_data, ivec2(int(cx), int(cy)), 0);
 int flagsR = int(pixel_data.r * 255.0);
 int flagsG = int(pixel_data.g * 255.0);

 bool topMask = (flagsR & 0x8) > 0;
 bool leftMask = (flagsR & 0x10) > 0;
  
 vec3 parcel_color;
 if (flagsG == 32) {
 parcel_color = colors[1];
 } else if (flagsG == 64) {
 parcel_color = colors[3];
 } else if (flagsG == 128) {
 parcel_color = colors[4];
 } else {
 parcel_color = colors[2];
 }

 vec4 resolved_color = vec4(parcel_color, COLOR.a);

 bool borderLeft = false;
 bool borderTop = false;

 if (topMask == false && leftMask == false) {
 borderLeft = true;
 borderTop = true;
 } else if (topMask && leftMask) {
 borderLeft = false;
 borderTop = false;
 } else {
 if (topMask == false) {
 borderTop = true;
 }
 if (leftMask == false) {
 borderLeft = true;
 }
 }

 if (borderLeft && (fx - cx < line_width)) {
 resolved_color = vec4(0.0, 0.0, 0.0, COLOR.a);
 }

 if (borderTop && (fy - cy < line_width)) {
 resolved_color = vec4(0.0, 0.0, 0.0, COLOR.a);
 }
  
 if (selected_tile.x == cx && selected_tile.y == cy) {
 resolved_color += vec4(0.7, 0.1, 0.1, COLOR.a);
 }
  
 COLOR = resolved_color;
}
```

# Conclusion
This is an optional feature that Realm can use to specify the explorer how to render the Minimap or not. The example for the Genesis-City is straightforward and ready to be implemented in the `/about` request.


## RFC 2119 and RFC 8174

> The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "
> SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL"
> in this document are to be interpreted as described in RFC 2119 and RFC 8174.