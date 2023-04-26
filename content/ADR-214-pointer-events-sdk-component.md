---
layout: adr
adr: 214 # replace this number for the PR or ISSUE number
title: PointerEvents SDK Component & Input system
date: 2023-04-17
status: Draft # pick one of these
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz # this is your github username
---

## Input system summary

The input system is based on virtual controllers and actions, actions can be either binary or analog. Even though the initial implementations of Decentraland have converged into a specific keymapping configuration, the best input mapping is left up to the implementation and available HID.

In a first person camera engine, there will be only one controller with a ray from the camera position pointing to the forward vector when the mouse is locked. If the mouse is unlocked, the vector will have its origin again in the position of the camera, but the target will be now projected using the mouse position.

The input system can be described in a sentence as:

_For each interactable entity (`PointerEvents` component), all input commands are sent back to the scene for processing by the rendering engine (`PointerEventsResult` component)._

## Components description

PointerEvents adds configurable pointer-based interactions to the attached Entity.

Events that match the criteria defined in the PointerEvents structure are reported back to the entity via the PointerEventsResult component.

Some examples of events that can be detected:

- Pointer hovering over the Entity.
- Held mouse button released over the Entity.
- Controller button pressed while targeting the Entity.
- Key pressed while targeting the Entity, but only in close range.

It also supports simple visual feedback when interactions occur, by showing floating text. More sophisticated feedback requires the use of other components.

## Serialization

<!-- Please complete the follwoing table: -->

```yaml
parameters:
  COMPONENT_ID: 1062
  COMPONENT_NAME: core::PointerEvents
  CRDT_TYPE: LastWriteWin-Element-Set
```

```yaml
parameters:
  COMPONENT_ID: 1063
  COMPONENT_NAME: core::PointerEventsResult
  CRDT_TYPE: GrowOnly-Value-Set
```

<!-- And provide a complete and commented protobuf serialization for the component -->

```protobuf
message PBPointerEvents {
  message Info {
    // key/button in use (default IA_ANY)
    optional InputAction button = 1;
    // feedback on hover (default 'Interact')
    optional string hover_text = 2;
    // range of interaction (default 10)
    optional float max_distance = 3;
    // enable or disable hover text (default true)
    optional bool show_feedback = 4;
  }

  message Entry {
    // the kind of interaction to detect
    PointerEventType event_type = 1;
    // additional configuration for this detection
    Info event_info = 2;
  }

  // the list of relevant events to detect
  repeated Entry pointer_events = 1;
}

// since PointerEventsResult is an APPEND type of component, we can send many PBPointerEventsResult to the scene per frame.
message PBPointerEventsResult {
  // identifier of the input
  InputAction button = 1;
  // described in ADR-200
  raycast.RaycastHit hit = 2;
  // kind of interaction that was detected
  PointerEventType event_type = 4;
  // could be a Lamport timestamp or a global monotonic counter
  uint32 timestamp = 5;
  // if the input is analog then we store it here
  optional float analog = 6;
  // number of tick in which the event was produced, equals to EngineInfo.tick_number (ADR-148) + (ADR-219)
  uint32 tick_number = 7;
}

enum InputAction {
  IA_POINTER = 0;
  IA_PRIMARY = 1;
  IA_SECONDARY = 2;
  IA_ANY = 3;
  IA_FORWARD = 4;
  IA_BACKWARD = 5;
  IA_RIGHT = 6;
  IA_LEFT = 7;
  IA_JUMP = 8;
  IA_WALK = 9;
  IA_ACTION_3 = 10;
  IA_ACTION_4 = 11;
  IA_ACTION_5 = 12;
  IA_ACTION_6 = 13;
}

// PointerEventType is a kind of interaction that can be detected.
enum PointerEventType {
  PET_UP = 0;
  PET_DOWN = 1;
  PET_HOVER_ENTER = 2;
  PET_HOVER_LEAVE = 3;
}

```

## Semantics

## Determine the interactable entities

A component called `PointerEvents` is designed to signal the Renderer which entities are interactable. It is also used to provide information about "call to action placeholders" which are recommended to appear as visual cues in the screen. These cues are specialized per input action, enabling the renderer to select a special texture for each action key-mapping.

Based on the `PointerEvents` component, at the "executeRaycast" stage of the tick ([ADR-148](/adr/ADR-148)), a continuous raycast ([ADR-200](/adr/ADR-200)) is added to process the events to be sent to the scene.

### Mesh selection for PointerEvent raycast

The eligible meshes for raycast are the ones that meet any of this criteria:

1. MeshCollider of the entity
1. Collider mesh inside a direct children Container (like GltfContainer).

Examples, whith an ✅ we mark the meshes that are eligible. With an ❌ the ones that are not.

```
In this scenario, the entity A has both PointerEvents and a MeshCollider
components. The raycasts against the MeshCollider will be eligible for
PointerEventResults

ROOT_ENTITY
  └── A ✅ (PointerEvents, MeshCollider)
```

```
In this scenario, the entity B has a MeshCollider, but since the entity
does not have one, it will not intercept any event.

ROOT_ENTITY
  └── A ❌ (PointerEvents)
      └── B ❌ (MeshCollider)
```

```
In this scenario, the entity A has a GltfContainer and PointerEvents.
Like in the SDK entities, the interal collider meshes of the
GltfContainer will be used to filter which meshes are eligible for raycasts.

ROOT_ENTITY
  └── A ✅ (GltfContainner, PointerEvents) <─┐
      ├── GLTF_ROOT                          │
      │   └── ...                            │
      │       └── ✅ internal gltf node (MeshCollider)
      └── B ❌ (MeshCollider)
```

### Mesh selection for UiElements

Any entity with `UiTransform` ([ADR-124](/adr/ADR-124)) can be eligible for pointer events if they have a `PointerEvents` component, all other UI entities will not be eligible and pointer events will be bubbled up until finding an entity that matches the criteria. A rectangular mesh occupying the whole area designated by the `UiTransform` MUST be used.

In UI entities, contrary to the render order ([ADR-151](/adr/ADR-151)), the events MUST bubble up from the leaves of the tree up to the root until finding an entity that matches the pointer event. In that case, the propagation of the event MUST stop, and the event MUST be added to the `PointerEventsResult`.

Like in Raycasts [ADR-200](/adr/ADR-200), the selection of the meshes for the pointer events matches any mesh including at least the `CL_POINTER` bit in its collision layers.

## Input commands

For the ECS to work, "events" and "state" must be separated into two different categories. A challenge is faced here, since "events" or "interrupts" are not compatible with data representations at one moment in time (like the state of the ECS). To overcome this, all the input events of the frame must be queued and processed at the "executeRaycast" stage of the tick for all the scenes that are running. Naturally, this compute MUST count towards the quota/limit suggested by ADR-148.

Then, in the "executeRaycast" step of the scene tick (on the renderer side), that queue will be consumed and "InputCommands" will be produced. An InputCommand is a record in a PointerEventResult component listing all the pertinent input actions for that entity. This is done to process when the pointer is "hovering" an entity, when it leaves, when the key down and key up in input. All of that can happen in the same frame. For example, a cube can be aimed at, clicked, and released the click on the same frame.

This design enables rapid games with low input lag and without losing information regardless of the framerate of the scene and renderer.

It also enables high resolution events for cases of moving entities, e.g. assuming one is pointing still, with one finger on the trigger, if the engine puts an entity in front of someone for one frame, the scene will receive the "HoverEnter" event for that unique frame, and if one is fast enough, it may also be clicked.

In summary, the input system does not send the last snapshot of every action to the scene like other engines. Instead, a list of commands for each entity is sent. The SDK takes care of making sense of these commands with input helpers.

Before jumping into the implementation, a new CRDT operation called `append` must be introduced, together with its own kind of CRDT store called `GrowOnly-Value-Set` ([ADR-117](/adr/ADR-117)). It is used by the `PointerEventResult` component, and instead of being a `Last-Write-Win Element set`, it is an ordered set of events. Since it is a grow only set, the only possible operation over this set is "append". More details about this CRDT data structure are available at ([ADR-117](/adr/ADR-117)).

## Tooltips

Eligible meshes including `hover_text` and with `show_feedback` enabled should show a tooltip with a visual queue or indication about the button to be pressed to interact.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
