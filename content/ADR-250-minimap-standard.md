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

This ADR proposes a standardization for the way that we consume the Minimap data and how the Explorers should render it. The objective is to have a standard way of doing that for each Realm and World, not just for Genesis City.

# Context

At the date of publishing this ADR, the Explorers have a Minimap that is specific for the Genesis City. With the Expansion of Decentraland, new realms and worlds were created that are not at Genesis City. This require to have a common way of knowning how to display the map in the Explorers.

This also include metadata for knowing where the districts are, empty parcels, owned lands, and more.

# Proposal

Note: This proposal is not going to break the compatibility of the current Explorers Minimaps.

To be able to show the data of the Minimap, the protocol for the [/about](https://decentraland.github.io/catalyst-api-specs/#tag/Global/operation/getAboutCatalystInfo) is going to be modified [here](https://github.com/decentraland/protocol/blob/main/proto/decentraland/realm/about.proto), and the `MinimapConfiguration` is going to be modified, making the old parameters deprecated.

```proto
message MinimapConfiguration {
  // @deprecated
  reserved 1;
  // @deprecated
  reserved 2;
  // @deprecated
  reserved 3;
```

We are going to add give the information about the Map Shape. To be able to have any type of shape, we are going to implement an array of rects.

```proto
message MinimapConfiguration {
  // ...
  
  // the union of all rects here represents the places where can have scenes
  //  all the other parcel will be considered as empty, up to the explorer to decide if they're walkable or not
  repeated decentraland.common.BorderRect sizes = 4; 
}
```

For example, Genesis City sizes are: 
```json
"sizes": [
  { "left": -150, "top": -150, "right": 150, "bottom": 150 },
  { "left": 62, "top": 151, "right": 162, "bottom": 158 },
  { "left": 151, "top": 59, "right": 163, "bottom": 150 }
]
```

This allows the Explorers at least to render a basic shape to Explore every Realm.

After that, we are going to implement two ways of rendering the content for that map.

## 1. From Images (Satellite)
This is inspired by the [Genesis.City Grant](https://genesis.city/). They took satellite pictures of the World with Orthographic projection, with multiple resolutions.

| Note: The specifics of the implementation for image generation are beyond the scope of this proposal and depend on the tools that will be developed. This is ultimately up to the developers. However, the following will outline how the Explorers should utilize the generated data.

The endpoint url is:

https://{url}/{version}/{zoom}/{x},{y}.jpeg

where the zoom is 1 to X (from far to near), and the {x},{y} it's the position.

The zoom 1, means is x1. So the entire world is going to be in the picture. The size of the world in Satellite is a custom size of width and height that the owner choose to use.

For Genesis City
The following zooms corresponds to the xTIMES that you are going to zoom.

|Zoom|See parcels|
|----|-----------|
|x1  |320x320    |
|x2  |160x160    |
|x4  |80x80      |
|x8  |40x40      |
|x16 |20x20      |
|x32 |10x10      |
|x64 |5x5        |

## 2. From Metadata

# Conclusion



## RFC 2119 and RFC 8174

> The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "
> SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL"
> in this document are to be interpreted as described in RFC 2119 and RFC 8174.