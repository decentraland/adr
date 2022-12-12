---
layout: adr
adr: 148
title: Synchronization of CRDT messages between scenes and Renderer
date: 2022-12-08
status: Review
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

This document describes alternatives to synchronize scenes and renderers using the CRDT protocol. The document also presents the problem of dropped frames and frame-delay between the renderer and the scene. It describes the sequencing and locks of the scene loop and the render frame of the renderer to optimize interactivity. An implementation similar to "double buffering" is chosen.

## Context, Reach & Prioritization

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

Decentraland scenes run in contexts isolated from the rendering engine (_renderer_ from now on), in a worst case scenario, in a different process only being able to communicate via messaging. Since scenes have an independent update loop (_scene frame_ from now on) clear synchronization points need to be designed to reach consistent states between the renderer and the scene.

The context of synchronizing the scenes and the renderer is complex. Many dimensions participate in the analysis:
- Dropping scene frames due to waits or locks
- Input delay (time or frames between the interaction and effect)
- Optimization of compute time (or what can be executed while the main thread is waiting for the GPU)


## Solution Space Exploration

This document will enumerate the considered alternatives and the implications of each one of them.

### Naive approach

This approach is the simplest to explain: A scene frame runs in the Scene, then it sends the updates to the renderer. It waits for the response to run the next scene frame.

<figure>
  <img src="/resources/ADR-148/Frame 1.svg" />
</figure>

#### Implications

- The scene will run at half the speed of the renderer in the best case sceneario, introducing Dropped frames.
- The renderer will maintain full speed in the rendering, but every other frame will be the same as the previous one.
- If the scene's update reaches the renderer mid-frame, then two frames will be dropped for it.

### Extension

To illustrate better what happens inside the scene frame and renderer frame, we will consider some stages for each of them:

For the scene frame:
- **Scene.Recieve**: Read all the messages from the renderer
- **Scene.Update**: Execute scene logic, run systems, mutate state
- **Scene.Send**: Send all the updates to the renderer

For the renderer frame:
- **Renderer.Recieve**: Read all the messages from the scenes
- **Renderer.Update**: Update transforms, calculate physics, etc.
- **Renderer.Render**: Batch GPU commands and send them to the GPU Process
- **Renderer.Send**: Send all the updates to the scene

<figure>
  <img src="/resources/ADR-148/Frame 2.svg" />
</figure>

### Proposed approach

Now that the frame is decomposed into smaller chunks, it can be observed that the RENDER part doesn't necessarily needs to halt the **Renderer.Send** back to the scene, but it is a requirement for the **Renderer.Render**, since physics and transformations are used to calculate the GPU buffers for the next frame.

<figure>
  <img src="/resources/ADR-148/Frame 4.svg" />
</figure>

An extension to this optimization is that the **Renderer.Receive** can happen in parallel, while the previous GPU frame is still being processed by the GPU Process. Effectively removing the dropped scene frames caused by the excessive waits.

<figure>
  <img src="/resources/ADR-148/Frame 6.svg" />
</figure>

> Considerations: This approach is way better on multi-threaded systems. Since it would be possible to parallelize the rendering and the **Renderer.Send**

#### Working with multiple scenes

The scenes runtimes are RECOMMENDED to be independant and to run in parallel. It is also RECOMMENDED that the Renderer can process those updates concurrently.

There is one explicit synchronization point that implementers MUST consider: The renderer MUST NOT respond to the scene until all the messages of the previous frame were processed and the physics and camera position were calculated.

It was considered for this design that a scene in the renderer can take several renderer frames to process all the queued messages. Implementers SHOULD process all the messages from scenes in order and MUST prioritize first "global scenes" and then scenes ordered by distance.

If scenes are too far away, it MAY be possible that those will receive eventual updates because the closest scenes MAY consume most of the processing quota.

This is so, to prioritize experiences where the user is participating, while keeping the world visible in the surroundings.

Update messages will arrive the Renderer via sockets or shared memory. It is RECOMMENDED that those operations are batched and executed while the GPU process is rendering the previous frame.

<figure>
  <img src="/resources/ADR-148/Frame 7.svg" />
</figure>


## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
