---
layout: adr
adr: 154 # replace this number for the PR or ISSUE number
title: Multiplayer out of the box
date: 2022-12-15
status: Idea # pick one of these
type: RFC # pick one of these
spdx-license: CC0-1.0
authors:
  - nearnsahw # this is your github username
# remove the following line! it exists to render the template nicely
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

The purpose of this feature is to make it easier for content creators to build scenes where what one player changes is seen and shared by all other players there. This today is possible but very hard, and because of that very few creators explore those options.

The exact details about how this feature is to be implemented are yet to be defined.


## Context, Reach & Prioritization

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

There are currently very few scenes where what one player does affects another. This results in very few truly social shared experiences. Mostly each player is in a single-player experience, watching other avatars walking around in their own separate dimension. This is confusing to new players, and severely limits what can be done with Decentraland as a social space. This is not just about making multiplayer games easier, the environment and its changes can be used a means for socializing, and can enhance every kind of experience.

We believe few people create these kinds of experiences because it’s hard. Our SDK doesn’t offer any way to simplify the syncing of state between players. Content creators have to either set up a whole server themselves, or manually send messages and then interpret them with custom logic. This can also result in a buggy experience as messages could arrive out of order and different player’s chances can enter into conflict.

## Solution Space Exploration

<!--
Discuss the potential alternatives and their impact. What alternatives are being considered, their benefits, their costs (team resources, money, time frames), and mitigations for any drawbacks.
-->

The proposed solution involves allowing content creators to easily mark an entity or a component as synced. Once that’s done, if any properties change in a marked component or entity, these changes are shared with all other players who are sharing an island.

**The foundations are already built**

The SDK7 is designed from the ground up to enable this feature. Several elements are already in place:

- CRDTs (Conflict-free Resolution Data Transfer): Every message that reaches the scene undergoes checks to ensure that it’s being interpreted in the right order in relation to other messages. This ensures that all players are seeing the same final state, even if there are delays in the network, or if there are multiple players simultaneously making changes.
- Data Oriented Design: Much of the SDK has changed to focus on optimizing how data is dealt with and interpreted. Thanks to this, everything is data, everything is a property in a component. This consistent structure makes it easy to share updates to any component in any entity in very much the same way.

**Change comms transport**

The messages that are shared between players use the same comms infrastructure that is used to share updates in player positions, emotes, etc. This infrastructure uses peer-to-peer messaging, which is a very decentralized and affordable approach, but not the fastest. There are already efforts being made to make this comms infrastructure switchable, allowing catalyst servers to change the default P2P comms for a centralized but faster alternative like WebSockets. This feature is beyond the scope of this document, but it’s important to note that the out-of-the-box synchronization of entities will use whatever transport is assigned by the catalyst. So thanks to this, it will also be possible to sync changes in the scene at faster speeds if such an infrastructure is chosen.

**Other considerations**

- Are we correctly handling the sharing of state with players who walk in after the changes took place?  For example: Player A opens a door, Player B was already there so sees the change. One minute later, while both Players A and B are still in the scene, Player C walks in. Does the change that opened the door reach Player C somehow? Or is Player C seeing a different state from the others, until the door is toggled again?
- Can this be easily used maliciously? Can someone inject messages that the scene interprets as changes to synced entities and cheat a competitive game or break the experience for others?

## Specification

The following design decisions are still pending. These will shape what the final implementation looks like.

- Should content creators flag content to be synced at an entity level, or at a component level? 
- Will this be flagged via adding a new kind of component, or as a property that will be available on every component?
- Should syncing be the default behavior of any new entity? Or should it be opt-in for each entity? Or maybe there can be a top-level setting for toggling the default? Maybe sync settings are inherited to child entities, so it can be possible to mark all entities as synced by flagging the root entity of the scene.


<!--
The technical specification should describe the syntax and semantics of any new feature.
-->

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
