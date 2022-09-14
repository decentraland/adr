---
layout: doc
adr: 2
date: 2020-10-06
title: State sync for builder-in-world
status: DEPRECATED
---

## Context and Problem Statement

We need to find a sustainable path to develop the builder in world without compromising future plans and also enabling experimenting with the static scene definition initiatives and new SDK.

The domain of the problem can be divided in three big chunks:

- State management
- Synchronization
- Behavior

Today we are deciding on the State management.

## Options

### Option 1 - Renderer owns the state

In this approach the owner of the "edited" state is the renderer.

#### Initial load

```sequence
participant user
participant kernel
participant worker
participant renderer
participant p2p

user->kernel: load scene
kerneld->worker: create worker
workerd->worker: load scene
worker-->renderer: inform state
```

#### Initial scene loading (while others are editing)

```sequence
participant user
participant kernel
participant worker
participant renderer
participant p2p


p2p-->kernel: edition beacon {scene xy}
kernel-->renderer: edition mode
renderer-->worker: kill worker

p2p-->renderer: process update
userd->renderer: perform changes (if allowed)
p2p-->renderer: process update
```

#### Save state

Save the current snapshot of the static scene

```sequence
user-->renderer: edition mode
renderer-->worker: kill worker
userd->renderer: perform changes
rendererd->renderer: process changes 🔧
userd->renderer: save
rendererd->kernel: save {serialized state}
kerneld->builder_server: generate code and store
```

#### Broadcast updates

After a change in state (i.e. builder action)

```sequence
user-->renderer: edition mode
renderer-->worker: kill worker
userd->renderer: perform changes
userd->renderer:
userd->renderer:
rendererd->renderer: process changes 🔧
renderer-->p2p: update-msg
```

#### Receive updates

From other connected scenes.

In this case we would receive updates only on edition mode.

```sequence
user-->renderer: enter edition mode
renderer-->worker: kill worker
p2p-->renderer: update-msg
rendererd->renderer: process changes 🔧
```

#### Open questions

- Do we want to have a back and forward edition from builder and builder in world?

---

### Option 2 - Scene owns the state

In this approach, the scene code is owner of the state at all times.

#### Initial load

```sequence
participant user
participant kernel
participant worker
participant renderer
participant p2p

userd->kernel: load scene
kerneld->worker: create worker
workerd->worker: load scene (JSON)
worker-->renderer: inform state

workerd->worker: connect to synchronization bus
workerd->kernel: init p2p bus
```

#### Receive updates

From other connected scenes.

In this case we would receive updates either we are editing or not.

```sequence
participant user
participant kernel
participant worker
participant renderer
participant p2p

p2p-->worker: update-msg

workerd->worker: process changes 🔧
worker-->renderer: inform state
```

#### Broadcast updates (v0)

After a change in state (i.e. builder action)

```sequence
participant user
participant renderer
participant worker
participant p2p
participant kernel


userd->renderer: perform changes


renderer-->p2p: broadcast update-msg
rendererd->worker: update-msg
workerd->worker: process changes 🔧
```

#### Broadcast updates (v1)

After a change in state (i.e. builder action)

```sequence
participant user
participant renderer
participant worker
participant p2p
participant kernel


userd->renderer: perform changes

rendererd->worker: update-msg
workerd->worker: process changes 🔧
worker-->p2p: broadcast update-msg
```

#### Save state

Save the current snapshot of the static scene

```sequence
participant user
participant renderer
participant worker
participant p2p
participant kernel

userd->renderer: save state
rendererd->worker: save

workerd->worker: serialize scene
workerd->worker: save JSON (POST?)
```

### Option 3 - new worker owns the state

```sequence
userd->worker: kill worker
userd->new_worker: create for edition (scene xy)
new_workerd->content_server: get JSON (scene xy)
content_serverd->new_worker:
new_workerd->renderer: initial state
renderer-->new_worker: update-msg
renderer-->p2p: update-msg (for broadcast)
p2p-->new_worker: update-msg
```

## Decision Outcome

#### Alternative 1

- Kill worker solution
- We are able to play and stop the scene from the builder in world.
- Requires code generation
- Synchronization is handled by kernel/renderer
- Publish is still an irreversible process

#### Alternative 2

- Keep worker & stop systems
- Delay builder in world until synchronization works (requires work on new SDK)
- We can't go on this alternative until smart items are component based (not code-gen)
- End goal, but it has so much constraints right now

#### Alternative 3 ✅

- Like alt 1 but creating new worker for syncing instead of using kernel/renderer
- Seems like a nice decoupling of new SDK vs existing/old
- Can work as a foundation for new runtime

# Participants

- Nicolas Chamo
- Pablo de Haro
- Esteban Ordano
- Agustin Mendez
