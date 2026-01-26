---
layout: adr
adr: 292 # replace this number for the PR or ISSUE number
title: Customize Nametag Color
date: 2026-01-23
status: Draft # pick one of these
type: Standards Track # pick one of these
spdx-license: CC0-1.0
authors:
  - Maurizio-dcl # this is your github username
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

This ADR proposes allowing users with a claimed name to customize the color of their nametag. The selected color is persisted in the user profile and overrides the currently deterministic, username-based color generation. To preserve readability against the black nametag background, color selection is limited to a fixed Saturation and Value, with only Hue being adjustable.

## Context, Reach & Prioritization

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

### Background

The `unity-explorer` client currently derives a user’s displayed name color deterministically from the username.
This approach guarantees consistency across sessions, but offers no agency to users who have claimed their name. As a result, users may be locked into a color they dislike, which negatively impacts personalization and satisfaction.

### Why this matters

- Claimed names are a premium feature and imply a higher degree of ownership.
- Lack of customization is a recurring source of minor user frustration.

### Solution

Users with a claimed name can override the automatically generated nametag color by selecting a custom color through a dedicated UI flow. The chosen color is stored in the user profile and used consistently across sessions and clients that support the feature.

## Solution Space Exploration

<!--
Discuss the potential alternatives and their impact. What alternatives are being considered, their benefits, their costs (team resources, money, time frames), and mitigations for any drawbacks.
-->

1. UI changes
  - Add a color picker available only to users with a claimed name

2. Color picker behavior
  - Adjustable Hue value via a slider.
  - Saturation and Value are fixed to 0.75 and 1.0 respectively.
  - This constraint ensures sufficient contrast against the black nametag background and avoids unreadable colors.

3. Preview and persistence
  - Color changes are reflected in real time on:
    - The Passport animated background, and
    - The displayed username.

4. Data model changes
  - Introduce a new nullable `nameColor` field in the Profile JSON.
  - Structure mirrors existing color fields (e.g. /avatar/eyes/color/):
  ```json
  "eyes": {
      "color": {
          "r": 0.282352954,
          "g": 0.8627451,
          "b": 0.458823532,
          "a": 1
      }
  },
  ```
  - If nameColor is present:
    - Deserialize it into a Color struct.
  - If nameColor is absent:
    - Fall back to the existing deterministic color generation algorithm.

### Consequences & Considerations

- The `unity-explorer` client enforces fixed Saturation and Value when writing Profile.nameColor.
- Other clients may choose to allow arbitrary color values.
- Consumers of this `nameColor` must therefore not assume constrained HSV values and should treat the color as arbitrary RGBA input.

## Specification

<!--
The technical specification should describe the syntax and semantics of any new feature.
-->

Addition of the `nameColor` member to the profile:

```json
{
    "timestamp": 1769177574610,
    "avatars": [
        {
            ...
            "name": "Nebi",
            "nameColor": {
                "r": 0.282352954,
                "g": 0.8627451,
                "b": 0.458823532,
                "a": 1
            },
            ...
        }
    ]
}
```

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
