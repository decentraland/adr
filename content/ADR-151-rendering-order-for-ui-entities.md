---
layout: adr
adr: 151
title: Rendering order for UI entities
date: 2022-12-14
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

This document describes a UI system in which entities are derived from a synthetic tree and rendered using pre-order sequencing. The rendering process allows for the configuration of stencils to control which parts of a parent entity are visible. The default behavior is to render children in full, even if they extend beyond the borders of the parent. This system is similar to how HTML, ReactNative, and Unity's UiToolkit handle rendering.

## Specification

The UI entities in this system are derived from a synthetic tree of entities defined by the UiTransformComponent ([ADR-124](/adr/ADR-124)). This tree must be rendered using a pre-order sequencing, with children overwriting the pixels of the parent in the rendering process. This behavior is similar to how HTML, ReactNative, and Unity's UiToolkit handle rendering by default.

It is REQUIRED to be able to configure entities to act as stencils, so that only the content within the borders of the parent entity is rendered. By default, children must be rendered in full (without stencils), even if they extend beyond the borders of the parent. This stencil behavior is analogous to the `overflow: hidden` CSS property.

> TODO: create ADR for UiOverflowMode component

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
