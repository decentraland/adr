---
layout: adr
adr: 156 # replace this number for the PR or ISSUE number
title: Scene triggers custom animations
date: 2022-12-15
status: Draft # pick one of these
type: RFC # pick one of these
spdx-license: CC0-1.0
authors:
  - nearnshaw # this is your github username
# remove the following line! it exists to render the template nicely
slug: /adr/scene-triggers-custom-animations
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

This is a proposal to add a feature to the SDK to allow scene creators to include custom avatar animations as part of a scene’s content and to trigger these animations on players.  The scene will then be able to use these whenever they make sense in a scene’s mechanics.

## Context, Reach & Prioritization

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

In most Decentraland experiences, you can see other players standing still even if they’re actively engaging with the scene, just standing motionless. This limits a lot of the social aspects of playing with others. It also makes you wonder if other players are even playing, if they’re not even at the keyboard, or if they’re just confused trying to understand the rules.

While playing alone, these customized animations can also bring a lot more fun into a scene by making our actions more lively and leaving less to our suspension of disbelief.

## Solution Space Exploration

<!--
Discuss the potential alternatives and their impact. What alternatives are being considered, their benefits, their costs (team resources, money, time frames), and mitigations for any drawbacks.
-->

Discuss the potential alternatives, their impact, which ones are being considered, their benefits, their costs (team resources, money, time frames), and mitigations for any drawbacks.

## Specification

<!--
The technical specification should describe the syntax and semantics of any new feature.
-->

It should be possible for content creators to upload files that include instructions for an avatar animation, following the same limitations as the uploaded files for NFT emotes. These animations, however, won’t be NFTs but animations that the scene can trigger on any player visiting it.

The scene can trigger these animations on players whenever they make sense in the game’s mechanics. For example, Wondermine could play a “swing” animation whenever a player is mining a meteor, or the casinos could play a “show-cards” animation whenever the player plays their hand in a poker game. A fighting game could include animations for throwing punches, animations for receiving damage, and animations for dying.

As happens currently with all player animations, other players that are around see the animations, the scene creator doesn’t need to do anything extra for this to happen.

As with the triggering of default animations today, the scene should include special permissions to allow it to trigger emotes on an avatar.

Since the animations are downloaded together with the scene's content, there's a corner case that needs to be handled gracefully: Player A sees Player B far away, but has not downloaded the scene where Player B is standing. The scene triggers an animation on Player B, but Player A doesn't have that animation downloaded. In this scenario, it's acceptable for Player A to not see the animation, since Player A is also not seeing the scene that gives that animation context.


**Syntax and semantics**

This could be implemented via a component that is added to the player entity, which can be used to trigger animations either from the default list of animations, or from any animation file that is uploaded with the scene. 

**Open questions**

- Should the scene also be able to control the avatar locomotion animations?  For example, replace the default walk, run or jump animations for crawling, or skating or holding a gun, or whatever makes sense in the scene. Is this easy to achieve?
- Can scene custom animations also be able to spawn images or geometries? Like the hearts or the clap icons from default animations.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
