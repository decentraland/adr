---
layout: adr
adr: 285
title: Continuous tweens
date: 2025-07-31
status: Living
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

This specification defines how to extend the Tween component to support continuous, infinite or time-bound motion types that move or rotate entities at a constant rate. These new modes include `RotateContinuous`, `MoveContinuous`, and `TextureMoveContinuous`. The motion is defined by a direction and a speed, rather than a start/end pair. The specification also outlines protocol changes, serialization details, and runtime behavior.

Currently, the Tween component supports only tweens with a start and end value, which is suitable for discrete, finite transitions (e.g., moving from position A to B or rotating from angle X to Y). However, many game elements — such as rotating collectibles, moving textures (e.g., waterfalls), or floating platforms — require continuous, direction-based motion at a fixed speed, not based on a start-end interpolation.

The current workaround (chaining multiple finite tweens) introduces complexity for creators and causes visual artifacts due to frame-precision issues and unnatural looping.

## Decision

We will introduce three new continuous tween modes to the Tween component:

- `RotateContinuous`
- `MoveContinuous`
- `TextureMoveContinuous`

These modes enable perpetual, direction-based motion at a fixed speed, optionally for a finite duration. They improve usability and output quality by delegating the motion to engine-level logic, ensuring smooth, jitter-free behavior.

## RotateContinuous


The `RotateContinuous` mode allows to rotate an entity at a constant speed in a given direction. The rotation is defined by a direction and a speed. 

The `RotateContinuous` mode will have the following fields:

- `direction`: _Quaternion_, the direction of the rotation
- `speed`: _number_, the speed of the rotation in degrees per second
- `duration`: _number_, the duration of the rotation in milliseconds
- `easingFunction`: _EasingFunction_ (optional), the easing function to use for the rotation

Note: The `duration` field is optional. If it is not specified, the rotation will be continuous and infinite. The `easingFunction` field will only be used if the `duration` field is specified. If an easing function is present, it will apply a multiplier from 0 to 1 to the speed, distorting the final resulting speed.


## MoveContinuous

The `MoveContinuous` mode allows to move an entity at a constant speed in a given direction. The movement is defined by a direction and a speed.

The `MoveContinuous` mode will have the following fields:

- `movement`: _Vector3_, a single vector that specifies the movement direction and speed (given by the magnitude).
- `duration`: _number_, the duration of the movement in milliseconds
- `easingFunction`: _EasingFunction_ (optional), the easing function to use for the movement

Note: In a helper we can expose separate fields for the direction (as a normalized vector3) and the speed (as meters per second)
Note: The `duration` field is optional. If it is not specified, the movement will be continuous and infinite. The `easingFunction` field will only be used if the `duration` field is specified. If an easing function is present, it will apply a multiplier from 0 to 1 to the speed, distorting the final resulting speed.


## TextureMoveContinuous

The `TextureMoveContinuous` mode allows to move the texture of a material at a constant speed in a given direction. The movement is defined by a direction and a speed.

The `TextureMoveContinuous` mode will have the following fields:


- `movement`: _Vector2_, a single vector that specifies the movement direction and speed (given by the magnitude).
- `duration`: _number_, the duration of the movement in milliseconds
- `easingFunction`: _EasingFunction_ (optional), the easing function to use for the movement

Note: In a helper we can expose separate fields for the direction (as a normalized vector2) and the speed (as a percentage of the texture size per second)
Note: The `duration` field is optional. If it is not specified, the movement will be continuous and infinite. The `easingFunction` field will only be used if the `duration` field is specified. If an easing function is present, it will apply a multiplier from 0 to 1 to the speed, distorting the final resulting speed.


## Easing function to be optional

Currently the `EasingFunction` field is required for all tweens. We will make it optional for all tweens, including the already existing ones. Setting this field is a nuissance for creators, since it involves importing an enum reference which is not always obvious. The vast majority of the time, creators will want to use the default value, which is `EasingFunction.EF_LINEAR`.

## Serialization

```yaml

```

```protobuf

```

## Semantics

### Example


Simple continuos rotation:

```ts
const myEntity = engine.addEntity()

MeshRenderer.setCube(myEntity)

Transform.create(myEntity, {
	position: Vector3.create(4, 1, 4),
})

Tween.create(myEntity, {
	mode: Tween.Mode.RotateContinuous({
		direction: Quaternion.create(0, 0, 0, 1),
		speed: 10,
	}),
})
```

Simple continuous movement:
```ts
const myEntity = engine.addEntity()

MeshRenderer.setCube(myEntity)

Transform.create(myEntity, {
	position: Vector3.create(4, 1, 4),
})

Tween.create(myEntity, {
	mode: Tween.Mode.MoveContinuous({
		direction: Vector3.create(0, 0, 1),
		speed: 10,
	}),
})
```

Simple continuous texture movement:
```ts
const myEntity = engine.addEntity()

MeshRenderer.setPlane(myEntity)

Transform.create(myEntity, {
	position: Vector3.create(4, 1, 4),
})

Material.setPbrMaterial(myEntity, {
	texture: Material.Texture.Common({
		src: 'materials/water.png',
		wrapMode: TextureWrapMode.TWM_REPEAT,
	}),
})

Tween.create(myEntity, {
	mode: Tween.Mode.TextureMoveContinuous({
		direction: Vector2.create(0, 1),
		speed: 0.1,
	}),
})

TweenSequence.create(myEntity, { sequence: [], loop: TweenLoop.TL_RESTART })
```
