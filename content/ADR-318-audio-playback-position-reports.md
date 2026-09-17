---
layout: adr
adr: 318
title: Audio playback position reports
date: 2026-09-15
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - LautaroPetaccio
---

# Abstract

Scenes that need to line gameplay or visuals up with sound (rhythm games, beat-driven effects, video-synchronized audio) have no way to learn where an `AudioSource` clip's playhead actually is. This document extends the `AudioEvent` component so renderers report the clip position periodically while a clip plays, in addition to the media state changes they already report. It mirrors what `PBVideoEvent` already does for video: the position travels in the renderer-owned event component, and the scene-owned `PBAudioSource` is not touched. The change is additive and backwards compatible.

## Context and problem statement

A scene controls audio through `PBAudioSource`: it sets `playing`, and optionally `current_time` as a seek target. Neither is a clock. `current_time` is a write-only command, and the renderer starts or resumes the clip some time after the component is applied: fetching, decoding and seeking a streamed clip all happen before the first sample plays.

Measured on the Unity explorer with a rhythm-game scene that plays a 64-second song as four synchronized instrument stems and judges key presses against a note chart, the audible drums started 100 to 250 ms after the scene's song clock, with a different value on each start. That game accepts a press within 150 ms of the charted note, so a player who plays by ear is judged late, and the scene had no signal it could use to correct itself.

The only feedback channel today is `PBAudioEvent`, which carries a `MediaState` and a monotonic counter. It says that playback started, but not when in scene time or from which clip position. Its video counterpart, `PBVideoEvent`, already reports `current_offset`, `video_length` and `tick_number`, written by the renderer at a fixed cadence while the video plays, so scenes can do for video exactly what they cannot do for audio.

Workarounds are poor. Manual calibration (tapping to a click) covers a player's own input chain but not the per-start playback latency. Onset detection through `AudioAnalysis` works, and was used to measure the numbers above, but it is Unity-only, indirect, and blind to the last tens of milliseconds of the pipeline.

## Specification

### Protocol

Three optional fields are added to `PBAudioEvent` (component id 1105):

```protobuf
message PBAudioEvent {
  common.MediaState state = 1;
  uint32 timestamp = 2;              // monotonic counter

  optional uint32 tick_number = 3;   // scene tick in which the report was taken, equals EngineInfo.tick_number
  optional float current_offset = 4; // playback position of the clip in seconds at that tick
  optional float clip_length = 5;    // total length of the clip in seconds, when known
}
```

### Why a tick number

A position report has two halves: where the clip is (`current_offset`) and when that reading was taken. The second half is what makes the first usable. A report travels through the CRDT queue and is processed by the scene some frames after the renderer sampled it, so comparing `current_offset` with the scene's clock at processing time would make every report look late by an unknown and variable amount.

The scene and the renderer do not share a clock, so the sampling moment cannot be expressed as a wall-clock time either side would trust. They do share the tick: ADR-148 defines it as one round of the scene-to-renderer message exchange, and the renderer publishes the current one in `EngineInfo.tick_number` every frame. A report stamped with the tick lets a scene reason as follows: at tick N my clock read T, the renderer says the clip was at offset X in that same tick, therefore the audio runs T minus X behind my clock. The correlation costs the scene one lookup in a short history of its own clock per tick.

This is the established convention for renderer-written results. `PBVideoEvent.tick_number` and `PBPointerEventsResult.tick_number` both carry "the tick in which the event was produced, equals to EngineInfo.tick_number", and `PBEngineInfo` documents its tick and frame numbers as correlation values. The Unity explorer fills `PBVideoEvent.TickNumber` from the scene's current tick at sampling time; the audio report is filled the same way. The monotonic `timestamp` field that already existed on `PBAudioEvent` stays what it was, a per-entity ordering counter, and is not a time.

### Renderer behaviour

- Renderers keep appending an `AudioEvent` on every media state change, as today.
- Renderers also append a report whenever the clip position has changed since the last report, carrying `tick_number`, `current_offset` and `clip_length`. For a playing clip that is every frame; a paused or stopped clip emits nothing until something changes. This is exactly the rule the Unity explorer applies to `PBVideoEvent` in [`VideoEventsSystem`](https://github.com/decentraland/unity-explorer/blob/fe6974465b0d2e3a70eeb1ba2da3cb87df27e654/Explorer/Assets/DCL/SDKComponents/MediaStream/Systems/VideoEventsSystem.cs#L52), which writes when the state or the current time differs from the last propagated value; no fixed cadence is involved.
- Renderers never write `PBAudioSource`. That component stays scene-owned, and `current_time` keeps its meaning as a seek command.
- `tick_number` is the tick, as defined by ADR-148, in which the position was sampled. `current_offset` is the clip position at that same frame, so the pair can be compared with any scene-side clock that is also sampled per tick. State-change events written while a clip is attached carry the same fields.
- For `AudioStream` entities the fields may be omitted when the underlying player exposes no position.
- `current_offset` reports where the playhead is, not how much of the clip was consumed. Players commonly rewind the playhead to zero when a clip is stopped or reaches its end, so the last report of a finished clip carries zero rather than `clip_length`. A scene tracking completion should read the state transition out of `MsPlaying`, not wait for the offset to approach the length.
- `AudioEvent` remains a grow-only value set with a bounded size; position reports evict the oldest entries like any other value.

### SDK

`audioEventsSystem` in `@dcl/ecs` gains:

- `registerAudioPlaybackEntity(entity, callback)` and `removeAudioPlaybackEntity(entity)`: the callback runs once per scene frame with the newest position report for that entity, already resolved against the scene clock, as `{ report, sceneTime, offset }` where `sceneTime` is the scene clock in the tick the renderer sampled the position. It is skipped when no new position arrived. A renderer sampling faster than the scene ticks will have appended several reports; the callback sees the freshest, which is the one a scene aligning to the playhead wants.
- `getAudioPlayback(entity)`: the latest report that carries `current_offset`, or `undefined`.
- `getSceneTimeAtTick(tickNumber)`: the scene clock recorded in a given tick, or `undefined` outside the history window. It resolves `PBVideoEvent` reports the same way.

Only one registration is offered, and it hands over the resolved reading rather than the raw report. A second entry point delivering the raw report was considered and dropped: it would have been the shorter name and the simpler-looking signature, so it would have been the one scenes reached for, and it leads straight back to every scene keeping its own history of clock snapshots. Reports that carry no position are media-state changes, which `registerAudioEventsEntity` already delivers.

`registerAudioEventsEntity` keeps its current semantics and only fires on state changes, so existing scenes receive no extra callbacks from the position reports.

The scene-clock history behind those functions lives in the SDK rather than in each scene. It is the one piece a scene could get wrong, and every scene that aligns anything with audio or video needs the same one:

```ts
// Inside audioEventsSystem. The scene clock is the engine's accumulated delta time.
const sceneTimeByTick = new Map<number, number>()   // tick -> scene clock (s), ~128 ticks kept
let sceneTime = 0
engine.addSystem((dt) => {
  sceneTime += dt
  const tick = EngineInfo.getOrNull(engine.RootEntity)?.tickNumber
  if (tick === undefined) return
  sceneTimeByTick.set(tick, sceneTime)
  if (sceneTimeByTick.size > 128) sceneTimeByTick.delete(sceneTimeByTick.keys().next().value!)
}, SYSTEMS_REGULAR_PRIORITY + 1)                   // runs before reports are delivered in the same tick

function getSceneTimeAtTick(tick: number) { return sceneTimeByTick.get(tick) }
```

The history does not estimate the round trip, and does not need to. The renderer stamps the report with the tick in which it read the position, and the scene records its clock under that same tick, so the comparison is made against the clock at the sampling moment instead of at processing time: whether a report takes one tick or ten to arrive, `getSceneTimeAtTick(report.tickNumber)` returns the same value. Removing the transport delay from the comparison is what the tick number is for.

In practice a renderer publishes `EngineInfo.tick_number` and the reports sampled in that tick in the same batch, so the lookup usually resolves inside the frame that receives the report. The history still has to tolerate a tick it has not recorded, and a scene must not discard a report on a miss.

Removing the transport delay does not make the result exact. Two terms remain, and a scene aligning to the audio it can actually hear is affected by both:

- **Sampling granularity.** `current_offset` is read once per renderer frame, from a playhead that advances in audio-buffer steps. The reading is quantised to the coarser of the two.
- **Output latency.** The playhead a renderer exposes is the decoder's read position, not the moment a sample leaves the speaker. The mixer buffer, the driver and the device add a further delay, typically tens of milliseconds, in the same direction and roughly constant for a given machine and output device. Nothing in this report captures it.

The sum of the two behaves as a per-session constant, so a scene that needs alignment finer than a tick can measure it once and subtract it. A renderer able to estimate its own output latency should expose it, and a later revision of this component may carry it as a field; until then the residual is the scene's to calibrate.

### Scene usage

A scene started its music at scene clock `songStart` (seconds). The lag between what is heard and the scene's idea of the song position is then one subtraction per report:

```ts
audioEventsSystem.registerAudioPlaybackEntity(drums, ({ sceneTime, offset }) => {
  const expected = sceneTime - songStart     // where the scene thought the clip was, at the sampling tick
  const lag = expected - offset              // > 0: the audible clip runs behind the scene clock
  applyLag(lag)                              // shift the chart, seek once, or start earlier next time
})
```

The result needs no analysis component and works on every renderer that reports positions. Its accuracy is bounded by the sampling granularity and the output latency described above, so a scene needing finer alignment than a tick should calibrate that residual once and subtract it here. A scene that prefers raw reports can read the `AudioEvent` values directly and resolve them with `getSceneTimeAtTick`.

## Alternatives considered

- **Scheduled playback** (`play_at` in scene time): the most precise option for rhythm games, but it needs a clock shared by scene and renderer and a sample-accurate scheduling path in every renderer. It composes with this proposal and can follow it; the report is still needed to verify what was scheduled.
- **Making `current_time` readable**: rejected for two reasons. First, `PBAudioSource` is a last-write-wins component owned by the scene; if the renderer also wrote `current_time`, both sides would be updating the same property at the same time and each write would clobber the other. Second, a CRDT put carries the whole component, so when a scene changes any other property (for example `volume`) it re-sends `current_time` as well, and the renderer cannot tell a re-sent value from a real seek. The property was designed to tell the renderer where to start, and only that use survives if it stays write-only. Keeping the position in the renderer-owned event component avoids both problems, exactly as `PBVideoEvent` does.
- **Higher tick rates**: they improve resolution but do not expose the playhead at all.
- **Onset detection with `AudioAnalysis`**: the workaround used to gather the measurements; Unity-only and indirect.

## Backwards compatibility

All new fields are optional. Renderers that do not implement the reports keep writing the existing events and scenes see `undefined` positions. Scenes that ignore the fields see exactly the events they see today. No component id changes.

## Implementation

- `decentraland/protocol`: the field additions (branch `feat/audio-event-playback-position`).
- `decentraland/js-sdk-toolchain`: the `audioEventsSystem` additions with tests, on `main`; the commit cherry-picks cleanly onto `auth-server`.
- `decentraland/unity-explorer`: periodic reports in `AudioEventsSystem` with a test, pending the regenerated bindings.
- `decentraland/bevy-explorer`: pending; the playhead is available from the audio backend's playback state.

## References

- ADR-148: synchronization of CRDT messages between scenes and renderer (tick numbers).
- `PBVideoEvent`, the existing precedent for position reports.
