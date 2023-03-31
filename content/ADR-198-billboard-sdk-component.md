---
layout: adr
adr: 198
title: Billboard SDK Component
date: 2020-02-20
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Component description

<!-- Human readable description of the component, what does it fix and how it affects the entities or the systems from an SDK user point of view -->

The Billboard component enables developers to ensure entities with 3D text or other elements always face the camera, by adjusting the entity's rotation based on the camera's position. This can be applied to any of the three euler angles, or any combination of them.

## Serialization

```yaml
parameters:
  COMPONENT_ID: 1090
  COMPONENT_NAME: core::Billboard
  CRDT_TYPE: LastWriteWin-Element-Set
```

```protobuf
// The Billboard component makes an Entity automatically reorient its rotation to face the camera.
// As the name indicates, it’s used to display in-game billboards and frequently combined with
// the TextShape component.
//
// Billboard only affects the Entity's rotation. Its scale and position are still determined by its
// Transform.
message PBBillboard {
  optional BillboardMode billboard_mode = 1; // the BillboardMode (default: BM_ALL)
}

// BillboardMode indicates one or more axis for automatic rotation, in OR-able bit flag form.
enum BillboardMode {
  BM_NONE = 0;
  BM_X = 1;
  BM_Y = 2;
  BM_Z = 4;
  BM_ALL = 7; // bitwise combination BM_X | BM_Y | BM_Z
}
```

## Semantics

The Billboard component influences an entity's rotation so that it faces the camera, ensuring its visibility from the camera's perspective. This is achieved by modifying the entity's "world matrix" rotation component, creating a Z-forward rotation that points towards the camera.

To isolate the X Y and Z components of the rotation, the RECOMMENDED approach is to convert the rotation Quaternion to euler angles, and then replace by 0 the angles that are left out the billboard.

Even though the components can have any combination, due to mathematical stability of the solution only the NONE, Y, YX and YXZ combinations should be handled at the moment by the renderer. Other combinations SHOULD fallback to the default billboard mode: YXZ. This definition can be revisited in the future.

```typescript
function calculateWorldMatrixOfEntity(entity) {
  const worldMatrix = Matrix().Identity()

  // ... world matrix calculations ...

  if (entity.hasBillboard) {
    // save translation and scaling components of the world matrix calculated by the 3D engine
    const position = Vector3.Zero()
    const scale = Vector3.One()
    worldMatrix.decompose(scale, undefined, position)

    // compute the global position of the world matrix
    const entityGlobalPosition = Vector3.TransformCoordinates(Vector3.Zero(), worldMatrix)

    // get the direction vector from the camera to the entity position
    const directionVector = camera.globalPosition.subtract(entityGlobalPosition)

    // calculate the LookAt matrix from the direction vector towards zero
    const rotMatrix = Matrix.LookAtLH(directionVector, Vector3.Zero(), camera.upVector).invert()
    const rotation = Quaternion.FromRotationMatrix(rotMatrix)

    if (isValidBillboardCombination(billboardMode)) {
      const eulerAngles = rotation.toEulerAngles()

      if ((billboardMode & BillboardMode.BM_X) == 0) {
        eulerAngles.x = 0
      }

      if ((billboardMode & BillboardMode.BM_Y) == 0) {
        eulerAngles.y = 0
      }

      if ((billboardMode & BillboardMode.BM_Z) == 0) {
        eulerAngles.z = 0
      }

      Matrix.RotationYawPitchRollToRef(eulerAngles.y, eulerAngles.x, eulerAngles.z, rotMatrix)
    }

    // restore the scale to a blank scaling matrix
    const scalingMatrix = Matrix.Scaling(scale.x, scale.y, scale.z)

    // apply the scale to the rotation matrix, into _worldMatrix
    scalingMatrix.multiplyToRef(rotMatrix, worldMatrix)

    // finally restore the translation into _worldMatrix
    worldMatrix.setTranslation(position)
  }

  // ... finish world matrix calculations ...
}

function isValidBillboardCombination(billboardMode: BillboardMode) {
  return (
    billboardMode == BillboardMode.BM_NONE ||
    billboardMode == BillboardMode.BM_Y ||
    billboardMode == (BillboardMode.BM_Y | BillboardMode.BM_X) ||
    billboardMode == BillboardMode.BM_ALL
  )
}
```

### Example

If we are wearing a VR headset and we have a VR headset rendered in world, the headset should be looking forward Z if no billboard is applied.

Once the billboard is applied, the VR headset will point towards us (its forward vector will point the camera). Then it will mimic the rotations of the camera, in euler angles, the Y rotation will be 180 degrees rotated. And the X and Z rotations will be inverted to get this "mirror" effect.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
