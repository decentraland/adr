---
adr: 124
title: Implementing flexbox-based UI for scenes
date: 2022-05-11
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

This document describes the approach used to implement UI components and semantics for the SDK version 7. Flexbox is used due to its market adoption and availability of implementations and documentation and expertise. This change breaks compatibility with SDK6 and there is no way to create an adaptation layer for both SDKs.

## Context, Reach & Prioritization

The current UI elements have proven themselves useful, but those are bound to Unity's assumptions for UI elements i.e. anchor points. And those assumptions not only make the current UI components hard to port to other engines, they require the creators to understand the limitations and design decisions of Unity to produce usable UIs.

## Solution Space Exploration

The new UI layouting system of the SDK for the Decentraland Protocol will be based out of FlexBox. That is a bold change that will break compatibility with previous versions of the UI for better portability and standardization.

Flexbox is the next-gen layouting system used mainly in web applications, it is an open and mature standard that is not only used by web browsers but also by native applications and even operative systems. i.e. ReactNative and [Unity's UI Toolkit](https://docs.unity3d.com/Manual/UIE-LayoutEngine.html) use flexbox for its layouts.

A big win for this decision is that moving away from the legacy Unity-based layouts will enable easier portability of the renderer to other technologies thanks to [yoga layout](https://yogalayout.com/playground/?eyJ3aWR0aCI6NTAwLCJoZWlnaHQiOjUwMCwibWluV2lkdGgiOm51bGwsIm1pbkhlaWdodCI6bnVsbCwibWF4V2lkdGgiOm51bGwsIm1heEhlaWdodCI6bnVsbCwiYWxpZ25JdGVtcyI6MSwicGFkZGluZyI6eyJ0b3AiOiIyMCIsInJpZ2h0IjoiMjAiLCJib3R0b20iOiIyMCIsImxlZnQiOiIyMCJ9LCJwb3NpdGlvbiI6eyJ0b3AiOm51bGwsInJpZ2h0IjpudWxsLCJib3R0b20iOm51bGwsImxlZnQiOm51bGx9LCJjaGlsZHJlbiI6W3sid2lkdGgiOjEwMCwiaGVpZ2h0IjoxMDAsIm1pbldpZHRoIjpudWxsLCJtaW5IZWlnaHQiOm51bGwsIm1heFdpZHRoIjpudWxsLCJtYXhIZWlnaHQiOm51bGwsInBvc2l0aW9uIjp7InRvcCI6bnVsbCwicmlnaHQiOm51bGwsImJvdHRvbSI6bnVsbCwibGVmdCI6bnVsbH19LHsid2lkdGgiOiIxMDAlIiwiaGVpZ2h0IjoiMTAwJSIsIm1pbldpZHRoIjpudWxsLCJtaW5IZWlnaHQiOm51bGwsIm1heFdpZHRoIjpudWxsLCJtYXhIZWlnaHQiOm51bGwsImp1c3RpZnlDb250ZW50IjoxLCJhbGlnbkl0ZW1zIjoyLCJhbGlnblNlbGYiOjIsImFsaWduQ29udGVudCI6MiwibWFyZ2luIjp7InJpZ2h0IjoiMjAiLCJsZWZ0IjoiMjAifSwicG9zaXRpb24iOnsidG9wIjoiNSUiLCJyaWdodCI6bnVsbCwiYm90dG9tIjoiMTAlIiwibGVmdCI6bnVsbH0sImZsZXhHcm93IjoiMSJ9LHsid2lkdGgiOjEwMCwiaGVpZ2h0IjoxMDAsIm1pbldpZHRoIjpudWxsLCJtaW5IZWlnaHQiOm51bGwsIm1heFdpZHRoIjpudWxsLCJtYXhIZWlnaHQiOm51bGwsInBvc2l0aW9uIjp7InRvcCI6bnVsbCwicmlnaHQiOm51bGwsImJvdHRvbSI6bnVsbCwibGVmdCI6bnVsbH19XX0=), an open-source library that implements everything needed.

Unlike the legacy UI components, the new UI will be implemented using entities with a special `UiTransform` component.

The renderer systems must ignore in the 3D camera every entity containing a `UiTransform` component. Also, all the descendant entities of those with a `UiTransform` must be filtered out from the 3D camera.

For simplicity and speed, the `RootEntity` will be used as parent for all the `UiTransform` entities, this entity is the analogous of the `document.body` for webpages.

The `RootEntity` will act as "root node" and will not accept a `UiTransform` component, its size will be equivalent to the full viewport of the Rendering engine, enabling its children to occupy "100%" width and height, as well relative and absolute positioning in the corners.

Given the difficulty of creating UIs with custom viewport and pixel density sizes present on the SDK6, the `UiTransform` will represent pixels scaled by the current pixel density of the device screen (`devicePixelRatio`). Meaning one screen pixel will be one UiTransform pixel on a pixel density of 1 (low DPI display) and it will be adjusted to the current configuration in high DPI displays like the ones present in modern laptops (e.g. retina display). This should not limit the capabilities of the SDK to create UIs that are reactive to the size of the screens, because percentages are available as units of measurement and the new `UiCanvasInformation` fills in the gaps of information. This behavior mimics the `devicePixelRatio` of web browsers, in which a pixel is always represented as a pixel in CSS, besides being adjusted to 2(device)pixels in a retina display (`devicePixelRatio=2`).

`UiCanvasInformation` serves a purpose of providing information to the secene for custom layouting based on `devicePixelRatio`, device orientation and canvas sizes are in exclusive charge of the implementation of the SDK libraries themselves. Removing any layouting responsibility from the renderer for the sake of keeping the semantics simple and backwards compatible. This will create an inversion of control in which the scene will decide everything in relation to the scene UI.

The new UI system will also be separated in two types of components:

- Layout components, to position things in the canvas:
  - `UiTransform`
- Rendering components:
  - `UiBackground` to define a background color or image
  - `UiLabel` to render text
  - `UiInput` to create text inputs
  - `UiButton` to create buttons
  - Other components to be added.
- Informational components:
  - `UiCanvasInformation` will be added to the RootEntity of the scene by the renderer

Rendering components may encapsulate logic for the renderer like styles for different states like Active or Hover, delegating the position and size of the component to the `UiTransform`

Another big advantage of this new model is that eventually, a playground ([like yoga's](https://yogalayout.com/playground/?eyJ3aWR0aCI6NTAwLCJoZWlnaHQiOjUwMCwibWluV2lkdGgiOm51bGwsIm1pbkhlaWdodCI6bnVsbCwibWF4V2lkdGgiOm51bGwsIm1heEhlaWdodCI6bnVsbCwiYWxpZ25JdGVtcyI6MSwicGFkZGluZyI6eyJ0b3AiOiIyMCIsInJpZ2h0IjoiMjAiLCJib3R0b20iOiIyMCIsImxlZnQiOiIyMCJ9LCJwb3NpdGlvbiI6eyJ0b3AiOm51bGwsInJpZ2h0IjpudWxsLCJib3R0b20iOm51bGwsImxlZnQiOm51bGx9LCJjaGlsZHJlbiI6W3sid2lkdGgiOjEwMCwiaGVpZ2h0IjoxMDAsIm1pbldpZHRoIjpudWxsLCJtaW5IZWlnaHQiOm51bGwsIm1heFdpZHRoIjpudWxsLCJtYXhIZWlnaHQiOm51bGwsInBvc2l0aW9uIjp7InRvcCI6bnVsbCwicmlnaHQiOm51bGwsImJvdHRvbSI6bnVsbCwibGVmdCI6bnVsbH19LHsid2lkdGgiOiIxMDAlIiwiaGVpZ2h0IjoiMTAwJSIsIm1pbldpZHRoIjpudWxsLCJtaW5IZWlnaHQiOm51bGwsIm1heFdpZHRoIjpudWxsLCJtYXhIZWlnaHQiOm51bGwsImp1c3RpZnlDb250ZW50IjoxLCJhbGlnbkl0ZW1zIjoyLCJhbGlnblNlbGYiOjIsImFsaWduQ29udGVudCI6MiwibWFyZ2luIjp7InJpZ2h0IjoiMjAiLCJsZWZ0IjoiMjAifSwiYm9yZGVyIjp7InRvcCI6IiJ9LCJwb3NpdGlvbiI6eyJ0b3AiOiI1JSIsInJpZ2h0IjpudWxsLCJib3R0b20iOiIxMCUiLCJsZWZ0IjpudWxsfSwiZmxleEdyb3ciOiIxIn0seyJ3aWR0aCI6MTAwLCJoZWlnaHQiOjEwMCwibWluV2lkdGgiOm51bGwsIm1pbkhlaWdodCI6bnVsbCwibWF4V2lkdGgiOm51bGwsIm1heEhlaWdodCI6bnVsbCwicG9zaXRpb24iOnsidG9wIjpudWxsLCJyaWdodCI6bnVsbCwiYm90dG9tIjpudWxsLCJsZWZ0IjpudWxsfX1dfQ==)) can be created to rapidly prototype new UIs and it is nowadays a common technology among web developers, reducing drastically the entry barrier.

Another interesting use case is a visual debugger/inspector. In early stages of development, to test that all features work as expected, a web debugger should be created to render side-by-side code and the generated layout using the CRDT protocol.

### React-based UI

Since entities and components can be mapped 1-1 with a DOM-like tree. The new SDK implements a React-based UI adapter. It will behave like ReactNative, creating the element tree in JS and sending the commands over the wire to the renderer process.

The implementation heavily relies on react-reconciler to mutate the ECS entities in the scene runtime in a way that changes can be broadcasted automatically by the CRDT protocol ([ADR-117](/adr/ADR-117)).

To not overload all scenes, react is bundled for Decentraland in a new package `@dcl/react-ecs` ([GitHub repo](https://github.com/decentraland/js-sdk-toolchain/tree/c9822af9da632ef2e1ae4ba4c97745e7ac0cc332/packages/%40dcl/react-ecs))

### Parenting and ordering UI elements

In an ECS-based system, all entities are stored in a flat structure, usually a sparse set. That forces the implementation to create hieararchy of elements using components, i.e. using a `ParentComponent(otherEntity)`.

Since parenting is only used to compute the final position of entities, the `parentEntity` is a field of the `Transform` component for 3D entities, and `UiTransform` of the UI entities.

3D entities childrens don't have a specific order inside the parent entity. On the contrary, the order is important for Flexbox algorithms, since it changes the layouting of all the elements, including the parent.

The evaluated alternatives to order the elements were:

- An "order" field may be added to the UITransform, then a [sorting method](https://docs.unity3d.com/ScriptReference/UIElements.VisualElement.Hierarchy.Sort.html) can be used in the renderer to always re-order the children of an entity
- Another simple solution is to send `rightOf` to mimic the react fiber internals which uses linked lists to represent the DOM

The decision was to send a `rightOf` field in each `UiTransform` because it provides the same level of functionality as the "order" field but it sends more bits of information with the same amount of transferred bytes and provide other state optimization like inserting one UiElement at the beginning of a list of elements and not changing all the `.order` to increment by one.

### Schema of the component

The proposed `UiTransform` adopts the most widely used and implemented flexbox properties, including the ones implemented by UiToolkit (unity), CSS (web browsers) and Yoga (C library)

```protobuf
syntax = "proto3";

enum YGPositionType {
  YGPT_STATIC = 0;
  YGPT_RELATIVE = 1;
  YGPT_ABSOLUTE = 2;
}

enum YGAlign {
  YGA_AUTO = 0;
  YGA_FLEX_START = 1;
  YGA_CENTER = 2;
  YGA_FLEX_END = 3;
  YGA_STRETCH = 4;
  YGA_BASELINE = 5;
  YGA_SPACE_BETWEEN = 6;
  YGA_SPACE_AROUND = 7;
}

enum YGUnit {
  YGU_UNDEFINED = 0;
  YGU_POINT = 1;
  YGU_PERCENT = 2;
  YGU_AUTO = 3;
}

enum YGDirection {
  YGD_INHERIT = 0;
  YGD_LTR = 1;
  YGD_RTL = 2;
}

enum YGFlexDirection {
  YGFD_COLUMN = 0;
  YGFD_COLUMN_REVERSE = 1;
  YGFD_ROW = 2;
  YGFD_ROW_REVERSE = 3;
}

enum YGWrap {
  YGW_NO_WRAP = 0;
  YGW_WRAP = 1;
  YGW_WRAP_REVERSE = 2;
}

enum YGJustify {
  YGJ_FLEX_START = 0;
  YGJ_CENTER = 1;
  YGJ_FLEX_END = 2;
  YGJ_SPACE_BETWEEN = 3;
  YGJ_SPACE_AROUND = 4;
  YGJ_SPACE_EVENLY = 5;
}

enum YGOverflow {
  YGO_VISIBLE = 0;
  YGO_HIDDEN = 1;
  YGO_SCROLL = 2;
}

enum YGDisplay {
  YGD_FLEX = 0;
  YGD_NONE = 1;
}

enum YGEdge {
  YGE_LEFT = 0;
  YGE_TOP = 1;
  YGE_RIGHT = 2;
  YGE_BOTTOM = 3;
  YGE_START = 4;
  YGE_END = 5;
  YGE_HORIZONTAL = 6;
  YGE_VERTICAL = 7;
  YGE_ALL = 8;
}

message PBUiTransform {
  int32 parent = 79;
  int32 right_of = 80;

  YGPositionType position_type = 1;

  YGAlign align_content = 2;
  YGAlign align_items = 3;
  YGAlign align_self = 4;
  YGFlexDirection flex_direction = 5;
  YGWrap flex_wrap = 6;
  YGJustify justify_content = 7;

  YGOverflow overflow = 8;
  YGDisplay display = 9;
  YGDirection direction = 10;

  float flex = 11;

  YGUnit flex_basis_unit = 13;
  float flex_basis = 14;

  float flex_grow = 15;
  float flex_shrink = 16;

  YGUnit width_unit = 17;
  float width = 18;
  YGUnit height_unit = 19;
  float height = 20;

  YGUnit min_width_unit = 21;
  float min_width = 22;
  YGUnit min_height_unit = 23;
  float min_height = 24;

  YGUnit max_width_unit = 31;
  float max_width = 32;
  YGUnit max_height_unit = 33;
  float max_height = 34;

  // non-standard
  reserved 40; // float aspect_ratio = 40;

  YGUnit position_left_unit = 41;
  float position_left = 42;
  YGUnit position_top_unit = 43;
  float position_top = 44;
  YGUnit position_right_unit = 45;
  float position_right = 46;
  YGUnit position_bottom_unit = 47;
  float position_bottom = 48;

  // margin
  YGUnit margin_left_unit = 51;
  float margin_left = 52;
  YGUnit margin_top_unit = 53;
  float margin_top = 54;
  YGUnit margin_right_unit = 55;
  float margin_right = 56;
  YGUnit margin_bottom_unit = 57;
  float margin_bottom = 58;

  YGUnit padding_left_unit = 61;
  float padding_left = 62;
  YGUnit padding_top_unit = 63;
  float padding_top = 64;
  YGUnit padding_right_unit = 65;
  float padding_right = 66;
  YGUnit padding_bottom_unit = 67;
  float padding_bottom = 68;

  reserved 71; // YGUnit border_left_unit = 71;
  float border_left = 72;
  reserved 73; // YGUnit border_top_unit = 73;
  float border_top = 74;
  reserved 75; // YGUnit border_right_unit = 75;
  float border_right = 76;
  reserved 77; // YGUnit border_bottom_unit = 77;
  float border_bottom = 78;
}
```

## `UiCanvasInformation` component

This component is added to the RootEntity of the scene by the renderer. It is REQUIRED that every renderer sends this component to the scene if the UI features are enabled.

```protobuf
message UiCanvasInformation {
  // informs the scene about the resolution used for the UI rendering
  float device_pixel_ratio = 1;
  // informs about the width of the canvas
  int32 width = 2;
  // informs about the height of the canvas
  int32 height = 3;
  // informs the sdk about the interactable area. some implementations may change this area depending on the HUD that is being shown. this value may change at any time by the Renderer to create reactive UIs
  Rect interactable_area = 4;
}
```

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## External links

- https://github.com/decentraland/sdk/issues/304 initial issue - flexbox
- https://github.com/decentraland/sdk/issues/397 initial issue - ordering issues
