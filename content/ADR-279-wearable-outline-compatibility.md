---
adr: 279
date: 2025-01-13
title: Wearable Outline Compatibility Metadata
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - jhidalgo
---

## Context and Problem Statement

The `unity-explorer` client's avatar rendering system uses inverted face rendering for outlines in Medium/High quality settings. This creates conflicts with custom meshes that have manual outlines or inverted normals, resulting in incorrect rendering. Currently, there is no way to identify incompatible assets before they are rendered in `unity-explorer`, leading to visual artifacts and inconsistent appearance.

Key issues:
- Custom meshes with manual outlines conflict with the system outline rendering
- Inverted normal meshes render incorrectly with the outline pass
- No standardized way to identify outline-incompatible assets beforehand
- No metadata exists to flag rendering compatibility issues

## Proposed Solution

Add an `outlineCompatible` boolean field to the wearable configuration metadata to explicitly indicate whether a wearable is compatible with the system's outline rendering pass.

The wearable configuration schema will be extended as follows:

```typescript
type WearableConfiguration = {
  // ... existing fields ...
  data: {
    // ... existing data fields ...
    /** Indicates if the wearable is compatible with the outline rendering system */
    outlineCompatible: boolean
  }
}
```

Example wearable configuration with the new field:

```json
{
  "name": "Special Hat",
  "category": "hat",
  "data": {
    "replaces": [],
    "hides": ["hair"],
    "tags": ["special", "hat"],
    "outlineCompatible": true,
    "representations": [
      // ... representations ...
    ]
  }
}
```

### Benefits

1. **Clear Compatibility Indication**: Creators can explicitly specify if their wearable works with the outline system
2. **Prevention of Visual Artifacts**: Rendering systems can check compatibility before applying outline effects
3. **Better Creator Guidelines**: Clear documentation can be provided about outline compatibility requirements
4. **Future Extensibility**: Foundation for additional rendering compatibility flags if needed

## Technical Details

- The `outlineCompatible` field defaults to `true` if not specified
- When `false`, the renderer should skip outline processing for the wearable
- This metadata should be validated during the wearable upload process
- Existing wearables will need to be reviewed and updated with appropriate values

## Alternatives Considered

1. **Automatic Detection**: Analyzing mesh normals and geometry to detect compatibility automatically. Rejected due to complexity and potential inaccuracy.
2. **Runtime Switching**: Dynamically switching outline modes based on asset testing. Rejected due to performance implications.
3. **Complex Metadata Schema**: Including detailed information about mesh properties and rendering requirements. Rejected to maintain simplicity.

## Trade-offs

### Advantages
- Simple implementation
- Clear creator guidelines
- Minimal performance impact
- Easy to validate

### Disadvantages
- Requires manual specification by creators
- Existing wearables need updating
- Binary approach may not cover all edge cases

## Implementation Plan

1. Update wearable schemas to include the new field
2. Modify the Builder UI to expose the outline compatibility toggle
3. Update validation systems to handle the new field (Builder mainly, Catalyst will accept it)
4. Add documentation for creators about outline compatibility
5. Review and update existing wearables

## Future Considerations

- Potential expansion to include other rendering compatibility flags
- Tools to help creators test outline compatibility
- Analytics to track outline compatibility issues