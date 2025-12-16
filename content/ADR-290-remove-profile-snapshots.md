---
layout: adr
adr: 290
title: Remove Profile Snapshots
date: 2025-11-10
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - LautaroPetaccio
  - pentreathm
---

## Abstract

This ADR proposes the deprecation and eventual removal of the snapshots from profile entities. The change will be implemented in two phases: first, making the snapshot property and its related files optional for profile deployments, and second, rejecting any profile deployment that includes the snapshot property or any content files after a three-month transition period. This change is enabled by the profile-images service, which generates these images on demand for official Catalyst in the DAO, eliminating the need for clients to upload them during profile deployment.

## Context, Reach & Prioritization

Profile entities currently require clients to upload snapshot images (`face256.png` and `body.png`) as part of the deployment process, as specified in [ADR-51](/adr/ADR-51) and [ADR-158](/adr/ADR-158). These validations ensure that profile deployments include these image files in their content.

However, this approach has several drawbacks:

1. **Storage inefficiency**: Requiring every profile to store snapshot images significantly increases storage requirements across all Catalyst nodes. With an unbounded amount of profiles, this adds up to substantial storage costs.

2. **Consistency issues**: Different clients may generate and upload different profile images for the same avatar configuration. This can lead to inconsistent representations of the same user across different platforms and applications.

3. **Security concerns**: The current validation only checks that uploaded images meet the format and size requirements defined in [ADR-51](/adr/ADR-51). Any image that matches these criteria (256x256 PNG for face, valid PNG for body) can be deployed, even if it doesn't accurately represent the user's actual avatar. This allows users to upload arbitrary images that may not match their 3D avatar configuration.

The profile image generation will be leveraged by each client, considering all the information to generate them is available on the content server, giving them the ability to build the most suitable snapshots depending on their needs. The reference client will make use of the centralized [profile-images service](https://github.com/decentraland/profile-images) which automatically generate these snapshot images and feeds them through the catalysts lambdas profile endpoint.

This decision is important because it:

- Reduces infrastructure costs by eliminating redundant storage
- Removes inconsistency across all profile image representations
- Improves security by preventing arbitrary image uploads
- Simplifies the profile deployment process for developers

### Timeline

```
ADR_290_PHASE_1_TIMESTAMP = 1731283200000  // 2025-11-11T00:00:00Z (Day after ADR publication)
ADR_290_PHASE_2_TIMESTAMP = 1739059200000  // 2026-02-09T00:00:00Z (3 months after Phase 1)
```

### Phase 1: Optional Snapshots

Starting from `ADR_290_PHASE_1_TIMESTAMP`, the following changes MUST be implemented:

#### Profile Images, Files and Metadata Validation Updates

The [PROFILE THUMBNAIL] and [PROFILE FILES] validations defined in [ADR-51](/adr/ADR-51) MUST be updated as follows:

```
1. If deployment.timestamp <= ADR_290_PHASE_1_TIMESTAMP
   - Apply original validation rules

2. If deployment.timestamp > ADR_290_PHASE_1_TIMESTAMP AND deployment.timestamp < ADR_290_PHASE_2_TIMESTAMP
   - If deployment.content.length > 0, apply original validation rules
   - If deployment.files.size > 0, apply original validation rules
   - If profile.metadata.avatars[].avatar.snapshots is present, apply original validation rules
   - If any of the conditions above is not met, the validations are not applied
```

### Phase 2: Reject Snapshots

Starting from `ADR_290_PHASE_2_TIMESTAMP`, the validation updates for the profile entities done in the Phase 1 MUST be changed to:

```
1. If deployment.timestamp > ADR_290_PHASE_2_TIMESTAMP
  - If deployment.content.length > 0, reject the deployment
  - If deployment.files.size > 0, reject the deployment
  - If profile.metadata.avatars[].avatar.snapshots is present, reject the deployment
```

As an example, a valid deployed entity MUST be of the form:

```json
{
  // Empty contents array
  "content": [],
  "metadata": {
    "avatars": [
      {
        // ... Rest of a valid avatar
        "avatar": {
          // No snapshot property in the avatar property
          "bodyShape": "urn:decentraland:off-chain:base-avatars:BaseMale",
          "eyes": {
            "color": {
              "r": 100,
              "g": 100,
              "b": 100
            }
          },
          "hair": {
            "color": {
              "r": 100,
              "g": 100,
              "b": 100
            }
          },
          "skin": {
            "color": {
              "r": 100,
              "g": 100,
              "b": 100
            }
          },
          "wearables": [],
          "forceRender": [],
          "emotes": []
        }
      }
    ]
  }
}
```

And MUST not include any type of files along the deployment.

### Client Updates

All clients that deploy profile entities MUST be updated before `ADR_290_PHASE_2_TIMESTAMP` to:

1. Remove snapshot generation code
2. Remove `snapshots` property from profile metadata
3. Stop including `face256.png` and `body.png` in profile deployments
4. Use the profile-images service endpoints for retrieving profile images

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
