---
adr: 283
date: 2025-05-30
title: NTP Time Syncronization
authors:
  - gonpombo8
status: Final
type: Standards Track
spdx-license: CC0-1.0
---

# ADR-283: Time Synchronization

## Abstract

This document describes a time synchronization mechanism for the Decentraland Unity client that provides a unified source of synchronized time across all clients. By implementing Network Time Protocol (NTP) synchronization and introducing the `PBSyncedClock` component, this ADR establishes a foundation for any time-dependent feature in Decentraland that requires coordination across multiple clients. The initial implementation enhances `PBTween` with synchronized timestamps, but the system is designed to support animations, video players, sounds, and other time-sensitive features.

## Context, Reach & Prioritization

The Decentraland platform lacks a unified time synchronization mechanism, which affects multiple systems that rely on coordinated timing across clients:

- **Tweens and Moving Objects**: Platforms, elevators, and doors appear in different positions for different users
- **Animations**: Character animations and visual effects start at different times, breaking immersion
- **Video Players**: Synchronized video playback for shared viewing experiences is impossible
- **Audio**: Background music and sound effects cannot be synchronized across users
- **Timed Events**: Scheduled events or time-based game mechanics lack coordination

Currently, all these systems rely on local client time, which leads to:
- **Drift between clients**: Each client's local clock differs, causing desynchronization
- **Broken experiences**: From gameplay issues (falling through platfloorms) to aesthetic problems (unsynchronized dance animations)
- **Limited creative possibilities**: Creators cannot build experiences that require precise timing coordination

This limitation affects:
- **Scene creators**: Who need synchronized time for games, events, and multimedia experiences
- **End users**: Who experience inconsistent gameplay and broken immersion
- **Platform capabilities**: Limiting the sophistication of experiences that can be built

The prioritization of this feature is driven by:
1. **Foundational requirement**: Time synchronization is a prerequisite for many advanced features
2. **Multiple use cases**: One implementation benefits tweens, animations, video, and audio
3. **Community demand**: Creators consistently request better synchronization capabilities

## Solution Space Exploration

### Option 1: Server-Sent Timestamps (Rejected)
Relying solely on timestamps sent by the realm server was considered but rejected because:
- Less robust than standard time synchronization protocols
- Potentially less accurate due to variable network latency
- Wouldn't work in scenarios where the client is not connected to a realm

### Option 2: Local Time Only (Current State - Rejected)
Continuing with the current system of local client time was rejected as it prevents any form of synchronized experience.

### Option 3: NTP-Based Synchronization (Selected)
Implement client-side NTP synchronization with reliable time servers. This approach:
- Uses an industry-standard protocol designed for distributed time synchronization
- Provides microsecond-level accuracy when properly implemented
- Serves as a foundation for all time-dependent systems
- Gracefully handles network issues with fallback mechanisms

## Specification

### Protocol Changes

#### New Component: PBSyncedClock
A new Protocol Buffers component will be added at `proto/decentraland/sdk/components/synced_clock.proto`:

```protobuf
syntax = "proto3";

package decentraland.sdk.components;

import "decentraland/sdk/components/common/id.proto";
option (common.ecs_component_id) = 1099;

// PBSyncedClock provides synchronized time information based on NTP server data
// This component can be used to maintain consistent time across all clients
message PBSyncedClock {
  // The current synchronized time (in milliseconds since epoch)
  uint64 synced_timestamp = 1;

  // The synchronization status
  SyncStatus status = 7;
}

// Status of time synchronization
enum SyncStatus {
  // The component is not yet synchronized with the NTP server
  SS_UNINITIALIZED = 0;

  // The component is currently attempting to synchronize with the NTP server
  SS_SYNCHRONIZING = 1;

  // The component is successfully synchronized with the NTP server
  SS_SYNCHRONIZED = 2;

  // The component failed to synchronize with the NTP server
  SS_ERROR = 3;
}
```

#### Enhanced PBTween Component
The existing `PBTween` component will be modified to include:
```protobuf
message PBTween {
  // ... existing fields ...
  optional uint64 start_synced_timestamp = 9; // timestamp (in milliseconds) when the tween started, allows synchronization across clients
}
```

### Implementation Details

#### Phase 1: NTP Time Synchronization
1. **Time Synchronization Client**
   - Connect to reliable NTP servers (e.g., `time.google.com`, `pool.ntp.org`)
   - Alternatively, use a Decentraland-hosted time service
   - Implement standard NTP offset calculation:
     - Round-trip delay: `(T4 - T1) - (T3 - T2)`
     - Clock offset: `((T2 - T1) + (T3 - T4)) / 2`

2. **Synchronization Process**
   - Synchronize on client startup
   - Re-synchronize periodically (every 60 seconds)
   - Implement exponential backoff for retry attempts

#### Phase 2: SyncedClock System
1. **TimeComponentSystem**
   - Create singleton entity with `PBSyncedClock` component
   - Update `synced_timestamp` on every engine tick
   - Manage synchronization status transitions
   - Provide API for other systems to query synchronized time

2. **Error Handling**
   - Fallback to local time when synchronization fails
   - Log synchronization errors for debugging
   - Implement recovery mechanisms

#### Phase 3: System Integration
1. **Tween System (Initial Implementation)**
   - `createTweenSyncSystem` (introduced in [js-sdk-toolchain PR #1121](https://github.com/decentraland/js-sdk-toolchain/pull/1121)) automatically injects `start_synced_timestamp` for every `PBTween` when a synchronized clock is available, so content-creators do **not** need to set this field manually.
   - For tweens created **before** the clock is synchronized, the system back-fills the correct `start_synced_timestamp` once the clock becomes available, preserving the original offset.
   - Tweens are processed only when the `SyncedClock` status is `SS_SYNCHRONIZED` and when network initialization is complete, preventing visual glitches during the bootstrap phase.
   - Backward tweens and restart sequences are handled correctly—when a tween restarts, the system resets the sync timestamp to ensure deterministic playback across clients.
   - Maintains full backward compatibility: scenes authored with older SDK versions continue to work, simply running on local time if synchronization is disabled or unavailable.

2. **Future Integrations**
   - **Animation System**: Use synchronized time for animation start times
   - **Video Player**: Synchronize video playback position across clients
   - **Audio System**: Coordinate background music and sound effects
   - **Event System**: Schedule and trigger events at precise synchronized times

### Use Cases

#### Immediate (Tweens)
1. **Moving Platforms**: Consistent position across all players
2. **Elevators**: Synchronized arrival/departure times
3. **Rotating Objects**: Identical rotation state for all users
4. **Doors and Gates**: Open/close at the same moment

#### Future Possibilities
1. **Synchronized Animations**: Dance performances, cutscenes, visual effects
2. **Shared Video Experiences**: Watch parties, presentations, tutorials
3. **Musical Experiences**: Synchronized background music, rhythm games
4. **Timed Events**: Countdowns, scheduled activities, time-based puzzles

### Backward Compatibility
- Existing systems continue to work with local time if not updated
- `PBTween` without `start_synced_timestamp` behaves as before
- Gradual adoption allows systems to migrate when ready

## Consequences

### Positive
- **Unified Time Source**: Single source of truth for all time-dependent systems
- **Extensible Foundation**: Easy to add synchronization to new features
- **Improved User Experience**: Consistent behavior across all clients
- **New Creative Possibilities**: Enables sophisticated synchronized experiences

### Negative
- **Increased Complexity**: Adds NTP synchronization logic to the client
- **External Dependencies**: Relies on NTP servers or dedicated infrastructure
- **Initial Sync Delay**: Brief period at startup where time may not be synchronized

## Security Considerations
- NTP servers must be trusted sources

## Performance Considerations
- Minimal overhead: NTP synchronization happens infrequently (every 60 seconds)
- `PBSyncedClock` update is lightweight (single timestamp update per frame)
- Systems opt-in to synchronized time only when needed

## Open Questions
1. Should Decentraland host its own NTP servers or rely on public infrastructure?

## RFC 2119 and RFC 8174

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## Copyright

Copyright and related rights waived via CC0-1.0.