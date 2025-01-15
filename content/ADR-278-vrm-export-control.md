---
adr: 278
date: 2025-01-13
title: VRM Export Control for Wearables
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - jhidalgo
---

## Context and Problem Statement

The Explorer's VRM export feature allows users to export their avatars for use in other platforms. However, this creates potential issues:

- Some creators want to restrict their wearables from being exported
- Brand assets may only be licensed for use within Decentraland
- No mechanism exists to control VRM export permissions per wearable

## Proposed Solution

Add a `blockVrmExport` boolean field to the wearable configuration metadata to explicitly indicate whether a wearable can be exported as VRM.

The wearable configuration schema will be extended as follows:

```typescript
type WearableConfiguration = {
  // ... existing fields ...
  data: {
    // ... existing data fields ...
    /** Indicates if VRM export should be blocked for this wearable */
    blockVrmExport: boolean
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
    "blockVrmExport": false,
    "representations": [
      // ... representations ...
    ]
  }
}
```

### Implementation Details

- The `blockVrmExport` field defaults to `false` if not specified (allowing VRM export by default)
- When `true`, the Explorer will prevent VRM export of any avatar wearing this item
- The field will be included in the wearable metadata stored in Catalyst
- The UI will show a tooltip explaining why VRM export is blocked when attempted

## Technical Details

- Field stored in Catalyst as part of wearable metadata
- Explorer must check all equipped wearables before allowing VRM export
- UI feedback required when export is blocked
- Value is set during wearable deployment and requires a new content submission to update

## Alternatives Considered

1. **Smart Contract Storage**: Storing the flag in item metadata on-chain. Rejected due to:
   - Requires transactions for updates
   - Needs curator review for changes
   - Increased complexity for simple permission

2. **Collection-Level Control**: Setting export permission at collection level. Rejected because:
   - Less granular control
   - Doesn't address mixed-use cases within collections

3. **Whitelist System**: Explicit allowlist for VRM export. Rejected due to:
   - Additional complexity
   - Default-deny would break existing use cases

## Trade-offs

### Advantages
- Simple implementation
- Easy to update
- Granular per-wearable control
- Consistent with other wearable metadata storage
- Clear user feedback

### Disadvantages
- Requires content update to change settings
- Less flexible than database storage
- Additional UI complexity in Builder
- Potential user confusion about blocked exports

## Implementation Plan

1. Update wearable metadata schema
2. Add UI controls in Builder wearable submission
3. Modify Explorer VRM export to check permissions
4. Add user feedback for blocked exports
5. Update documentation for creators

## Future Considerations

- Analytics tracking for export blocks
- Potential for time-based export restrictions
- Integration with licensing system
- Expansion to other export formats 