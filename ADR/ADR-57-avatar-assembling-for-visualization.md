---
layout: adr
slug: adr/ADR-57
adr: 57
date: 2020-01-57
title: Avatar assembling instructions for visualization
---

# Context

An Avatar in Decentraland is a set of *wearables* on top of a bodyshape. Its complexity lies in the relations between different *wearables*, how they interact with one another and their capability to shift form based on the bodyshape they are attached. This documents breaks down the steps and requirements to visualize an Avatar properly. 

# Definitions

- *Wearable*    
    ```json
    {
       "id":"urn:decentraland:off-chain:base-avatars:black_sun_glasses",
       "data":{
          "representations":[
             {
                "bodyShapes":[
                   "urn:decentraland:off-chain:base-avatars:BaseMale"
                ],
                "mainFile":"F_Eyewear_BlackSunglasses.glb",
                "overrideReplaces":[],
                "overrideHides":[],
                "contents":[
                   {
                      "key":"AvatarWearables_TX.png",
                      "hash":"QmRaHnacT5G7oLYTYGsRWZtLXzXuTNEq7gWAcvXRSxfwEU"
                   },
                   {
                      "key":"F_Eyewear_BlackSunglasses.glb",
                      "hash":"QmXLrokLeJkmyFD64xGicQyD3R3M4AWcPFLXJMNQx9U7eK"
                   }
                ]
             },
             {
                "bodyShapes":[
                   "urn:decentraland:off-chain:base-avatars:BaseFemale"
                ],
                "mainFile":"F_Eyewear_BlackSunglasses.glb",
                "overrideReplaces":[],
                "overrideHides":[],
                "contents":[
                   {
                      "key":"AvatarWearables_TX.png",
                      "hash":"QmRaHnacT5G7oLYTYGsRWZtLXzXuTNEq7gWAcvXRSxfwEU"
                   },
                   {
                      "key":"F_Eyewear_BlackSunglasses.glb",
                      "hash":"QmXLrokLeJkmyFD64xGicQyD3R3M4AWcPFLXJMNQx9U7eK"
                   }
                ]
             }
          ],
          "category":"eyewear",
          "tags":[
             "accesories",
             "woman",
             "women",
             "male",
             "man",
             "base-wearable"
          ]
       }
    }
    ```
    

# Hides and Replaces

To avoid issues such as clipping when rendering, each *wearable* contains sets of categories to *hide* and *replace.*

## Hides

This list represents the categories a wearable hides. They are still part of the profile, but just invisible. For instance, your *helmet* wearable might want to hide the facial hair to avoid a beard from coming out of the mesh, but you want your beard to still be equiped if you remove the helmet.

Conflicts are solved in order within the profile. If two wearables mutually hide one another, the first one in the list of wearables in the profile will hide the other one (which won’t be taken into account).

Hides list is mostly used at rendering time.

## Replaces

This list represents the categories a wearable replace. It’s used when constructing the avatar in the editor. For intance, your *greek mask* covers most of your face, so you want any eyewear to be replaced; if you equip it in the Avatar Editor any eyewear equiped will be unequiped.

Conflicts are *not posible* at rendering time, an avatar profile containing a wearable within the *replaces* *list* of another one should never be received. If this were to happen both wearables will be visible and rendered.

# Representations

A *wearable* definition holds an array of representations that determines its content for a specific bodyshape. The lack of a representation for a bodyshape is handled as an incompatibility.

```json
{
  "bodyShapes":[
     "urn:decentraland:off-chain:base-avatars:BaseMale"
  ],
  "mainFile":"F_Eyewear_BlackSunglasses.glb",
  "overrideReplaces":[],
  "overrideHides":[],
  "contents":[
     {
        "key":"AvatarWearables_TX.png",
        "hash":"QmRaHnacT5G7oLYTYGsRWZtLXzXuTNEq7gWAcvXRSxfwEU"
     },
     {
        "key":"F_Eyewear_BlackSunglasses.glb",
        "hash":"QmXLrokLeJkmyFD64xGicQyD3R3M4AWcPFLXJMNQx9U7eK"
     }
  ]
}
```

# Required Categories

Avatars shouldn’t run naked around the world, to prevent this a fallback system was designed when something goes wrong. Only missing wearables in specific categories will be fallen back.

- *BaseFemale*
    
    ```
    "eyes" => "urn:decentraland:off-chain:base-avatars:f_eyes_00"
    "eyebrows" => "urn:decentraland:off-chain:base-avatars:f_eyebrows_00"
    "mouth" => "urn:decentraland:off-chain:base-avatars:f_mouth_00"
    "hair" => "urn:decentraland:off-chain:base-avatars:standard_hair"
    "upper_body" => "urn:decentraland:off-chain:base-avatars:f_sweater"
    "lower_body" => "urn:decentraland:off-chain:base-avatars:f_jeans"
    "feet" => "urn:decentraland:off-chain:base-avatars:bun_shoes"
    ```
    
- *BaseMale*
    
    ```
    "eyes" => "urn:decentraland:off-chain:base-avatars:eyes_00"
    "eyebrows" => "urn:decentraland:off-chain:base-avatars:eyebrows_00"
    "mouth" => "urn:decentraland:off-chain:base-avatars:mouth_00"
    "hair" => "urn:decentraland:off-chain:base-avatars:casual_hair_01"
    "facial" => "urn:decentraland:off-chain:base-avatars:beard"
    "upper_body" => "urn:decentraland:off-chain:base-avatars:green_hoodie"
    "lower_body" => "urn:decentraland:off-chain:base-avatars:brown_pants"
    "feet" => "urn:decentraland:off-chain:base-avatars:sneakers"
    ```
    

# Cheat sheet

This is a summary of the process to render an avatar.

1. Gather the *bodyshape.*
2. Filter out *wearables* that doesn’t contain a *representation* for that *bodyshape.*
3. Iterate the hides list and remove affected *wearables* from the process.
4. Fill *required categories* with default *wearables* for the *bodyshape.*
5. Download the wearable assets.
    1. If the download fails, fallback to a default one.
6. Apply coloring to hair and skin.

# Armature

Each wearable carries its own set of bones (only the needed ones) which makes them completely autonomous and capable of playing animations on their own.

# Shading
The only requirement about shading is tinting the correct materials with skin/hair colors. Any material matching `(?i)\bskin\b` will be tinted with the skin color and any other matching `(?i)\bhair\b` will be tinted with the hair color.

Three different shaders are used when rendering an avatar.

- *Unlit Cutout with Tint*: Used for mouth and eyebrows: The tint can be masked with a monochannel texture, *black* tints*, white* doesnt tint.
- *Unlit Cutout for Eyes*: It’s similar to the previous one but this one contains a mask where the iris is tinted.
- *Toon shader:* The rest of the avatar is rendered with a *Toon Shader.*