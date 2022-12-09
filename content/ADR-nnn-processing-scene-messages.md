---
layout: adr
adr: 0
title: Process scene messages
date: 2022-12-08
status: Idea
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

This document describes alternatives to synchronize scenes and renderers using the CRDT protocol. The document also presents the problem of dropped frames and frame-delay between the renderer and the scene. It describes the sequencing and locks of the scene loop and the render frame of the renderer to optimize interactivity. An implementation similar to "double buffering" is chosen.

## Context, Reach & Prioritization

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

Decentraland scenes run in contexts isolated from the rendering engine (_renderer_ from now on), in a worst case scenario, in a different process only being able to communicate via messaging. Since scenes have an independent update loop (_game loop_ from now on) clear synchronization points need to be designed to reach consistent states between the renderer and the scene.

The problem to solve has many dimensions:
- Dropping frames
- Input delay (amount of frames between the interaction and the effect)


## Solution Space Exploration

<!--
Discuss the potential alternatives and their impact. What alternatives are being considered, their benefits, their costs (team resources, money, time frames), and mitigations for any drawbacks.
-->

Discuss the potential alternatives and their impact. What alternatives are being considered, their benefits, their costs (team resources, money, time frames), and mitigations for any drawbacks.

## Specification

<!--
The technical specification should describe the syntax and semantics of any new feature.
-->

The technical specification should describe the syntax and semantics of any new feature.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
