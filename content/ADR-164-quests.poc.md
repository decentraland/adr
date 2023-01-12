---
layout: adr
adr: 164 
title: Quests PoC 
date: 2022-12-28
status: Draft 
type: RFC 
spdx-license: CC0-1.0
authors:
  - guidota 
---

## Abstract

The Quests System is an important feature that facilitates users to explore the world, unlock achievements and potentially receive rewards. A quest is a series of steps or tasks that a user has to complete. Each step or task has an acceptance criteria to consider it as done. A quest designer has to define the steps and the order or the path to the end, so the quest is finished when those steps are completed.

## Context, Reach & Prioritization

Users usually to complain that when they enter the world and after a certain time, they don't know what to do, or where to go and feel lost. This problem impacts directly on user retention because of a possible bad first impressions on the platform.

Having a Quests System can solve part of the problem, giving users a reason to stay and have a nice time. This feature would also allow content creators to creatively increase engagement.

The last sentence is important to remark on since it makes it different to any other Quest System you may know from video games, where the quests are defined by the owners or internal teams. In this case, we're opening the doors to creators to design their own quests and to developers to create tools to improve quests ecosystem.

On the other side, the system (backend) should be in charge of tracking and validating the progress and accepting new quest deployments.

Having said that, there are three well-known actors with corresponding components:
 - Users: Explorer and Kernel 
 - Designers: Visual tool and/or CLI
 - The System: Backend

For the sake of fast iteration and discovery, this document will explore the boundaries and scope of a Proof of Concept for the described Quests System.

## Solution Space Exploration

The following sections will describe what would be necessary, including some alternatives, for a Proof of Concept where designers can submit quests and users can experience them while the system exposes some metrics. 

### Quest definition

A Quest definition will include steps/tasks required for completion. It would be defined technically speaking as a graph, since it may have a non-linear complexity.

Defining a valid quest definition in the form of a graph requires the following conditions:
- it should have only one start node.
- it should have at least one end node.  
- it may have cycles but not endless loops.
- it may have conditional nodes.

### Explorer

A minimal global UI for quest tracking and receiving real-time notifications about the progress requires the following:

- Users should have a UI where to see their current quests (in progress) with their status. 
- Users should be able to cancel/drop a quest.
- Users should be able to discover public quests in World. (NPC Givers)

This UI may be developed using the SDK to build reusable UI components to be used in any Explorer implementation.

### Kernel

A communication channel with the system, built in the Kernel, notifying events that happen in world and receiving updates is required to keep the Explorer up to date.
The responsibilities of this Kernel module are the following:
- The Kernel should be responsible of receiving and notifying updates to the Explorer.
- The Kernel should be able to receive requests from the Explorer to start a quest and ask for it to the System.
- Kernel should be able to notify in world events to the System, in order to make progress.

### Actions

A set of predefined actions may be provided to the designers and users, in order to define the Quests steps and make progress. 

- Location
- NPC Interaction
- Play Emote
- TBD

### Quest Designer

Build a tool/CLI to easily design Quests, without conflicting with existing definitions.

Using the predefined actions, the designer should be able to create a Quest definition with steps and requirements. The output of a quest definition is a graph which will be persisted in a convenient form.

### Backend

The Quests System will expose an API with convenient endpoints for Designers and Users. 

It also will process all events received from Explorer/Kernel sessions and make progress to corresponding Quest instances.

Users may ask for quests state and metrics, but completed Quests may be stored for a certain time if the system needs space or it may grow indefinitely.

The system will have the following requirements:
- The system should be able to process all events in parallel, in order to make progress in corresponding Quests.
- The system should be able to accept connections and subscriptions to Quest instances.
- The system should be able to send updates to subscribed users.
- The system should be able to respond to Quests state requests.
- The system should expose metrics related to the Quests.

### Workflows: User and quests interaction

#### Start Quest

There would be several ways to discover a Quest. The user may be interested to start any of them. 

```mermaid
sequenceDiagram
    Quest Discovery-->>Explorer/Kernel: New quest available
    Explorer/Kernel->>Quest Server: Send start quest request 
    Quest Server ->> Explorer/Kernel: Send start quest response
    loop
        Quest Server -->> Explorer/Kernel: Send quest updates
    end
```

#### Track Progress 

Client should make progress by sending verified events
```mermaid
sequenceDiagram
    Explorer/Kernel ->> Catalyst: Ask for signed event 
    Explorer/Kernel ->> Quest Server: Send signed event
    loop
        Quest Server -->> Explorer/Kernel: Send quest updates
    end
```

#### Real time updates

Once the API is defined, the system may expose different ways to query quest states, one of them is to use some long living channel (let's say WebSockets).

```mermaid
sequenceDiagram
    Explorer/Kernel ->> Quest Server: Send subscription request
    loop
        Quest Server -->> Explorer/Kernel: Send quest updates
    end
```

### Workflows: Quest Designer 

##### Deploy new quest or modify existing quest

When the quest definition is ready, the Quest Designer tool would be able to send the new or modified version to the Quest Server. The request should include the author signature.

```mermaid
sequenceDiagram
    Quest Designer ->> Quest Designer: Quest Definition 
    Quest Designer ->> Quest Server: Send Quest definition and signature
    Quest Server ->> Quest Designer: Send Quest submission response 
```

#### Retrieve quest stats

The quest author may be interested in their quest stats, how many users started or completed them and other information like starting and ending times.

```mermaid
sequenceDiagram
    Quest Designer ->> Quest Server: Query Quest state (include signature to validate authorship)
    Quest Server ->> Quest Designer: Send Quest state 
```

## Specification

This section describes the technical details on how the Quests systems should be implemented. Each part of the quests system has alternatives to discuss and choose from.

### Communication between the System and Kernel

In order to receive real time updates to keep the user updated on the quests they're interested, there are two options to handle the communication:
- Use a socket (peek any protocol like WebSocket, WebRTC, WebTransport, QUIC, etc).
- Use a HTTP polling mechanism.

### Quest Model persistence

When a Quest definition is deployed to the System, it should be persisted in some form, the alternatives are:
- Human Readable (JSON, toml, etc)
- Binary
No matter which format is, serialization/deserialization should be easy and fast and possible in any language.

Also, the location of the persisted quests is important, for example:
- Store in DB
- Store as a File (S3 or any shared instance)

### Quest Designer

Designing a quest should be a good experience, without friction and intuitive.

The solution should take into account the possibility of editing the quests visually, deployment them easily and having an easy to use and accessibile interface. To fulfill these requirements, the following can be done:
- Create a hosted service where designers can access as a WebApp.
- Provide executables or guidelines to run the application.

Authenticating designers may be required, so the alternatives are:
- Use Decentraland Login and potentially add wallet validations to restrict deployments to land-owners or other conditions.
- Use Service custom authentication and API tokens.

### Backend

To provide a robust system, the services should be scalable, easy to deploy and provide metrics.

Scalability must be thought from the beginning:
- Horizontal scaling: the services must be able to escale horizontally and communicate between their instances.
- Vertical scaling: may consider the possibility of service redeployment without down-time.

It should be easy to deploy:
- CI/CD
- Easy to follow and clear pipelines

It should provide observability:
- Instrument application to collect logs, traces and metrics
- Domain related metrics
- Performance metrics

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

