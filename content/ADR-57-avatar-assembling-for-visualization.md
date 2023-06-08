---
adr: 57
date: 2022-01-27
title: Avatar assembling instructions for visualization
status: Living
authors:
- AjimenezDCL
type: Standards Track
spdx-license: CC0-1.0
---

# Context

An Avatar in Decentraland is a set of _wearables_ on top of a bodyshape. Its complexity lies in the relations between different _wearables_, how they interact with one another and their capability to shift form based on the bodyshape they are attached. This documents breaks down the steps and requirements to visualize an Avatar properly.

# Definitions

- _Wearable_
  ```json
  {
    "id": "urn:decentraland:off-chain:base-avatars:black_sun_glasses",
    "data": {
      "representations": [
        {
          "bodyShapes": ["urn:decentraland:off-chain:base-avatars:BaseMale"],
          "mainFile": "F_Eyewear_BlackSunglasses.glb",
          "overrideHides": [],
          "contents": [
            {
              "key": "AvatarWearables_TX.png",
              "hash": "QmRaHnacT5G7oLYTYGsRWZtLXzXuTNEq7gWAcvXRSxfwEU"
            },
            {
              "key": "F_Eyewear_BlackSunglasses.glb",
              "hash": "QmXLrokLeJkmyFD64xGicQyD3R3M4AWcPFLXJMNQx9U7eK"
            }
          ]
        },
        {
          "bodyShapes": ["urn:decentraland:off-chain:base-avatars:BaseFemale"],
          "mainFile": "F_Eyewear_BlackSunglasses.glb",
          "overrideHides": [],
          "contents": [
            {
              "key": "AvatarWearables_TX.png",
              "hash": "QmRaHnacT5G7oLYTYGsRWZtLXzXuTNEq7gWAcvXRSxfwEU"
            },
            {
              "key": "F_Eyewear_BlackSunglasses.glb",
              "hash": "QmXLrokLeJkmyFD64xGicQyD3R3M4AWcPFLXJMNQx9U7eK"
            }
          ]
        }
      ],
      "category": "eyewear",
      "tags": ["accesories", "woman", "women", "male", "man", "base-wearable"]
    }
  }
  ```

# Hides and Force Render

To avoid issues such as clipping when rendering, each _wearable_ contains sets of categories to _hide_.
In addition, the avatar definition contains a field called _forceRender_ to allow specific hidden categories to be displayed anyway. More info at [ADR-239](/adr/ADR-239)

## Hides

This list represents the categories a wearable hides. They are still part of the profile, but just invisible. For instance, your _helmet_ wearable might want to hide the facial hair to avoid a beard from coming out of the mesh, but you want your beard to still be equiped if you remove the helmet.

Conflicts are solved in order within the profile. If two wearables mutually hide one another, the first one in the list of wearables in the profile will hide the other one (which won’t be taken into account).

Hides list is mostly used at rendering time.

# Representations

A _wearable_ definition holds an array of representations that determines its content for a specific bodyshape. The lack of a representation for a bodyshape is handled as an incompatibility.

```json
{
  "bodyShapes": ["urn:decentraland:off-chain:base-avatars:BaseMale"],
  "mainFile": "F_Eyewear_BlackSunglasses.glb",
  "overrideHides": [],
  "contents": [
    {
      "key": "AvatarWearables_TX.png",
      "hash": "QmRaHnacT5G7oLYTYGsRWZtLXzXuTNEq7gWAcvXRSxfwEU"
    },
    {
      "key": "F_Eyewear_BlackSunglasses.glb",
      "hash": "QmXLrokLeJkmyFD64xGicQyD3R3M4AWcPFLXJMNQx9U7eK"
    }
  ]
}
```

# Required Categories

Avatars shouldn’t run naked around the world, to prevent this a fallback system was designed when something goes wrong. Only missing wearables in specific categories will be fallen back.

- _BaseFemale_
  ```
  "eyes" => "urn:decentraland:off-chain:base-avatars:f_eyes_00"
  "mouth" => "urn:decentraland:off-chain:base-avatars:f_mouth_00"
  "hair" => "urn:decentraland:off-chain:base-avatars:standard_hair"
  ```
- _BaseMale_
  ```
  "eyes" => "urn:decentraland:off-chain:base-avatars:eyes_00"
  "mouth" => "urn:decentraland:off-chain:base-avatars:mouth_00"
  "hair" => "urn:decentraland:off-chain:base-avatars:casual_hair_01"
  "facial" => "urn:decentraland:off-chain:base-avatars:beard"
  ```

# Cheat sheet

This is a summary of the process to render an avatar.

1. Gather the _bodyshape._
2. Filter out _wearables_ that doesn’t contain a _representation_ for that _bodyshape._
3. Iterate the hides list and remove affected _wearables_ from the process if not present in the _forceRender_ field.
4. Fill _required categories_ with default _wearables_ for the _bodyshape._
5. Download the wearable assets.
   1. If the download fails, fallback to a default one.
6. Apply coloring to hair and skin.

# Armature

Each wearable carries its own set of bones (only the needed ones) which makes them completely autonomous and capable of playing animations on their own.

# Shading

The only requirement about shading is tinting the correct materials with skin/hair colors. Any material matching `(?i)\bskin\b` will be tinted with the skin color and any other matching `(?i)\bhair\b` will be tinted with the hair color.

Three different shaders are used when rendering an avatar.

- _Unlit Cutout with Tint_: Used for mouth and eyebrows: The tint can be masked with a monochannel texture, _black_ tints*, white* doesnt tint.
- _Unlit Cutout for Eyes_: It’s similar to the previous one but this one contains a mask where the iris is tinted.
- _Toon shader:_ The rest of the avatar is rendered with a _Toon Shader._
