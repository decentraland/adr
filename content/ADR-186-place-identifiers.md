---
layout: adr
adr: 186
title: Place Identifiers
date: 2023-02-06
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - 2fd
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

This document describes how the ID (which is an UUID) of a Place is defined and the semantics to keep or replace it if the deployments of its parcels change. In many conditions deployments of new parcels won't modify the ID of the Place, other conditions are enumerated.

## Context

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

As the platform and the protocol are growing, a few initiatives like the possibility to save, rank and recommend scenes are becoming essential tools to strengthen the social interaction and discoverability in Decentraland. But, each new scene deployed has a new entity id in the Catalyst Network, which would reset every time that the scene could collect on each deployment.

The next approach was to track only *x,y* positions, but since a scene can grow, shrink, and change shape, this could result in misleading behavior for our users when, suddenly, a position they were already keeping track is not the scene they were following.

Instead of the previously mentioned approach, we will assign a virtual UUID to each new deployment and use a set of rules detailed in the following section to determine if this new deployment corresponds to the same place or to a new one, in which case a new virtual ID will be assigned.

## Specification

A Place is defined as a scene occupying a set of positions, each new deploy on an empty set of lands will receive a new virtual UUID.

When a new deployment replaced an already existing scene it will keep the same virtual UUID if [the scene metadata](https://docs.decentraland.org/creator/development-guide/scene-metadata/#scene-parcels) meets one of the following criteria:

- the new scene parcels contain every parcel in the previous scene
- the new scene base parcel is the same as the previous one

### Case 1: new scene occupying the exact same number parcels

<table>
  <tr>
    <td style="vertical-align: middle">
      <img alt="deploy" src="/resources/ADR-186/deploy.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">✅ The new scene gets the <strong>same UUID</strong> if occupy the same parcel</td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="deploy+base" src="/resources/ADR-186/deploy+base.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ✅ The new scene gets the <strong>same UUID</strong> if occupy the same parcel, even if
      it has a different base parcel
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="move" src="/resources/ADR-186/move.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ❌ The new scene gets a <strong>new UUID</strong> if doesn't occupy the same parcels
      and same base parcel
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="move+same-base" src="/resources/ADR-186/move+same-base.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ✅ The new scene gets the <strong>same UUID</strong> if it doesn't occupy the same parcel
      but preserves the same base parcel
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="re-shape" src="/resources/ADR-186/re-shape.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ✅ The new scene gets the <strong>same UUID</strong> if it doesn't occupy the same parcel
      but preserves the same base parcel
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="re-shape+base" src="/resources/ADR-186/re-shape+base.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ❌ The new scene gets a <strong>new UUID</strong> if it doesn't occupy the same parcels
      and same base parcel
    </td>
  </tr>
</table>

### Case 2: Scene growing on the number of parcels

<table>
  <tr>
    <td style="vertical-align: middle">
      <img alt="grow" src="/resources/ADR-186/grow.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ✅ The new scene gets the <strong>same UUID</strong> if occupy all previous parcels +
      any additional one
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="grow+base" src="/resources/ADR-186/grow+base.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ✅ The new scene gets the <strong>same UUID</strong> if it occupies all previous parcels +
      any additional one, even if it has a different base parcel
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="grow+move+base" src="/resources/ADR-186/grow+move+base.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">✅ The new scene gets the <strong>same UUID</strong> if it has same base parcel</td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="grow+move" src="/resources/ADR-186/grow+move.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ❌ The new scene gets a <strong>new UUID</strong> if it doesn't occupy all previous
      parcels and has different base parcel
    </td>
  </tr>
</table>

### Case 3: Scene shrinking on the number of parcels

<table>
  <tr>
    <td style="vertical-align: middle">
      <img alt="shrink" src="/resources/ADR-186/shrink.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ✅ The new scene gets the <strong>same UUID</strong> if it has the same base parcel
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="shrink+base" src="/resources/ADR-186/shrink+base.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ❌ The new scene gets a <strong>new UUID</strong> if it has a different base parcel
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="shrink+move" src="/resources/ADR-186/shrink+move.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ❌ The new scene gets a <strong>new UUID</strong> if it has a different base parcel
    </td>
  </tr>
  <tr>
    <td style="vertical-align: middle">
      <img alt="shrink+move+base" src="/resources/ADR-186/shrink+move+base.png" width="300" hight="300" />
    </td>
    <td style="vertical-align: middle">
      ✅ The new scene gets the <strong>same UUID</strong> if it has the same base parcel
    </td>
  </tr>
</table>



<!--
The technical specification should describe the syntax and semantics of any new feature.
-->

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
