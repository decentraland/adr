---
layout: adr
adr: 213
title: Quests UI
date: 2023-04-17
status: Review
type: Standards Track
spdx-license: CC0-1.0
authors:
  - guidota
---

## Abstract

This ADR describes the decision-making process for implementing the user interface (UI) of the Quests System for a metaverse. We evaluated three potential implementation options and chose the one that strikes the best balance between flexibility and speed.

## Context, Reach & Prioritization

The Quests System's user interface is a crucial component of the metaverse experience, as it enables users to interact with quests and track their progress. As part of the UI design process, we need to determine if we want to use the SDK to create the UI components and, in that case, how. The Explorer is the term used for our frontend implementation, which can take different forms. We need to decide how to balance the use of the SDK with the needs of the Explorer to create a user-friendly and consistent UI across all implementations.

It is important to prioritize the decision-making process to ensure we have enough time to design and implement the UI components before the launch of the Quests System. While using the SDK to create the UI components has advantages, there are also limitations to what we can achieve with it. For instance, while we can use the SDK to implement components that support our use case, there may be gaps we cannot address. Ultimately, we need to find a solution that allows us to create a visually appealing and functional UI that meets the needs of our users.

## Solution Space Exploration

There are three potential solutions for designing the Quests System UI:

Using pure SDK components: In this approach, we would create the UI using only the components provided by the SDK. While this approach gives consistency across implementations, there may be some gaps that we would need to fill by implementing additional components.

Using SDK to communicate the UI state to the Explorer: In this approach, we would use the SDK to store the UI state and spread it to the Explorer. This would reduce the required communication between the Explorer and the backend to retrieve information needed to render the UI. However, we should ensure that the SDK's capabilities are sufficient for our use case.

Using the Explorer for everything: In this approach, each Explorer implementation would be responsible for implementing the entire UI. While this approach provides the most flexibility, it also means that each implementation would need to re-do everything, which could result in inconsistent UIs across different implementations.

Each of these approaches has its benefits and drawbacks, and we need to carefully consider them before making a decision.

## Specification

The technical specification for this approach will involve defining the specific data storage mechanisms that will be used in the SDK, as well as the frontend rendering logic. It will also require integration between the two systems to ensure they are communicating effectively. The UI design should be developed in parallel with the technical implementation.

Based on the mockups we have, the Quests System UI should include the following components:

Quests HUD: A list of active quests with current tasks. This component should provide a quick overview of the user's progress in each quest.

Quests Log: A window containing all the details for each quest, including name, description, steps, and rewards. Users should be able to view their progress and access information about each one, and also be able to abandon it by clicking a button in this UI.

New Quests Offer: A pop-up with a proposal to start a new quest, with buttons to accept or decline. This component should make it easy for users to begin a new one and ensure they don't miss any available ones.

Step Completed Popup: Whenever a quest step is completed, a feedback message or animation should be shown to indicate progress and keep the user engaged.

## Decision

After exploring the available options, we have decided to use the Explorer for everything. It would be nice to have the first option (develop new SDK components), so it will be considered in the future. The decision is based on the fact that using the Explorer for everything provides more flexibility and control over the UI.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
