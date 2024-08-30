---
layout: adr
adr: 204
title: Comms Architecture for new client
date: 2024-08-21
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:
  - pentreathm
  
---

## Abstract

The current Decentraland client communication protocol effectively supports user scaling but has inherent design limitations that restrict certain functionalities, such as content casting, serverless multiplayer experiences, and scene-hosted events with moderators. This ADR explores the architectural decisions behind a new communication protocol designed to overcome these limitations. The new architecture, incompatible with the existing implementation, will be deployed in a forthcoming client version.

## Context, Reach & Prioritization 

The objective is to incorporate the following functionalities without overburdening the client implementation with additional complexities, while maintaining the ability to stream the world and visualize users in surrounding areas. This entails:

- **Authorization Management**: Empower scene owners or authorized third parties to manage content casting and control voice chat accessibility within a scene.
- **Enable Content Casting**: Facilitate voice and video management, even when multiple clusters (islands) of users are present within a scene.
- **Scalability**: Retain a clustering mechanism to ensure efficient crowd management when rooms reach maximum occupancy.
- **Message Handling**: Effectively manage the influx of messages received by peers within a cluster, preventing congestion and data transfer inefficiencies.
- **Consistency**: Ensure consistent perception of avatars/users within a scene, including scene state, content casting, and proximity of avatars.
- **Uniform Communication Transport**: Maintain consistency across all environments (in-world, DCL editor, etc.) to ensure uniform features and behaviors.


## Decision



## Deadline


Date: TBD

## Consequences

