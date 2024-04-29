---
layout: adr
adr: 246
title: Update Max Size for Skins and Thumbnail Validation for Wearables
date: 2024-04-23
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
- braianj
---

## Background and Objective

The current specifications for wearable sizes, as defined in ADR-45, set a limit of 2MB for the total size of most wearables, including their thumbnails. However, with the need to adjust the size limit for the category "Skins" and to provide a comprehensive size limit for all wearables, including Skins and their associated thumbnails, it's necessary to update the existing specifications.

## Decision

### Max Size

1. **Wearables (excluding Skins):** The total size of any wearable, excluding Skins, shall not exceed 3MB, which includes all associated files like thumbnail and image with rarity background.
2. **Skins:** The category "Skins" will have a separate max size of 9MB, which includes all associated files like thumbnail and image with rarity background.

These changes supersede the previous size limitations specified in [ADR-45](/adr/ADR-45) and [ADR-51](/adr/ADR-51) .

