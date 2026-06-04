---
layout: adr
adr: 258
title: UI Scaling
date: 2025-01-16
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

This document outlines a proposed solution to simplify the development of adaptable scene UIs for creators, making it easier to ensure that UIs scale properly across different screen sizes.

## Context

Developing UIs that work well across a variety of screen sizes presents significant challenges. Currently, developers must test their scenes on multiple screen sizes to ensure they appear correctly. Additionally, they often need to write custom scene-side code to detect and adapt to the screen dimensions.

This issue is particularly challenging for many of our creators, who may be amateurs or not wish to spend much time addressing this. Some creators may not even have access to multiple monitors for testing or may not realize the need for responsive design. In SDK6, UIs had a fixed size, which was consistent across all screens, and many creators are accustomed to this approach.

While it is possible to set the size of certain elements, like a `div`, as a percentage of the screen size, this is not the case for font size or other elements.

Ideally, we want creators to set the UI dimensions according to their own screen setup and be confident that the UI will scale similarly on other users' screens, with minimal extra effort on their part.

However, we also want to allow more advanced creators to have the option to fine-tune the UI layout for different screen sizes. The goal is to make the default experience simple and intuitive for the majority of creators while still offering flexibility when needed.

The default behavior should remain consistent with current functionality to avoid breaking existing projects.

## Proposal

We will add some new fields to the existing `UICanvasInformation` component:

- **`forcedHeight`**: `undefined` by default. If specified, the canvas height will be treated as the given value, overriding the actual screen height.
- **`forcedWidth`**: `undefined` by default. If specified, the canvas width will be treated as the given value, overriding the actual screen width.
- **`pixelRatio`**: When using `forcedHeight` or `forcedWidth`, this field will define the ratio between the forced screen dimensions and the real screen dimensions. It allows fine-grained control over the scaling of UI elements.

+**Clarification**: If both `forcedHeight` and `forcedWidth` are set, we could prioritize the most recently set value, ignoring the previous one, to prevent conflicts or distorting the aspect ratio in an unnatural way.

If neither value is provided, UI elements will be interpreted as literal pixel values, just as they are currently.

### Interaction with Existing Fields

The current `height` and `width` properties of `UICanvasInformation` will continue to reflect the actual screen dimensions. If either `forcedHeight` or `forcedWidth` is set, UI elements that use pixel values will be scaled based on the virtual screen dimensions.

### Example Scenario

1. The creator sets the `forcedHeight` to 1080 (which automatically sets the `forcedWidth` to 1920).
2. A UI element is created with a height of 100 pixels.
3. The player's real screen size is 3840×2160.
4. The element's real height on the screen will be 200 pixels (calculated as 100/1080 × 2160).

## Discussed alternatives

Several alternatives were considered and discussed:

1. **Always use literal pixel values**: Introduce a new `pixelIndex` value in `UICanvasInformation`, which acts as a multiplier for all UI fields. While this solution works, it adds more complexity for creators. It would be easy for creators to forget to apply the multiplier to some fields, leading to inconsistent results across screen sizes.

2. **Use forced pixels**: Implement a fixed virtual screen size (e.g., 1280x1024) and add a `pixelIndex` for fine-tuning. This would simplify things for creators by ensuring consistency across screens, but it could introduce a breaking change and hurt existing content, as the actual screen size would no longer be directly reflected.

3. **Allow overwriting the `height` and `width` fields**: If one of these fields is changed, the other would automatically adjust to maintain the same aspect ratio. A new `pixelIndex` could be used to track the difference between the virtual and real screen dimensions. This solution avoids the creation of new fields, but may result in lack of clarity between actual and forced dimensions.

4. **Add a boolean toggle to UI elements**: This would allow creators to choose between using literal pixels or forced pixels for each UI element. This would add flexibility but would require creators to modify each element individually, which may increase the complexity of the system. It also adds risk of human error if they leave out some elements unintentionally.

5. **Use new value types for UI fields**: A new value type, such as "100rpx" (real pixels), could be introduced for fields like width, height, padding, margin, and fontSize. This would give creators more flexibility, but it also adds risk of human error if they leave out some elements unintentionally

## Serialization

```yaml
# Example of serialization format for the new fields

UICanvasInformation:
  forcedHeight: 1080 # Optional field, defaults to undefined
  forcedWidth: 1920 # Optional field, defaults to undefined
  pixelRatio: 1 # Optional field, used to control scaling
```

```protobuf
// Example of Protobuf serialization format for the new fields

message UICanvasInformation {
  optional int32 forcedHeight = 1;  // Optional field, defaults to undefined
  optional int32 forcedWidth = 2;   // Optional field, defaults to undefined
  optional float pixelRatio = 3;    // Optional field, used for scaling
}
```

## Semantics

### Example

In the following example, the screen height is forced to 1080. An element is defined with a height of 400, and on a real screen with a height of 2160, the element's height will scale to 800 pixels.

```ts
import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

export const uiMenu = () => (
	<UiEntity
		uiTransform={{{{
			width: 700,
			height: 400,
			margin: { top: '35px', left: '500px' },
		}}}}
		uiBackground={{{{ color: Color4.Red() }}}}
	/>
)

export function main() {
	UiUICanvasInformation.getMutable(engine.RootEntity).forcedHeight = 1080

	ReactEcsRenderer.setUiRenderer(uiMenu)
}
```
