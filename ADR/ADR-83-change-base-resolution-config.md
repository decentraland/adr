---
layout: doc
adr: 83
date: 2022-10-07
title: Changing "Base resolution" configuration for web
status: PROPOSED
authors:
  - axiaCode
  - menduz
  - ShibuyaMartin
---

## Context of the problem

Resolution settings for Decentraland Web are configured in two ways:
- **Base resolution**: The size (height) of the HTML canvas
- **Rendering scale**: The size of the GL front bufffer

Individually, both have the same visual effect: lowering the resolution of the final rendered image.

The problem of this ADR is that "Base resolution" options are not standard and have nothing to do with the actual effect they are producing:
- Match 720p
- Match 1080p
- Unlimited

The following graph contains the percentiles of the frame rates of all web sessions. The cyan line marks a testing moment in which all sessions got a "unlimited" rendering resolition, matching their systems DPI. Prior to that line, all sessions were using a Low DPI setting. In which one canvas pixel represents one pixel of the screen.

![](/resources/ADR-83/percentiles.png)

The following graph shows the average of all FPS for the same conditions

![](/resources/ADR-83/fps.png)

## Alternatives

### Alternative 1 ✅

The proposal is to replace the **Base resolution** by **Resolution** and the options **Low DPI** (1) and **Match display DPI** (x>=1)

### Alterlative 2

Force low DPI (1) for Web, enabling only high DPI rendering on the native app. Keeping **Rendering scale** as the only configurable setting.

## Final decision

replace the **Base resolution** by **Resolution** and the options **Low DPI** (1) and **Match display DPI** (x>=1)