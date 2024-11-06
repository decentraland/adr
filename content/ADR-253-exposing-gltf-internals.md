---
layout: adr
adr: 253
title: Exposing GLTF internals
date: 2024-10-26
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
- robftm
- leanmendoza
---

# Abstract
This document sets the extension of [GLTF functionality](https://adr.decentraland.org/adr/ADR-215), the adopted standard in Decentraland to load 3D scenes, by allowing access to the internal structure of GLTF/GLB models. This capability enables various functionalities, such as using pointer events for specific colliders, modifying internal nodes and materials, and fetching animation lists. By exposing these internal components, developers can create more dynamic and interactive experiences within the engine.

# Context and Motivation
The existing pipeline for using 3D assets in interactive environments lacks the flexibility needed to dynamically control or modify specific elements within a GLTF model. Currently, artists and developers face limitations such as:
- Difficulty creating interactable components within a single GLTF asset, needing separate exports for each interactive model part.
- The inability to directly reference or manipulate internal nodes, meshes, and materials within the GLTF complicates asset integration and limits creative potential.
- Challenges in synchronizing code-driven animations, events, and visual modifications with specific parts of a model, impeding advanced customizations.

This feature is motivated by the need to improve both basic and advanced use cases for creators working with GLTF models:
- For **entry-level creators**: This feature enables direct access to model elements like colliders and transforms without separate exports, supporting quicker, easier setup for interactable components. For instance, you would be able to export an entire scene, prefix all the relevant nodes, and then fetch them in a list to manipulate in the scene code.
- For **advanced developers**: It provides powerful tools to transform internal nodes, repurpose model elements (e.g., using a mesh or material as a resource), and create code-driven animations or effects that modify specific model components dynamically. For example, you could attach other models to the internal parts, like a sword to a hand in an NPC model, or you can use a GLTF to instance several meshes pointing to the same resource.

This solution provides a deeper level of control by extending access to these internal resources. It supports a flexible workflow that integrates more seamlessly with artist pipelines and accelerates creative experimentation.

# Proposed Solution

The proposed solution expands various GLTF components, enabling detailed, interactive control over model elements. Key updates include:

- Modify `GltfLoadingState`: New properties (animationNames, materialNames, meshNames, nodePaths) make it easier to access GLTF’s internal components. These properties let developers quickly reference animation clips, material names, mesh names, and node paths, simplifying animations, interactions, or modifications.
- Modify `GltfContainer`: add the property `internalFeedback` to directly pipe the internal info in the `GltfLoadingState` 
- Modify `Material` Component: A `gltf` material reference added to the `Material` component allows for dynamic use of GLTF materials within a scene. `Material` properties default to GLTF specifications unless changed, simplifying setup and customization without needing manual adjustments.
- Modify `MeshRenderer` and `MeshCollider`: a `gltf` mesh reference added to these components to support mesh reuse across different entities, enabling interactive development with a single model.
- Add `GltfNode` and `GltfNodeState` Components: The new `GltfNode` and `GltfNodeState` components **let developers map GLTF nodes to scene entities**, allowing independent modification of a node’s `Transform`, Material, and MeshRenderer. These components stay in sync with GLTF animations, supporting dynamic transformations, event-based interactions, and resource re-use.

# Usage

This specification is designed not only to provide functionality for creators but also to enable the development of advanced tools built upon it.

The primary and key elements for usage are as follows:

## Fetching the Structure
When assigning a `GltfContainer` to an entity, and upon successful loading, the `GltfLoadingState` is populated with the complete GLTF scene data. This feedback can be disabled by setting `internalFeedback=false` within the `GltfContainer` (default is `true`).

### Generating an Accurate Animation List
One common challenge in utilizing animations is ensuring the accuracy of animation names. As a result of fetching the structure, the animation list can directly be taken from the GLTF. Developers can either copy the string names or map the states through the array. 

For instance, hardcoding each GLTF animation name is impractical when developing dynamic smart items within environments like the In-World Builder. Obtaining the animation list at runtime is crucial to streamlining the direct animation selection pipeline.

## Accessing a Node from the Internal Tree
Once a GLTF is loaded and instantiated within the world, referencing specific nodes of the GLTF scene becomes possible. The availability of the node list enables efficient identification without the need to reference the entire tree structure.

To reference a node, add a `GltfNode` component as the **child** of the `GltfContainer` and await the `GltfNodeState`. Upon reaching the `READY` state, certain components are added to the entity as follows:
- **Transform**: While set for parenting, this is populated with the relative transform from the `GltfContainer`.
- **MeshRenderer**: For visible meshes, this component is added with the `gltf` option.
- **MeshRenderer**: For invisible meshes, this component is added with the `gltf` option.
- **Material**: When a mesh is affected by a `Material`, this component is added with the `gltf` option.

While all components are writable, specific considerations apply:
- **Transform**: When an animation influences this node, the transform is disregarded.
- **Material**: If the `gltf` field is set in `Material`, default values fall back to the GLTF material properties. For example, properties such as `albedoColor` or `diffuseColor` default to *WHITE* but defer to the GLTF-defined settings if no custom values are provided.

## Using GLTF as a Mesh/Material Resource
This specification further allows the use of resources from a GLTF by setting the `gltf` field within `Material`, `MeshRenderer`, or `MeshCollider`. It is recommended to first load the `GltfContainer` and retrieve available meshes, materials, and textures, ensuring that these resources are loaded into memory before being used. 

# Specification
## Implementation details

1. **GltfContainer Initialization and Loading State**
   - A `GltfContainer` component **MUST** be assigned to an entity to initialize and populate `PBGltfContainerLoadingState` with detailed GLTF structure data.
   - `PBGltfContainerLoadingState` **MUST** expose the following properties:
     - `node_paths`: All node paths in the GLTF.
     - `mesh_names`: All meshes within the GLTF, with unnamed meshes auto-assigned names.
     - `material_names`: All materials in the GLTF, with unnamed materials auto-assigned names.
     - `skin_names`: All mesh skins in the GLTF, with unnamed skins auto-assigned names.
     - `animation_names`: All animations in the GLTF, with unnamed animations auto-assigned names.
   - Unnamed assets **SHOULD** be automatically assigned unique names to avoid conflicts, and creators **SHOULD** explicitly name all assets to ensure clarity.

2. **Adding and Using GltfNode Components**
   - A `GltfNode` component **MUST** be added to an entity that is either a direct child of a `GltfContainer` entity or another entity with a `GltfNode`. 
   - More than one `GltfNode` for the same path in the same `GltfContainer` is not allowed.
   - The `path` in `PBGltfNode` **MUST** match the path of one of the `node_paths` available within `PBGltfContainerLoadingState`.
   - Upon the renderer attaching `PBGltfNodeState`, the entity **MUST** progress through the following states:
     - **`GNSV_PENDING`**: Node is loading.
     - **`GNSV_FAILED`**: Node loading failed, with an optional `error` string describing the failure.
     - **`GNSV_READY`**: Node is ready and its `Transform`, `MeshRenderer`, `MeshCollider`, and `Material` components **MUST** be populated according to the GLTF data.
   - Once `GNSV_READY`, the following behaviors **SHALL** apply:
     - `Transform`: **MUST** match the position of the GLTF node relative to its parent.
     - `MeshRenderer`: **SHOULD** be added with a `GltfMesh` type if the GLTF node has a mesh.
     - `MeshCollider`: **SHOULD** be added with a `GltfMesh` type if the GLTF node has a collider.
     - `Material`: **MAY** be added if the node has an associated material.

3. **Component Modification and Animation Synchronization**
   - Modifying a `GltfNode` component’s `Transform`, `MeshRenderer`, `MeshCollider`, or `Material` **MAY** dynamically alter the node as follows:
     - **Transform**: **MUST** update based on animation priority, with any ongoing animations taking precedence over manual modifications.
     - **Visibility**: **MAY** be toggled to show or hide the node and its children within the GLTF hierarchy.
     - **MeshRenderer and MeshCollider**: **MAY** be modified to update or remove meshes and colliders.
     - **Material**: **MAY** be modified to adjust material properties, with default values based on GLTF-defined settings. Unsupported GLTF features by the SDK will **NOT** be exposed directly.
   - Attempting to modify the scene hierarchy by moving the entity out of the GLTF structure **MUST** set the state to `GNSV_FAILED`, severing the link.

4. **Resource Usage**
   - Structural modifications to the GLTF are **NOT RECOMMENDED** as they **SHALL NOT** reflect in the GLTF hierarchy. Removing `GltfNode` **WILL** reset the node to its original GLTF configuration, and retained components may duplicate if not removed.

This specification provides structured access to GLTF data for interactive scene creation and manipulation, enforcing a robust, standardized protocol for GLTF integration within the engine.


## Protobuf components
Here is the specific part of the modification to directly do in the Protocol.

### Modify
It only shows the part is modified.

```protobuf
option (common.ecs_component_id) = 1017;
message PBMaterial {
    ....
    message GltfMaterial {
        string gltf_src = 1;
        string name = 2;
    }
  
    optional GltfMaterial gltf = 3;
}
```

```protobuf
option (common.ecs_component_id) = 1019;
message PBMeshCollider {
    ...
    message GltfMesh {
        string gltf_src = 1;
        string name = 2;
    }

    oneof mesh {
        ...
        GltfMesh gltf = 6;
    }
}
```

```protobuf
option (common.ecs_component_id) = 1018;
message PBMeshRenderer {
    ...
    message GltfMesh {
        string gltf_src = 1;
        string name = 2;
    }

    oneof mesh {
        ...
        GltfMesh gltf = 6;
    }
}
```

```protobuf
option (common.ecs_component_id) = 1049;
import "decentraland/sdk/components/common/loading_state.proto";
message PBGltfContainerLoadingState {
    ...
    repeated string node_paths = 2;
    repeated string mesh_names = 3;
    repeated string material_names = 4;
    repeated string skin_names = 5;
    repeated string animation_names = 6;
}
```
```protobuf
option (common.ecs_component_id) = 1049;
import "decentraland/sdk/components/common/loading_state.proto";
message PBGltfContainerLoadingState {
    ...
    repeated string node_paths = 2;
    repeated string mesh_names = 3;
    repeated string material_names = 4;
    repeated string skin_names = 5;
    repeated string animation_names = 6;
}
```

```protobuf
option (common.ecs_component_id) = 1041;
message PBGltfContainer {
    ...
    optional bool internal_feedback = 6;
}
```

### New
```protobuf
option (common.ecs_component_id) = 1200;
message PBGltfNode {
    string path = 1;
}
```

```protobuf
option (common.ecs_component_id) = 1201;
message PBGltfNodeState {
    GltfNodeStateValue state = 1;
    optional string error = 2;
}
enum GltfNodeStateValue {
    GNSV_PENDING = 0;
    GNSV_FAILED = 1;
    GNSV_READY = 2;
}
```

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.