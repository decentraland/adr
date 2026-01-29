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

The `unity-explorer` client currently derives a user’s displayed name by generating a random index in a predefined palette from the username's hashcode:

```c#
private static readonly Color DEFAULT_COLOR = Color.white;
private static IReadOnlyList<Color> nameColors = Array.Empty<Color>();

public static void SetNameColors(IReadOnlyList<Color> colors)
{
    nameColors = colors;
}

public static Color GetNameColor(string? username)
{
    if (nameColors.Count == 0 || string.IsNullOrEmpty(username)) return DEFAULT_COLOR;

    var rand1 = new Unity.Mathematics.Random((uint)username.GetHashCode());
    return nameColors[rand1.NextInt(nameColors.Count)];
}
```

This approach relies on the predefined palette and is platform-specific, i.e. [Unity.Mathematics.Random](https://docs.unity3d.com/Packages/com.unity.mathematics@1.3/api/Unity.Mathematics.Random.html).
Moreover, [String.GetHashCode](https://learn.microsoft.com/en-us/dotnet/api/system.string.gethashcode?view=net-10.0) is not stable, from the microsoft documentation:

*The hash code itself is not guaranteed to be stable. Hash codes for identical strings can differ across .NET implementations, across .NET versions, and across .NET platforms (such as 32-bit and 64-bit) for a single version of .NET. In some cases, they can even differ by application domain. This implies that two subsequent runs of the same program may return different hash codes.*

So this does not guarantee consistency across sessions.
It does not guarantee portability either, since another client has no way to guarantee the same palette implementation or hashcode generation.

Moreover it offers no agency to users who have claimed their name. As a result, users may be locked into a color they dislike, which negatively impacts personalization and satisfaction.

### Why this matters

- Claimed names are a premium feature and imply a higher degree of ownership.
- Lack of customization is a recurring source of minor user frustration.

### Solution

1. A new deterministic and portable algorithm to generate a username color.
2. Users with a claimed name can override the automatically generated nametag color by selecting a custom color through a dedicated UI flow. The chosen color is stored in the user profile and used consistently across sessions and clients that support the feature.
3. Users with no claimed name (or with no username color defined) will fallback to the aforementioned algorithm for generation.

## Solution Space Exploration

<!--
Discuss the potential alternatives and their impact. What alternatives are being considered, their benefits, their costs (team resources, money, time frames), and mitigations for any drawbacks.
-->

1. Algorithm changes
  - Stable hash generation
  - Portable (no platform-specific code)
  - Self-contained (no color palette dependency)

2. UI changes
  - Add a color picker available only to users with a claimed name

3. Color logic
  - Adjustable Hue value.
  - Saturation and Value are fixed to 0.75 and 1.0 respectively.
  - This constraint ensures sufficient contrast against the black nametag background and avoids unreadable colors.

4. Preview and persistence
  - Color changes are reflected in real time as a way for the user to preview them before submitting.

5. Data model changes
  - Introduce a new nullable `nameColor` member of type `Color3` (no alpha value) to the `Avatar` schema.
  - If `nameColor` is present:
    - Deserialize it into a Color struct.
  - If `nameColor` is absent:
    - Fall back to the existing deterministic color generation algorithm.

### Consequences & Considerations

- The `unity-explorer` client enforces fixed Saturation and Value when writing Profile.nameColor.
- Other clients may choose to allow arbitrary color values.
- Consumers of this `nameColor` must therefore not assume constrained HSV values and should treat the color as arbitrary RGBA input.

## Specification

<!--
The technical specification should describe the syntax and semantics of any new feature.
-->

1. New color generation algorithm: self-contained, platform-agnostic and stable. 
Makes use of the FNV-1a algorithm to allow for a well-distributed hash (small changes in the string produce large changes in the hash) and only uses 32-bit unsigned arithmetic.
`Color` and `Color.HSVToRGB` ARE unity-dependent but that is negligible since this can be replicated deterministically on any platform-specific implementation.

```c#
private static readonly Color DEFAULT_COLOR = Color.white;
private static readonly float DEFAULT_SATURATION = .75f;
private static readonly float DEFAULT_VALUE = 1f;

/// <summary>
/// Generates a deterministic Unity <see cref="Color"/> for a given username.
/// </summary>
/// <returns>
/// A <see cref="Color"/> object derived deterministically from the username.
/// If the username is null or empty, <see cref="DEFAULT_COLOR"/> (white) is returned.
/// </returns>
public static Color GetNameColor(string? username)
{
    if (string.IsNullOrEmpty(username))
        return DEFAULT_COLOR;

    uint hash = GetStableHashFNV1a(username);

    float hue = (float)hash / uint.MaxValue;

    return Color.HSVToRGB(hue, DEFAULT_SATURATION, DEFAULT_VALUE);
}

/// <summary>
/// Computes a deterministic, platform-agnostic 32-bit hash for a string using the FNV-1a algorithm.
/// The hash is well-spread, small changes in the string produce large changes in the hash.
/// </summary>
/// <returns>
/// A <see cref="uint"/> representing the stable hash of the input string.
/// </returns>
private static uint GetStableHashFNV1a(string s)
{
    const uint FNV_OFFSET_BASIS = 2166136261u;
    const uint FNV_PRIME = 16777619u;

    uint hash = FNV_OFFSET_BASIS;

    for (int i = 0; i < s.Length; i++)
    {
        hash ^= s[i];
        hash *= FNV_PRIME;
    }

    return hash;
}
```

2. Addition of the `nameColor` member to the profile:

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
                "b": 0.458823532
            },
            ...
        }
    ]
}
```

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
