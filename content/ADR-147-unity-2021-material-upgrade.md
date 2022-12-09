---
layout: adr
adr: 147
title: Upgrade AB Materials to Unity 2021
date: 2022-12-02
status: Live
type: RFC
spdx-license: CC0-1.0
slug: /adr/TEMPLATE
authors:
- ajimenez
---

## Abstract
An algorithm to manually upgrade materials packed in Asset Bundles made in Unity 2020 is required when using Unity 2021. This document will go into the details of the SRP Batcher optimizations and how to navigate the issues in URP serialization. 

## Problem
All our Asset Bundles (by the time this ADR is written) are converted using Unity 2020. Although the Asset Bundles serialization between both versions has not changed, the URP version has. That means we can reuse the asset bundles but not the materials without manually upgrading them.

## Glossary
- AB (aka [Asset Bundle](https://docs.unity3d.com/Manual/AssetBundlesIntro.html)): A proprietary format used by unity to store assets.
- [SRP Batcher](https://docs.unity3d.com/Manual/SRPBatcher.html): A draw call optimization based on reusing the same shader variant.
- Shader Variant: A Shader with a specific set of keywords and defines.

## Solution Space Exploration

- ❌ **Reconvert the world**: The idea is simple, use a Unity 2021 AB converter and redeploy all the ABs, assuming we could create a cron job that would spend a few days converting every scene in the world and every wearable to use the new version. Even with that, we'd need some new infrastructure on top of the systems such as:
  - Upgrading the AB converter: Not trivial, we need to solve some issues with multithreading first (the AB Converter is stuck in an older commit).
  - Versioning: The renderer must understand if it can consume an AB or is not prepared for its version.
  - Content size: Duplicating the size of the whole world to allocate new versions of ABs is something we should do if nothing else works.
- ✔ **Manual upgrade**: Ideally we should be able to gather all the information from the material itself and create a new one with the properties well defined. 

## Upgrading materials from 2020 to 2021
Unfortunately, Unity is using the same class to serialize materials from Unity 2020 to Unity 2021, which means that we have no access to anything the new material doesn't provide. That makes finding stuff like the rendering target (Opaque, Alpha Test, Transparency) challenging because the new URP changed the way keywords are serialized. 

Luckily the shader properties are still there, so we can gather them to try to find the correct setup for the material. Additionally, we optimize the materials for the SRP Batcher to enhance performance, this optimizations give us some insight into the render target of the original material.

### Getting Render target through the SRP Batcher optimizations
SRP Batcher itself is a whole new world that falls outside the scope of this ADR. The minimum we have to know about it is that optimizes draw calls by batching objects being rendered with the same shader variant. A common variant example is having `_ALPHATEST_ON` enabled or not to clip fragments that are invisible based on an alpha value. One of the optimizations we do is assume every opaque material is alpha tested and set the property `_CutOff` (the alpha value for clipping) to `0` in the cases we don't want to clip.

The relevant piece that will solve our problem is tied to the Render Queue. If our render queue is displaying something like this:
- MaterialA_variantA 2050
- MaterialA_variantB 2051
- MaterialA_variantA 2052

SRP Batcher won't be able to batch `MaterialA_variantA` because it has to render `MaterialA_variantB` in the middle. We try to put materials with the same render target (opaque, alpha tested, transparent) and the same properties (same variant) in the same render queue and we will use this to know more about the original material.


The full details of the algorithm can be found [here](https://github.com/decentraland/unity-renderer/blob/dev/unity-renderer/Assets/Scripts/MainScripts/DCL/Helpers/MaterialHelpers/SRPBatchingHelper/SRPBatchingHelper.cs) but the conclusion is that we are gonna have this range of render queues depending on the render target:

```
Opaque 2000 + crc[0, Permutations of shaderName + keywords]  + queueOffset (150, 300 or 450)

Alpha Test 2600 + crc[0, Permutations of shaderName + keywords]  + queueOffset (150, 300 or 450)

Transparent ALWAYS 3000
```

That algorithm shows some overlapping in some extreme cases.
- Opaque materials will always be in a render queue < 2600 if we have less than 150 shader variants permutations. A quick test showed that walking around different scenes for an hour accumulated a total of 15 permutations, so assuming `renderQueue < 2600 => Opaque` is safe.
- Transparent materials will always be in `render queue == 3000` by the algorithm (we don't do further optimization because we need clip space z sorting to render them properly).
- Alpha Tested will always be in a `render queue >= 2600`. The only conflict is in the render queue 3000 (as we saw before, it's reserved for transparent materials). This case can occur if:
  - An alpha-tested material with a queue offset of 150 (`Cull Off`) is optimized at exactly 250 permutations (`2600 + 150 + 250 = 3000`). It's highly unlikely to have so many permutations, we can ignore this.
  - An alpha-tested material with a queue offset of 300 (`Cull Front`) is optimized at 100 permutations (`2600 + 300 + 100 = 3000`). That also goes way above our measurements in permutations, and in any case, `Cull Front` is the least used cull setting.

So we can effectively use the render queue to spot the render target of the material!

## Conclusion
For the serialized properties, we can retrieve anything that was there before due to the nature of serialization.
For the render target, we can use the render queue that the SRP Batcher defines to know which kind of material are we dealing with. This will allow us to set the keywords needed for the new URP material.

## Future work
Unity can change the Asset Bundle serialization in any new version and in that case, no manual conversion will make it compatible. At the same time, we shouldn't sacrifice potential improvements in performance, new language features, or new systems due to being stuck in an older AB serialization.

At some point, we will need to reconvert the world Asset Bundles and by then we will need versioning, tools to make the process painless, and a smart way of storing the assets in a way that we have the deprecated version as less time as possible.

Currently, we just upgraded to Unity 2021 and it will accompany us for a while, the above scenario is far away from now. Nonetheless, we should start preparing ourselves for it.
