---
layout: adr
adr: 257
title: Player rotation
date: 2025-01-03
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - nearnshaw
---

# Abstract

We propose to add a new field to the `movePlayerTo()` to determine the avatar rotation. This field will be a Vector3 for the point in space that the player looks at.

# Context

Today we can reposition a player with he `movePlayerTo()` function, but we **can’t set the avatar’s rotation**. We can set the camera rotation, which is good enough if the player is in 1st person, but when the player is in 3rd person the camera and the avatar rotation are two separate things. So if we want the player to align perfectly for an animation, the avatar’s rotation is out of our control.

This is key for use cases like making the player sit on a chair, where we first need to alight the user properly with the chair.

# Proposal

The `movePlayerTo()` will have one more _optional_ field named `avatarTarget`. This Vector3 refers to a position in the scene that will be faced by the avatar. This is consistent with the already existing field `cameraTarget`, in most cases you'll likely want to set both fields to the same point.

Setting the look target instead of the literal rotation as a quaternion is easier to calculate, and often more accurate to the desired behavior. For example, for respawning you might want to randomize the position within a certain range, but always want the rotation to face the start of the path.

# Conclusion

This minor addition enables some very desired use cases, like sitting, or making the player perform an avatar animation when pulling a lever, etc.
