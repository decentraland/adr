---
layout: adr
slug: adr/ADR-11
adr: 11
date: 2020-10-26
title: Add version to content-as-bundle URL
excerpt_separator: <!--more-->
authors:
  - menduz
  - eordano
---

## Context and Problem Statement

The URL for the asset bundles (Unity) are created using the content-server hash of the original GLTF. Therefore, the generated contents may not be immutable, because the asset bundle generator may have bugs or upgrades.

<!--more-->

## Decision Outcome

Prepend `/v1` to the original content-as-bundle URL pathname.

```yaml
Old: https://content-assets-as-bundle.decentraland.org/QmfNvE3nKmahA5emnBnXN2LzydpYncHVz4xy4piw84Er1D
New: https://content-assets-as-bundle.decentraland.org/v1/QmfNvE3nKmahA5emnBnXN2LzydpYncHVz4xy4piw84Er1D
```

The current (unversioned) URL must continue working.

## Participants

- Esteban Ordano
- Agustin Mendez
