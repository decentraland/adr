---
layout: adr
adr: 186
title: Place Identifiers
date: 2023-02-06
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - frami (2fd)
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

This document describe how a Places is defined and when a new Place is created and replace and existing one.

## Context

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

As the platform and the protocol is growing, a few initiatives like the possibility to save, rank and recommend scenes are becoming essential tools to potent the social interaction and discoverability in Decentraland. But, each new scene deploy generates a new ID in the catalyst which would reset every that the scene could collect on each deployment.

The next approach was to track only *x,y* positions, but since a scene can grow, shrink, and change shape, this could result in misleading behavior for our users when, suddenly, a position they were already keeping track is not the scene they were following.

Instead of the previously mentioned, we will assign a virtual UUID to each new deployment and use a set of rules detailed in the following section to determine if this new deployment corresponds to the same place or to a new one, in which case a new virtual ID will be assigned

## Specification

A Place is defined as an scene occupying a set of positions, each new deploy on an empty set of lands will receive a new virtual UUID.

When a new deployment replaced an already existing scene it will keep the same virtual UUID if [the scene metadata](https://docs.decentraland.org/creator/development-guide/scene-metadata/#scene-parcels) meet one of the following requirements:

- the new scene parcels contains every parcel in the previous scene
- the new scene base parcel is the same that the previous scene

### Case 1: new scene occupying the exact same number parcels

<table>
<tr><td><img alt="deploy" src="/resources/ADR-186/deploy.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if occupy the same parcel  </td></tr>
<tr><td><img alt="deploy+base" src="/resources/ADR-186/deploy+base.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if occupy the same parcel, even if it has a different base parcel </td></tr>
<tr><td><img alt="move" src="/resources/ADR-186/move.png" width="400" hight="400" /></td><td>❌ The new scene gets a **new UUID** if doesn't occupy the same parcels and same base parcel </td></tr>
<tr><td><img alt="move+same-base" src="/resources/ADR-186/move+same-base.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if doesn't occupy the same parcel but preserves the same base parcel </td></tr>
<tr><td><img alt="re-shape" src="/resources/ADR-186/re-shape.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if doesn't occupy the same parcel but preserves the same base parcel </td></tr>
<tr><td><img alt="re-shape+base" src="/resources/ADR-186/re-shape+base.png" width="400" hight="400" /></td><td>❌ The new scene gets a **new UUID** if doesn't occupy the same parcels and same base parcel </td></tr>
</table>

### Case 2: Scene growing on the number of parcels

<table>
<tr><td><img alt="grow" src="/resources/ADR-186/grow.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if occupy all previous parcels + any additional one </td></tr>
<tr><td><img alt="grow+base" src="/resources/ADR-186/grow+base.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if occupy all previous parcels + any additional one, even if it has a different base parcel</td></tr>
<tr><td><img alt="grow+move+base" src="/resources/ADR-186/grow+move+base.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if it has same base parcel</td></tr>
<tr><td><img alt="grow+move" src="/resources/ADR-186/grow+move.png" width="400" hight="400" /></td><td>❌ The new scene gets a **new UUID** if it doesn't occupy all previous parcels and has different base parcel</td></tr>
</table>

### Case 3: Scene shrinking on the number of parcels

<table>
<tr><td> <img alt="shrink" src="/resources/ADR-186/shrink.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if it has the same base parcel  </td></tr>
<tr><td> <img alt="shrink+base" src="/resources/ADR-186/shrink+base.png" width="400" hight="400" /></td><td>❌ The new scene gets a **new UUID** if it has a different base parcel </td></tr>
<tr><td> <img alt="shrink+move" src="/resources/ADR-186/shrink+move.png" width="400" hight="400" /></td><td>❌ The new scene gets a **new UUID** if it has a different base parcel  </td></tr>
<tr><td> <img alt="shrink+move+base" src="/resources/ADR-186/shrink+move+base.png" width="400" hight="400" /></td><td>✅ The new scene gets the **same UUID** if it has the same base parcel </td></tr>
</table>


<!--
The technical specification should describe the syntax and semantics of any new feature.
-->

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
