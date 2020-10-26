# Deployment debouncing

## Context and Problem Statement

How do we debouncing profile/scene deployments to avoid DDoS and wasted bandwidth?

- As of today we only deploy profiles when changing the avatar
- Soon, a new deployment will happen after mute/unmute

## Considered Options

1. Server side debouncing
    * Always receives messages, discards extra messages and relays the non-discarded ones
    * Client may need to understand discarded messages responses

2. Client side debouncing (deployment)
    * Group updates in localStorage and send them in background

3. Client side debouncing (mute button)
    * Group mute/unmute changes and send them **this is happening from PBosio's side** (1sec debounce)

4. Do nothing
    * Scaling problems in content servers (in terms of deployments and platform, not infra)


## Decision Outcome

We decided to do Client side debouncing (both options 2 and 3). We may measure deployments in the future to revisit the server conversation.

## Participants

- Marcos NC
- Pablo De Haro
- Pato Bossio
- Nico Chamo
- Pravus

Date: 2020-10-26
