---
adr: 282
date: 2025-01-17
title: Decentraland Inspector
authors:
  - cazala
status: Final
type: Standards Track
spdx-license: CC0-1.0
---

# Abstract

The `@dcl/inspector` package implements a scene editor interface for Decentraland, built on React and TypeScript. It provides a modular architecture that can be integrated into different environments through well-defined RPC interfaces and abstractions.

# Core Components

## Entity Hierarchy

A React component that renders and manages the scene's entity tree. It:

- Uses the ECS SDK to track entity relationships and components
- Manages special entities: `ROOT`, `PLAYER`, `CAMERA`
- Implements entity operations through the SDK components API
- Supports entity icons based on component composition (e.g., smart items, custom items, tiles)
- Uses a generic `Tree` component for rendering hierarchical data

### Component Inspector

Handles component editing through specialized inspectors:

Component-specific inspectors include:

- `TransformInspector`: Position, rotation, and scale
- `GltfInspector`: 3D model configuration
- `MaterialInspector`: Material properties and textures
- `ActionInspector`: Smart item action configuration
- `TriggerInspector`: Smart item trigger setup
- `StatesInspector`: Smart item state management
- `TextShapeInspector`: Text rendering properties
- `AudioSourceInspector`: Sound configuration
- `VideoPlayerInspector`: Video playback settings
- `NftShapeInspector`: NFT display configuration
- `AnimatorInspector`: Animation controls
- `PointerEventsInspector`: Interaction handling
- `CounterInspector`: Value tracking
- `VisibilityComponentInspector`: Display controls
- `MeshColliderInspector`: Collision properties
- `MeshRendererInspector`: Rendering settings

**Features:**

- Dynamically loads inspectors based on attached components
- Supports both single and multi-entity selection
- Implements basic/advanced view modes through `Config` component
- Uses React hooks for component state management

### Level Editor

3D scene visualization and manipulation:

- Integrates with the ECS engine for real-time updates
- Implements transform gizmos using Babylon.js (position, rotation, scale)
- Handles drag-and-drop through the DataLayer API
- Manages camera controls and viewport state using Babylon.js scene management
- Uses Babylon.js for 3D rendering and scene manipulation

### Asset Management

The Assets panel provides access to three main sources of content:

1. **Local Assets**

   - Shows project-specific resources (models, textures, sounds)
   - Provides direct access to files in the project's directory
   - Supports importing new assets from local filesystem
   - Manages asset organization within the project structure

2. **Custom Items**

   - Displays user-created reusable items
   - Items can be created by selecting entities in the scene
   - Stores items with their complete configuration (components, resources)
   - Supports operations like rename, delete, and reuse
   - Items can be either static or interactive (smart items)

3. **Asset Packs**

   - Provides access to official Decentraland items
   - Includes both static and smart items
   - Organized in themed collections (cyberpunk, fantasy, etc.)
   - Items are distributed via the `@dcl/asset-packs` package
   - Available through CDN at builder-items.decentraland.org

Additional functionality includes:

- Asset import interface for adding new resources
- Asset renaming capabilities
- Custom item creation workflow
- Drag-and-drop support for scene placement

# Integration Architecture

## Data Layer RPC

The Data Layer has two implementations:

1. **Local (In-Memory):**

   - Used for development and testing
   - Stores all state in memory
   - No network communication required
   - Fast and suitable for local development

2. **Remote (Protobuf):**
   - Used in production environments
   - Communicates over network using protobuf messages
   - Supports WebSocket transport
   - Enables integration with remote services

The Data Layer provides a complete interface for all editor operations, handling both scene state and asset management. It serves as the primary communication channel between the Inspector and its host environment, responsible for:

1. **Scene State Management:**

   - Maintains scene entity hierarchy and component data
   - Synchronizes state changes through CRDT streaming
   - Handles undo/redo operations
   - Manages scene saving and loading

2. **Asset Management:**
   - Creates and modifies custom items
   - Manages the asset catalog
   - Handles asset metadata and thumbnails
   - Controls asset lifecycle (create, rename, delete)

The Data Layer is implemented as a protobuf-defined RPC service to ensure type safety and versioning:

```protobuf
service DataService {
  // Scene state synchronization
  rpc CrdtStream(stream CrdtStreamMessage) returns (stream CrdtStreamMessage)

  // Asset management
  rpc CreateCustomAsset(CreateCustomAssetRequest) returns (CreateCustomAssetResponse)
  rpc GetCustomAssets(Empty) returns (GetCustomAssetsResponse)
  rpc GetAssetCatalog(Empty) returns (AssetCatalogResponse)
  rpc DeleteCustomAsset(DeleteCustomAssetRequest) returns (Empty)
  rpc RenameCustomAsset(RenameCustomAssetRequest) returns (Empty)

  // File operations
  rpc GetFiles(GetFilesRequest) returns (GetFilesResponse)
  rpc SaveFile(SaveFileRequest) returns (Empty)
  rpc GetFile(GetFileRequest) returns (GetFileResponse)
  rpc CopyFile(CopyFileRequest) returns (Empty)

  // Editor state
  rpc Undo(Empty) returns (UndoRedoResponse)
  rpc Redo(Empty) returns (UndoRedoResponse)
  rpc Save(Empty) returns (Empty)
}
```

### File System Interface

The File System Interface is a lower-level abstraction focused solely on file operations. It has three distinct implementations:

1. In-Memory ([`feeded-local-fs.ts`](https://github.com/decentraland/js-sdk-toolchain/tree/main/packages/@dcl/inspector/src/lib/data-layer/client/feeded-local-fs.ts)):

   - Uses Map data structures to store files in memory
   - Simulates a complete file system
   - Used for development and testing
   - No persistence between sessions

2. Node.js ([`sdk-commands/start/data-layer/rpc.ts`](https://github.com/decentraland/js-sdk-toolchain/tree/main/packages/@dcl/sdk-commands/src/commands/start/data-layer/rpc.ts)):

   - Direct implementation using Node.js `fs` module
   - Used by the CLI for local development
   - Handles file watching and hot reloading
   - Provides real filesystem access

3. IFrame ([`iframe-storage.ts`](https://github.com/decentraland/js-sdk-toolchain/tree/main/packages/@dcl/inspector/src/lib/logic/storage/iframe.ts)):
   - Uses mini-rpc library for communication
   - Delegates file operations to parent window through postMessage
   - Parent window implements actual storage:
     - Web Editor: Uses Builder Server API
     - Creators Hub: Uses Electron's Node.js `fs` module
   - Enables browser and desktop support through abstraction

The interface definition remains intentionally simple:

```typescript
export type FileSystemInterface = {
  dirname: (path: string) => string;
  basename: (filePath: string) => string;
  join: (...paths: string[]) => string;
  existFile: (filePath: string) => Promise<boolean>;
  readFile: (filePath: string) => Promise<Buffer>;
  writeFile: (filePath: string, content: Buffer) => Promise<void>;
  readdir: (
    dirPath: string
  ) => Promise<{ name: string; isDirectory: boolean }[]>;
  rm: (filePath: string) => Promise<void>;
  cwd: () => string;
};
```

### Additional RPCs

All additional RPCs are implemented using the [`@dcl/mini-rpc`](https://github.com/decentraland/mini-rpc) library, which provides type-safe client/server communication. These include:

1. Storage RPC: Implements the IFrame file system interface
2. Camera RPC: Controls viewport and screenshots
3. UI RPC: Manages Inspector UI state
4. Scene Metrics RPC: Reports scene statistics

Each RPC uses postMessage for transport in IFrame implementations and follows the mini-rpc pattern of:

- Type-safe method definitions
- Client/server architecture
- Event emission capabilities

### Relationship Between Layers

The Data Layer uses the File System Interface but adds:

- Scene-specific operations (CRDT streaming, undo/redo)
- Asset management (custom items, catalogs)
- Editor state management
- Higher-level abstractions for scene editing

Example:

- When creating a custom item, the Data Layer:
  1. Handles the item metadata and composition
  2. Uses the File System Interface to store resources
  3. Manages thumbnails and previews
  4. Updates the asset catalog

While the File System Interface would only handle the raw file operations without understanding the asset structure or scene context.

# Integration Points

## CLI Integration

The primary integration point is through the Decentraland CLI (`@dcl/sdk-commands`):

- Starts a local development server
- Creates a WebSocket server for the Data Layer
- Handles file watching and hot reloading
- Manages the scene's build process
- Provides the RPC server implementation for the Data Layer
- Implements a FileSystemInterface on top of NodeJS `fs`

### VSCode Extension

The VSCode extension is a separate product that:

- Uses the CLI as its backend server
- Launches the CLI's `start` command with the `--data-layer` flag
- Connects to the CLI's WebSocket server
- Embeds the Inspector in a VSCode webview
- Inherits all functionality through the CLI's server implementation

### Web Editor

The Web Editor integration:

- Embeds the Inspector in an IFrame within the web application
- Uses postMessage for RPC communication between Inspector and parent window
- Implements the FileSystemInterface server against the Builder Server's API:
  - File operations are translated to API calls
  - Assets and resources are stored in the Builder's backend
  - Handles user authentication and project permissions
- Provides custom UI controls through the UI RPC

### Creators Hub

The Creators Hub integration:

- Embeds the Inspector in an IFrame within the Electron application
- Uses postMessage for RPC communication between Inspector and parent window
- Implements the FileSystemInterface server using Electron's Node.js capabilities:
  - Direct access to local filesystem through Node.js `fs` module
  - Local storage of assets and resources
- Takes screenshots of the scene to generate thumbnails for the projects

# Consequences

## Positive

- Decoupled architecture through RPC interfaces
- Flexible backend implementations
- Consistent API across platforms
- Type-safe communication through protobuf

## Negative

- Complex RPC layer management
- Multiple transport mechanisms to maintain
- Potential version mismatches between implementations
- Performance overhead from RPC communication

# References

- [Decentraland SDK Repository](https://github.com/decentraland/js-sdk-tooling)
- [Inspector Package](https://github.com/decentraland/js-sdk-toolchain/tree/main/packages/@dcl/inspector)
