---
adr: 281
date: 2025-01-16
title: Items in Decentraland tooling
authors:
  - cazala
status: Final
type: Standards Track
spdx-license: CC0-1.0
---

# Abstract

This document describes the Items abstraction in Decentraland tooling, which provides a way to add pre-configured entities with components into scenes through a drag-and-drop interface, without requiring coding knowledge.

# Context

Decentraland provides an Entity Component System (ECS) SDK for building interactive scenes. Items are an abstraction built on top of this ECS system, allowing creators to easily add pre-configured entities with components into their scenes through a drag-and-drop interface, without requiring coding knowledge. When an item is dropped into a scene, it creates one or more entities and applies the appropriate components to them.

# Types of Items

## Static Items

Basic 3D models with no interactive behavior, including but not limited to:

- Building elements: windows, doors, beams, decks, fences
- Furniture: chairs, tables, beds, benches, drawers
- Nature: trees, plants, mountains, terrain variations
- Decorative: vases, lamps, statues, cultural items
- Infrastructure: train tracks, mine carts, street elements
- Materials: wood, stone, metal, glass variations
- Props: books, tools, weapons, musical instruments

### Smart Items

Interactive items with programmable behaviors, primarily defined through actions and triggers. They can include various types:

- Interactive objects (e.g., "Wooden Door" with open/close actions)
- Media items (e.g., Custom Text, Image, Video items)
- Game elements (e.g., Health Bar with state management)

Smart items typically include:

- Predefined actions (e.g., toggle, play animation)
- Trigger conditions
- State management
- User interaction handling

### Custom Items

User-created items that can be either static or interactive, allowing creators to:

- Create reusable components from existing entities
- Share and reuse complex setups
- Maintain consistency across scenes

## Item Sources

### Asset Packs Repository

- Central storage for default items and smart items ([asset-packs repository](https://github.com/decentraland/asset-packs))
- Organized in themed collections (cyberpunk, fantasy, etc.)
- Distributed via npm package `@dcl/asset-packs`
- Accessible through CDN at builder-items.decentraland.org

Custom items can be added to the default asset-packs registry by copying their folder and contents from the custom items folder into the appropriate asset-pack folder in the [asset-packs repository](https://github.com/decentraland/asset-packs).

### Custom Items Storage

Custom items are stored locally with the following structure:

```
custom/
  item-name/
    data.json      # metadata
    composite.json # entity data
    thumbnail.png  # preview image
    resources/     # associated assets (models, textures, etc.)
```

## Technical Implementation

### Composites

Items are defined using composites - a versioned collection of components and their values:

```typescript
interface Composite {
  version: number;
  components: Array<{
    name: string;
    data: {
      [entityId: string]: {
        json: any;
      };
    };
  }>;
}
```

### ID Mapping System

When instantiating items, the system handles entity references through special notation:

- `{self}` references the self entity once instantiated in runtime
- `{self:componentName}` (e.g., `{self:Actions}`) references a component in the self entity
- `{entityId:componentName}` (e.g., `{512:Actions}`) references a component on another entity by their composite ID (which differs from runtime ID)

### Resource Path Management

- Resources are stored with relative paths
- Uses `{assetPath}` notation for template paths
- Automatically maps paths during instantiation
- Components can have resources in arbitrary properties at any nesting level
- Requires manual tracking of which properties contain resources

### Custom Item Creation

The process involves:

1. Selecting existing entities in the scene
2. Creating a composite from the selection
3. Processing and copying all required resources
4. Generating metadata and thumbnails
5. Storing the item in the custom items directory

## Usage

### Library Integration

Items are available through a drag-and-drop interface where users can:

- Browse available items by category
- Preview items before placement
- Drag items directly into the scene
- Configure smart item properties

### Instantiation

When an item is added to a scene:

1. The composite is loaded
2. New entities are created
3. Components are instantiated with proper references
4. Resources are loaded with correct paths
5. For smart items, behaviors are initialized

## Consequences

### Positive

- Reusable components improve scene creation efficiency
- Smart items enable non-technical users to add complex interactions
- Custom items allow sharing of complex setups
- Standardized storage format ensures compatibility

### Negative

- Resource management adds significant complexity:
  - Properties containing resources can be nested at any level
  - No standard way to identify resource properties
  - New SDK components with resource fields require manual tracking
  - Resource copying and path mapping needs careful handling
- Multiple item sources require consistent handling

# References

- [Decentraland Asset Packs Repository](https://github.com/decentraland/asset-packs)
- [Decentraland SDK Repository](https://github.com/decentraland/js-sdk-tooling)
