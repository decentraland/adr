---
layout: adr
adr: 175
title: Remove assets from Renderer's build. Addressables Integration
date: 2023-01-16
status: Review
type: Standards Track
spdx-license: CC0-1.0
authors:
  - ajimenezDCL
  - mikhail-dcl
---

## Abstract
This document describes an approach on how to make the reference's client lightweight by streaming the currently embedded assets. 

## Problem
Every nice UI, sound effect, particle, or material we add to the renderer increases its size. This impacts directly loading times or caching since the client's size will go above the max allowed for it (applied to WebGL, check [the PoC](https://github.com/2fd/poc-browser-cache) for details). The idea is to pack textures, audio files, and other assets and stream them in runtime. 

## Solution
### Pack the Assets
Similar to what we are doing with scene assets, we can pack everything into one or multiple (to always be under the cache size limit) asset packs to be consumed by the client. This solution should be part of a different system than the one used for scene assets. Reasons why we can't reuse the system include, but are not limited to:
   - The existing system is legacy both from the runtime and distribution sides (it is based on "Asset Bundles"). Some parts require special attention such as refactoring, and some do not, but we are not going to base the new system on the legacy foundation, neither we are going to address the old issues immediately
   - The system is designed for user-generated content
   - It's designed for a different lifecycle: assets are dynamically released and loaded based on the currently active scenes and other usages. This is redundant for the current purpose, at least for the current iteration
   - It provides mechanisms for loading and handling unprocessed content, whereas the system under consideration is dedicated to compiled assets

### [Addressables](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/index.html)
The Addressables system provides tools and scripts to organize and package content for an application and an API to load and release assets at runtime.
It's an additional abstraction layer over the Asset Bundles System, but it's not limited to this. "Addressables" gives the flexibility to adjust where to host assets and provides mechanisms for dependency resolution, reference counting, simulation, validation, and diagnostics out of the box.

### Strategy
In the first iteration, we are going to use the "Local" mode only:
  - the default addressables profile is suitable for this purpose, so we don't have to introduce our own
<figure>
  <img src="/resources/ADR-175/AddressableProfiles.png" />
</figure>

  - the remote section of the profile we are going to ignore
  - the local section refers to building and loading assets from the "Streaming Assets" directory
  - on WebGL, "Streaming Assets" are hosted in the same storage where the main binary (wasm) is located and, thus, are loaded via "Web Request". To use the "Local" configuration, the "Streaming Assets" folder path has to be specified in the config section of `loader.ts`. This will give the necessary URL needed for Unity to complete the corresponding "Web Request".
  - on Standalone "Streaming Assets" is a directory alongside a main binary, and, thus, are loaded by reading from disk

### Retrocompatibility and Versioning
Currently the renderer is a self-contained experience; and as for "Local" Addressables no dedicated versioning is required:
  - on WebGL "Streaming Assets" are a part of the npm package
  - on Standalone "Streaming Assets" are distributed within the same archive

### Addressables loading
Depending on the specific case, we will use all possible ways to load assets:
  - [Label](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/Labels.html) (to load a list of similar assets)
  - Address (to load an asset by the hardcoded string)
     - By default, the address is a path to the file
<figure>
  <img src="/resources/ADR-175/AddressableAddress.png" />
</figure>

     - It is desirable to shorten the address and adjust it according to the directories and groups structure. The exact rules of the former will be elaborated on in the production pipeline
  - GUID (to load an asset by "Asset Reference")

### [Groups configuration](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/GroupSettings.html)
Group settings determine how the assets in a group are treated in content builds.

<figure>
  <img src="/resources/ADR-175/GroupsConfiguration.png" />
</figure>

We are going to distribute assets in "Addressable Asset Groups" according to the following rules:
   - "Essentials" corresponds to the assets that are mandatory for the application to function (e.g. Skybox) and can't be excluded
   - Other assets according to the logical designation (e.g. "Fonts") and usage (e.g. "Window XXX Resources") fall into different groups; without them the application can function
   - Assets packed together/separately according to the required loading way: any combination of "Include Addresses in Catalog", "Include GUIDs in Catalog" and "Include Labels in Catalog". Thus, we will reduce the size of Catalog.
   - Bundle Mode "Pack Together by Label" will be used to differentiate between platforms (WebGL, Standalone) within the same logical group to exclude unused assets (and the related overhead) if needed
   - We may come up with additional rules for our convenience

Check [Unity guidelines](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/AddressableAssetsDevelopmentCycle.html#organizing-addressable-assets) for additional information.

#### Asset Bundle CRC	
At the moment we don't have any sensitive data that requires integrity check. Moreover, for bigger files it will cause noticeable overhead on loading.
So for the groups we will disable it.

### Resources handling
We are going to exclude Scenes and Resources from Addressables Catalog:
   - We don't plan to migrate "Resources"' API to the corresponding one of "Addressables"
   - We plan to migrate assets currently added to "Resources" to "Addressables" with a proper distribution over time

<figure>
  <img src="/resources/ADR-175/ResourceHandling.png" />
</figure>

### Addressables Caching
"Addressables" uses right the same "Caching" system that "Asset Bundles" does. It works out of the box for all the supported platforms. It is possible to disable caching per group, but in our case we will not be doing it.

### Asset Reference
We are going to utilize ["AssetReference"](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/AssetReferences.html) and "AssetLabelReference" instead of "SerializeField" to properly reference Assets that should be a part of a separate Addressable without creating a strong reference to them.

We can think of several use cases:
   - Optional references that are loaded on demand in conditional branches, and, thus, should not be present in memory all the time
   - Avoiding the case of referencing the same assets by strong references (that are included in the build) and including them in the Addressable/Asset Bundle in order to prevent duplication

Real use cases and distribution of such assets in groups will be refined and defined according to the feature production pipeline with performance in mind.

### Addressables Disposal
Currently, we don't have a robust mechanism for cleaning up memory from assets. We are not going to introduce it this time either. Thus, we will keep all the Addressables loaded in memory. Considering it's the "Local" mode only, it's not gonna be a problem.

### Simulation
We will use "Simulate Groups" mode for loading Addressables in the Editor. It will help us detect and investigate problems earlier. We will prefer it over "Asset Database" false mode.

Simulate Groups mode (BuildScriptVirtualMode) analyzes content for layout and dependencies without creating asset bundles. Assets load from the asset database through the ResourceManager, as if they were loaded through bundles. To see when bundles load or unload during game play, view the asset usage in the Addressables Event Viewer window (Window > Asset Management > Addressables > Event Viewer).

Simulate Groups mode will help us simulate load strategies and tweak our content groups to find the right balance for a production release.

### Addressables Validation
"Addressables" inherits an issue of assets duplication from the Asset Bundles System. Unity [thoroughly described the problem and the way of its resolution](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/ManagingAssets.html#asset-and-assetbundle-dependencies).
"Addressables" provides the ["Analyze Tool"](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/AnalyzeTool.html) and several built-in presets to help detect and/or mitigate such issues.

We have to launch the analysis and fix the issues before pushing Addressables to prevent duplicates and unnecessary implicit references. 

<figure>
  <img src="/resources/ADR-175/AddressablesValidation.png" />
</figure>


### CI/CD
On every build iteration, the addressables get rebuilt and dropped in the "Streaming Assets" folder as per the "Local" configuration. They get built by using the `AddressableAssetSettings.BuildPlayerContent()` in the `BuildCommand.cs`. 
After the build process, those addressables files get copied into a new "Streaming Assets" directory which should be delivered as an artifact within the same package. 


> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
