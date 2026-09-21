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

Scenes that need to line gameplay or visuals up with sound (rhythm games, beat-driven effects, video-synchronized audio) have no way to learn where an `AudioSource` clip's playhead actually is. This document extends the `AudioEvent` component so renderers report the clip position while a clip plays, in addition to the media state changes they already report, for sources that ask for it. It mirrors what `PBVideoEvent` already does for video: the position travels in the renderer-owned event component, and the renderer never writes the scene-owned `PBAudioSource`. The change is additive, opt-in and backwards compatible.

## Context and problem statement

A scene controls audio through `PBAudioSource`: it sets `playing`, and optionally `current_time` as a seek target. Neither is a clock. `current_time` is a write-only command, and the renderer starts or resumes the clip some time after the component is applied: fetching, decoding and seeking a streamed clip all happen before the first sample plays.

Measured on the Unity explorer with a rhythm-game scene that plays a 64-second song as four synchronized instrument stems and judges key presses against a note chart, the audible drums started 100 to 250 ms after the scene's song clock, with a different value on each start. That game accepts a press within 150 ms of the charted note, so a player who plays by ear is judged late, and the scene had no signal it could use to correct itself.

The only feedback channel today is `PBAudioEvent`, which carries a `MediaState` and a monotonic counter. It says that playback started, but not when in scene time or from which clip position. Its video counterpart, `PBVideoEvent`, already reports `current_offset`, `video_length` and `tick_number` while the video plays, so scenes can do for video exactly what they cannot do for audio.

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

One field is added to `PBAudioSource` (component id 1020), by which a scene asks for the reports:

```protobuf
optional bool report_playback_position = 8; // default false
```

### Why the reports are opt-in

A position report is written whenever the playhead moves, which is far more often than a media state changes, and a scene can hold many more audio sources than video players: video playback is capped by a prioritisation mechanism in the renderer, audio is not. Reporting unconditionally would make every fire-and-forget sound effect pay for a signal that only rhythm and synchronisation scenes read.

The cost is not only traffic. `AudioEvent` is a grow-only value set with a bounded size, and the bound is per entity, so a source reporting on every playhead movement fills its own window within seconds. A scene reading the component directly, rather than through the callbacks a client library offers, would find its state-change history evicted by position reports it never asked for.

Media state changes are reported whatever the flag says, so a scene that never sets it observes exactly what it observes today.

### Why a tick number

A position report has two halves: where the clip is (`current_offset`) and when that reading was taken. The second half is what makes the first usable. A report travels through the CRDT queue and is processed by the scene some frames after the renderer sampled it, so comparing `current_offset` with the scene's clock at processing time would make every report look late by an unknown and variable amount.

The scene and the renderer do not share a clock, so the sampling moment cannot be expressed as a wall-clock time either side would trust. They do share the tick: ADR-148 defines it as one round of the scene-to-renderer message exchange, and the renderer publishes the current one in `EngineInfo.tick_number` every frame. A report stamped with the tick lets a scene reason as follows: at tick N my clock read T, the renderer says the clip was at offset X in that same tick, therefore the audible clip began at T minus X on my own clock. The correlation costs one lookup in a short history of the scene's clock per tick, and whether the report took one tick or ten to arrive does not enter the result. Removing the transport delay from the comparison is what the tick number is for.

In practice a renderer publishes `EngineInfo.tick_number` and the reports sampled in that tick in the same batch, so the lookup usually resolves inside the frame that receives the report. It still has to tolerate being asked for a tick it has not recorded, and a report must not be discarded when that happens.

This is the established convention for renderer-written results. `PBVideoEvent.tick_number` and `PBPointerEventsResult.tick_number` both carry "the tick in which the event was produced, equals to EngineInfo.tick_number", and `PBEngineInfo` documents its tick and frame numbers as correlation values. The monotonic `timestamp` field that already existed on `PBAudioEvent` stays what it was, a per-entity ordering counter, and is not a time.

### Accuracy

Correlating at the sampling tick removes the transport delay. It does not make the result exact, and a scene aligning to the audio it can actually hear is affected by two terms that remain:

- **Sampling granularity.** `current_offset` is read once per renderer frame, from a playhead that advances in audio-buffer steps. The reading is quantised to the coarser of the two.
- **Output latency.** The playhead a renderer exposes is the decoder's read position, not the moment a sample leaves the speaker. The mixer buffer, the driver and the device add a further delay, typically tens of milliseconds, in the same direction and roughly constant for a given machine and output device. Nothing in this report captures it.

The sum of the two behaves as a per-session constant, so a scene that needs alignment finer than a tick can measure it once and subtract it. A renderer able to estimate its own output latency should expose it, and a later revision of this component may carry it as a field; until then the residual is the scene's to calibrate.

### Renderer behaviour

- Renderers keep appending an `AudioEvent` on every media state change, as today, whether or not the source opted in.
- While a source that set `report_playback_position` is playing, renderers append a report carrying `tick_number`, `current_offset` and `clip_length` whenever the clip position has moved since the last report. A source that did not opt in never carries those fields, and a paused or stopped clip emits nothing until something changes.
- **Reporting rate.** A renderer writes at most one position report per tick, because the tick is the resolution of the stamp and several reports inside one tick are indistinguishable to the scene. While a clip plays it writes at least one report per second of playback, so a scene converges promptly after a start or a seek. Any rate between those bounds is an implementation choice. Existing video implementations sit inside the same band and differ from one another, which is why the bounds are stated here rather than left to each renderer.
- A position jump the scene did not command, such as a loop wrapping, is reported at once rather than held until the next scheduled report.
- Renderers never write `PBAudioSource`. That component stays scene-owned, and `current_time` keeps its meaning as a seek command.
- `tick_number` is the tick, as defined by ADR-148, in which the position was sampled. `current_offset` is the clip position at that same moment, so the pair can be compared with any scene-side clock that is also sampled per tick. State-change events written while an opted-in clip is attached carry the same fields.
- For `AudioStream` entities the fields may be omitted when the underlying player exposes no position, which is the case for a live stream with no fixed beginning.
- `current_offset` reports where the playhead is, not how much of the clip was consumed. Players commonly rewind the playhead to zero when a clip is stopped or reaches its end, so the last report of a finished clip carries zero rather than `clip_length`. A scene tracking completion should read the state transition out of `MsPlaying`, not wait for the offset to approach the length.
- `AudioEvent` remains a grow-only value set with a bounded size; position reports evict the oldest entries like any other value.

### Client libraries

The tick-to-clock correlation belongs in the client library rather than in each scene. It is the one piece a scene can get wrong, and every scene aligning anything to audio or video needs the same one.

A library keeps a bounded history of its own scene clock per tick, resolves each report against the clock at the tick the report names, and hands the scene the resolved pair rather than the raw tick. A tick absent from that history must not cause the report to be dropped. The same history resolves `PBVideoEvent` reports, so it is not audio-specific and should not be exposed as though it were.

The reference implementation for `@dcl/ecs` is linked under Implementation.

### Scene usage

A scene sets `report_playback_position` on the source it wants to follow, then reads the resolved reports. Subtracting the offset from the scene clock at the sampling tick gives the moment the audible clip began, on the scene's own clock. Keeping that origin is enough: the clip's position at any later moment is the scene clock now minus that origin, and each further report corrects it for drift.

Comparing that origin against the moment the scene believed it started the clip gives the start delay, which is what a rhythm scene shifts its chart by, or seeks once to remove. The result needs no analysis component and works on every renderer that reports positions, bounded by the accuracy described above. A scene that prefers raw reports can read the `AudioEvent` values directly and resolve them against the per-tick clock history the client library exposes.

## Alternatives considered

- **Scheduled playback** (`play_at` in scene time): the most precise option for rhythm games, but it needs a clock shared by scene and renderer and a sample-accurate scheduling path in every renderer. It composes with this proposal and can follow it; the report is still needed to verify what was scheduled.
- **Making `current_time` readable**: rejected for two reasons. First, `PBAudioSource` is a last-write-wins component owned by the scene; if the renderer also wrote `current_time`, both sides would be updating the same property at the same time and each write would clobber the other. Second, a CRDT put carries the whole component, so when a scene changes any other property (for example `volume`) it re-sends `current_time` as well, and the renderer cannot tell a re-sent value from a real seek. The property was designed to tell the renderer where to start, and only that use survives if it stays write-only. Keeping the position in the renderer-owned event component avoids both problems, exactly as `PBVideoEvent` does.
- **Higher tick rates**: they improve resolution but do not expose the playhead at all.
- **Onset detection with `AudioAnalysis`**: the workaround used to gather the measurements; Unity-only and indirect.

## Backwards compatibility

All new fields are optional and the reports are off unless a scene asks for them, so a scene that changes nothing observes exactly the events it observes today. Renderers that do not implement the reports keep writing the existing events, and a scene sees `undefined` positions there whether or not it set the flag, so scenes must treat a missing position as normal rather than as an error. No component id changes.

## Implementation

- `decentraland/protocol`: the `PBAudioEvent` and `PBAudioSource` field additions (branch `feat/audio-event-playback-position`).
- `decentraland/js-sdk-toolchain`: the `audioEventsSystem` additions with tests, including the per-tick clock history and the resolved callback, on `main`; the commit cherry-picks cleanly onto `auth-server`.
- `decentraland/unity-explorer`: `AudioEventsSystem` reports on playhead movement for opted-in sources, with the emit rule extracted so it is covered without an audio device.
- `decentraland/bevy-explorer` and `decentraland/godot-explorer`: pending for audio. Both already report video positions on a threshold rather than every frame, which is the behaviour the reporting-rate bounds above are written to accommodate.

## References

- ADR-148: synchronization of CRDT messages between scenes and renderer (tick numbers).
- `PBVideoEvent`, the existing precedent for position reports.
