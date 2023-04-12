---
layout: adr
adr: 194
title: Quests PoC - User tracking
date: 2023-03-10
status: Draft 
type: RFC 
spdx-license: CC0-1.0
authors:
  - guidota 
---
## Abstract

This document proposes a protobuffer definition and implementation plan for a client-side quests system that can be used in the context of virtual worlds and games. The focus of this document is on user tracking and event processing.

It's a continuation of the previous Quests PoC document: [ADR-164](https://adr.decentraland.org/adr/ADR-164).

## Context, Reach & Prioritization

The implementation of a quests system in a virtual world or game can greatly enhance the player experience and provide a sense of achievement and progress. This feature is particularly important for virtual worlds and games that have an open-world structure and rely on player-generated content. A client-side quests system can help guide players towards engaging with the available content and provide incentives for players to create their own content.

## Solution Space Exploration

The client will use the Decentraland RPC and protocol library to communicate with the QuestsService backend. (WebSockets + ProtoBuffers) 

```proto
syntax = "proto3";
package decentraland.quests;

message User {
  string user_address = 1;
}

message StartQuestRequest {
  string user_address = 1;
  string quest_id = 2;
}

message StartQuestResponse {
  /* There are a few valid reasons not to be accepted:
  *  - Quest is not found
  *  - Quest is deactivated (the owner deleted it)
  *  - User already started the quest
  *  - Internal errors (DB connection failed or something like that) */
  bool accepted = 1;
}

message AbortQuestRequest {
  string user_address = 1;
  string quest_instance_id = 2;
}

message AbortQuestResponse {
  /* There are a few valid reasons not to be accepted:
  *  - Quest instance is not found
  *  - Quest instance is from another user 
  *  - Quest instance already aborted
  *  - Internal errors (DB connection failed or something like that) */
  bool accepted = 1;
}

message Event {
  string user_address = 1;
  Action action = 2;
}

message EventResponse {
  optional fixed32 event_id = 1;
  bool accepted = 2;
}

// Example:
// Action {
//   type: "Location",
//   parameters: {
//     x: 10,
//     y: 10,
//   }
// }
message Action {
  string type = 1;
  map<string, string> parameters = 2;
}

message Task {
  string id = 1;
  optional string description = 2;
  repeated Action action_items = 3;
}

message StepContent {
  repeated Task to_dos = 1;
  repeated string task_completed = 2;
}

message QuestState {
  // Every step has one or more tasks. 
  // Tasks description and completed tasks are tracked here.
  map<string, StepContent> current_steps = 1;
  fixed32 steps_left = 2;
  repeated string steps_completed = 3;
  repeated string required_steps = 4;
}

message UserUpdate {
  oneof message {
    repeated QuestState quest_state = 1;
    fixed32 event_ignored = 2;
  }
}

service QuestsService {
  // User actions
  rpc StartQuest(StartQuestRequest) returns (StartQuestResponse) {}
  rpc AbortQuest(AbortQuestRequest) returns (AbortQuestResponse) {}
  rpc SendEvent(Event) returns (EventResponse) {}

  // Listen to changes in quest states and event processing updates
  rpc Subscribe(UserAddress) returns (stream UserUpdate) {}
}
```

The QuestsService is a service defined in the protocol buffer specification, which consists of four RPC (remote procedure call) methods:
- StartQuest: This method is used to start a quest for a user with the given user address and quest ID. It returns a response indicating whether the quest was accepted or not.
- AbortQuest: This method is used to abort a quest instance for a user with the given user address and quest instance ID. It returns a response indicating whether the quest instance was accepted or not.
- SendEvent: This method is used to send an event with the given address, type, and parameters.
- Subscribe: This method is used to subscribe to changes in quest states and event processing updates for a user with the given user address. It returns a stream of updates for the subscribed user.

Once this client is implemented, it would be used to develop a Global Scene in charge of the Quest UI and user tracking logic. Using the SDK UI components is recommended, so it works on any Explorer implementation.

### Quests UI
For this PoC, the UI will show the list of current quests and their states, i.e., showing the completed and next steps for each quest with their respective descriptions. 

### Quest User Tracking
Ideally, users should not send repeated or non interesting events to the backend, to avoid extra communication and event processing. This piece of code would contain the logic to know which events are interesting and not yet sent, according to the current state of the user's quests. Finally, sending those events should be part of this scene code.
A non-interesting event is an user action that doesn't make any progress in any quest.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

