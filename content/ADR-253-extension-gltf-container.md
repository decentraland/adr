---
layout: adr
adr: 250
title: Extension GLTF functionality in runtime 7
date: 2024-10-26
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
- robftm
- leanmendoza
---

# Abstract
This document sets the extension of GLTF functionality, the adopted standard in Decentraland to load 3D scenes, by allowing the access to the internal structure of GLTF/GLB models. This capability enables various functionalities such as the use of pointer events for specific colliders, modification of internal nodes and materials, and fetching animation lists. By exposing these internal components, developers can create more dynamic and interactive experiences within the engine.

# Context and Motivation
The existing pipeline for using 3D assets in interactive environments lacks the flexibility needed to dynamically control or modify specific elements within a GLTF model. Currently, artists and developers face limitations such as:
- Difficulty creating interactable components within a single GLTF asset, needing separate exports for each interactive model part.
- Inability to directly reference or manipulate internal nodes, meshes, and materials within the GLTF, which complicates asset integration and limits creative potential.
- Challenges in synchronizing code-driven animations, events, and visual modifications with specific parts of a model, impeding advanced customizations.

This feature is motivated by the need to improve both basic and advanced use cases for creators working with GLTF models:
- For **entry-level creators**: This feature enables direct access to model elements like colliders and transforms without separate exports, supporting quicker, easier setup for interactable components.
- For **advanced developers**: It provides powerful tools to transform internal nodes, repurpose model elements (e.g., using a mesh or material as a resource), and create code-driven animations or effects that modify specific model components dynamically.

By extending access to these internal resources, this solution provides a deeper level of control, supporting a flexible workflow that integrates more seamlessly with artist pipelines and accelerates creative experimentation.

# Proposed Solution

The proposed solution expands various GLTF components, enabling detailed, interactive control over model elements. Key updates include:

- Modify `GltfLoadingState`: New properties (animationNames, materialNames, meshNames, nodePaths) make it easier to access GLTF’s internal components. These properties let developers quickly reference animation clips, material names, mesh names, and node paths, simplifying animations, interactions, or modifications.
- Modify `GltfContainer`: add the property `internalFeedback` to directly pipe the internal info in the `GltfLoadingState` 
- Modify `Material` Component: A `gltf` material reference added to the Material component allows for dynamic use of GLTF materials within a scene. Material properties default to GLTF specifications unless changed, simplifying setup and customization without needing manual adjustments.
- Modify `MeshRenderer` and `MeshCollider`: a `gltf` mesh reference added to these components to support mesh reuse across different entities, enabling interactive development with a single model.
- Add `GltfNode` and `GltfNodeState` Components: The new `GltfNode` and `GltfNodeState` components **let developers map GLTF nodes to scene entities**, allowing independent modification of a node’s Transform, Material, and MeshRenderer. These components stay in sync with GLTF animations, supporting dynamic transformations, event-based interactions, and resource re-use.

## Usage

