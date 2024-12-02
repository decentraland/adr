---
layout: adr
adr: 255
title: Texture tweens
date: 2024-12-02
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

This document describes an approach for making it possible for creators to slide textures. This can be used to simulate running liquids, as well as many other interesting texture effects.

This new feature combines very well with ADR-254 (GLTF Nodes), as it enables to do the same effects on the textures of any .gltf model.

## Offset and tiling

Today the settings available on a texture are limited. We need to be able to also change the offset and the scale of a texture. As part of this ADR we're also adding two new fields to all textures:

- `offset`: _Vector2_, shifts the image from starting on the 0,0 mark. Default value `0,0`
- `tiling`: _Vector2_, determines how many times the texture fits on the surface. Default value `1,1`. The behavior of the remaining space on the texture will depend on the value of `wrapMode`.

A creator could theoretically write a system that changes the `offset` value on every frame, but that would be very bad for performance. If something will continually change their offset, it's recommended to instead use a Tween for that.

## Texture tween

We'll define a new type of tween that affects the Material rather than the Transform. This is enabled by using the already existing Tween and TweenSequence components, with a new `TextureMove` option to be added to the existing `Move`, `Rotate`, and `Scale`.

The new `TextureMove` option on the `Tween` component will have the following fields:

- `TextureMovementType`: _(optional)_, defines if the movement will be on the `offset` or the `tiling` field (see section above)
- `start`: _Vector2_ the initial value of the offset or tiling
- `end`: _Vector2_ the final value of the offset or tiling
- `duration`: _number_ how long the transition takes, in milliseconds
- `easingFunction`: How the curve of movement over time changes, the default value is `EasingFunction.EF_LINEAR`

The scene can also use a `TweenSequence` to make continuos movements possible, just like with other kinds of tweens.

## Texture layers

Materials have several textures besides the albedo_texture, including bump_texture, alpha_texture, emissive_texture. Because of shader optimization reasons, the alignment of these fields is not independent from each other. The albedo_texture behaves as the base texture, any changes to this texture affect all other layers equally. Other layers are then able to set their own different alignment properties, but these are compounded with those of the base texture.

For example, if the offset of the base texture is `(0.2, 0)` and the offset of the emissive texture is `(0.1, 0)`, the final position of the emissive texture will end up equivalent to `(0.3, 0)`.

This applies to changing the `offset` and `tiling` fields manually, as well as using a texture tween.

The `TextureMove` Tween affects the base texture, so all textures move together with it.

## Serialization

```yaml
parameters:
```

```protobuf

```

## Semantics

### Example

Offset texture:

```ts
Material.setPbrMaterial(myEntity, {
	texture: Material.Texture.Common({
		src: 'assets/materials/wood.png',
		wrapMode: TextureWrapMode.TWM_REPEAT,
		offset: Vector2.create(0, 0.2),
		tiling: Vector2.create(1, 1),
	}),
})
```

Simple continuos flow:

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
	mode: Tween.Mode.TextureMove({
		start: Vector2.create(0, 0),
		end: Vector2.create(0, 1),
	}),
	duration: 1000,
	easingFunction: EasingFunction.EF_LINEAR,
})

TweenSequence.create(myEntity, { sequence: [], loop: TweenLoop.TL_RESTART })
```

Square-moving tween sequence:

```ts
//(...)

Tween.create(myEntity, {
	mode: Tween.Mode.TextureMove({
		start: Vector2.create(0, 0),
		end: Vector2.create(0, 1),
	}),
	duration: 1000,
	easingFunction: EasingFunction.EF_LINEAR,
})

TweenSequence.create(myEntity, {
	sequence: [
		{
			mode: Tween.Mode.TextureMove({
				start: Vector2.create(0, 1),
				end: Vector2.create(1, 1),
			}),
			duration: 1000,
			easingFunction: EasingFunction.EF_LINEAR,
		},
		{
			mode: Tween.Mode.TextureMove({
				start: Vector2.create(1, 1),
				end: Vector2.create(1, 0),
			}),
			duration: 1000,
			easingFunction: EasingFunction.EF_LINEAR,
		},
		{
			mode: Tween.Mode.TextureMove({
				start: Vector2.create(1, 0),
				end: Vector2.create(0, 0),
			}),
			duration: 1000,
			easingFunction: EasingFunction.EF_LINEAR,
		},
	],
	loop: TweenLoop.TL_RESTART,
})
```
