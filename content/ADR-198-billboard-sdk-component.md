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

The billboard component is used to alter the rotation component of the transformation "world matrix" of each entity. It is commonly used with 3D texts to make sure they are always facing the camera. Any of the three angles of the camera can be used or in any combination.

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

The effect of the billboard component over the camera is applied by replacing the "rotation" component of the "world matrix" of the entity by a rotation with Z forward pointing to the camera. The intended result can be reasoned as a mirror of the rotations of the camera. We get this effect by inverting the rotation matrix of the view matrix, removing the scale and translation components.

To isolate the X Y and Z components of the rotation, the RECOMMENDED approach is to convert the rotation Quaternion to euler angles, and then replace by 0 the angles that are left out the billboard.

```typescript
function calculateWorldMatrix(entity) {
  const worldMatrix = Matrix().Identity()

  // ... world matrix calculations ...

  if (entity.hasBillboard) {
    // Save translation
    const storedTranslation = new Vector3()
    worldMatrix.getTranslationToRef(storedTranslation)

    // And then cancel camera rotation
    const viewMatrx = camera.getViewMatrix().clone()
    viewMatrx.setTranslationFromFloats(0, 0, 0)
    const invertedMatrix = viewMatrx.invert()

    // apply the new rotation
    const eulerAngles = invertedMatrix.extractRotationQuaternion().toEuler()

    if ((entity.billboardMode & BillboardMode.BM_X) !== BillboardMode.BM_X) {
      eulerAngles.x = 0
    }

    if ((entity.billboardMode & BillboardMode.BM_Y) !== BillboardMode.BM_Y) {
      eulerAngles.y = 0
    }

    if ((entity.billboardMode & BillboardMode.BM_Z) !== BillboardMode.BM_Z) {
      eulerAngles.z = 0
    }

    Matrix.RotationYawPitchRollToRef(eulerAngles.y, eulerAngles.x, eulerAngles.z, invertedMatrix)
    worldMatrix.setTranslationFromFloats(0, 0, 0)
    worldMatrix.multiplyInPlace(invertedMatrix)

    // Restore translation
    worldMatrix.setTranslation(storedTranslation)
  } else {
    // apply entity.transform.rotation to the worldMatrix
  }

  // ... finish world matrix calculations ...
}
```

### Example

If we are wearing a VR headset and we have a VR headset rendered in world, the headset should be looking forward Z if no billboard is applied.

Once the billboard is applied, the VR headset will point towards us (its forward vector will point the camera). Then it will mimic the rotations of the camera, in euler angles, the Y rotation will be 180 degrees rotated. And the X and Z rotations will be inverted to get this "mirror" effect.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
