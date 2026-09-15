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

Scenes that need to line gameplay or visuals up with sound (rhythm games, beat-driven effects, video-synchronized audio) have no way to learn where an `AudioSource` clip's playhead actually is. This document extends the `AudioEvent` component so renderers report the clip position periodically while a clip plays, in addition to the media state changes they already report. The change is additive and backwards compatible.

## Context and problem statement

A scene controls audio through `PBAudioSource`: it sets `playing`, and optionally `current_time` as a seek target. Neither is a clock. `current_time` is a write-only command, and the renderer starts or resumes the clip some time after the component is applied: fetching, decoding and seeking a streamed clip all happen before the first sample plays.

Measured on the Unity explorer with a rhythm-game scene that plays a 64-second song as four synchronized instrument stems and judges key presses against a note chart, the audible drums started 100 to 250 ms after the scene's song clock, with a different value on each start. That game accepts a press within 150 ms of the charted note, so a player who plays by ear is judged late, and the scene had no signal it could use to correct itself.

The only feedback channel today is `PBAudioEvent`, which carries a `MediaState` and a monotonic counter. It says that playback started, but not when in scene time or from which clip position. Its video counterpart, `PBVideoEvent`, already reports `current_offset`, `video_length` and `tick_number`, so scenes can do for video exactly what they cannot do for audio.

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

### Renderer behaviour

- Renderers keep appending an `AudioEvent` on every media state change, as today.
- While an `AudioSource` is in `MS_PLAYING`, renderers also append a report at least every 15 scene ticks (about twice a second at the reference tick rate), carrying `tick_number`, `current_offset` and `clip_length`.
- `tick_number` is the tick, as defined by ADR-148, in which the position was sampled. `current_offset` is the clip position at that same frame, so the pair can be compared with any scene-side clock that is also sampled per tick. State-change events written while a clip is attached carry the same fields.
- For `AudioStream` entities the fields may be omitted when the underlying player exposes no position.
- `AudioEvent` remains a grow-only value set with a bounded size; periodic reports evict the oldest entries like any other value.

### SDK

`audioEventsSystem` in `@dcl/ecs` gains:

- `registerAudioPlaybackEntity(entity, callback)` and `removeAudioPlaybackEntity(entity)`: the callback runs for every report, position updates included.
- `getAudioPlayback(entity)`: the latest report that carries `current_offset`, or `undefined`.

`registerAudioEventsEntity` keeps its current semantics and only fires on state changes, so existing scenes receive no extra callbacks from the periodic reports.

### Scene usage

A scene that keeps its own song clock records the wall-clock time at which it processed each tick, then aligns on every report:

```ts
audioEventsSystem.registerAudioPlaybackEntity(drums, report => {
  if (report.currentOffset === undefined || report.tickNumber === undefined) return
  const heardAt = songTimeAtTick(report.tickNumber)          // ms, from EngineInfo.tickNumber samples
  const offset = heardAt - report.currentOffset * 1000       // > 0: audio runs behind the chart
  applyOffset(offset)                                        // shift the chart, seek once, or start earlier next time
})
```

The result is exact to one tick, needs no analysis component, and works on every renderer that reports positions.

## Alternatives considered

- **Scheduled playback** (`play_at` in scene time): the most precise option for rhythm games, but it needs a clock shared by scene and renderer and a sample-accurate scheduling path in every renderer. It composes with this proposal and can follow it; the report is still needed to verify what was scheduled.
- **Making `current_time` readable**: it is a command with put semantics in a last-write-wins component; turning it into a clock would fight the scene's own writes on every tick.
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
