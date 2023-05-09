---
adr: 232
date: 2023-05-09
title: Add validation that prevents repeated wearables in profiles
status: Draft
authors:
  - marianogoldman
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

Currently, it is possible to add the same wearable to a profile multiple times.
This caused some issues in the Explorer, that was not expecting this to 
happen. Even though the issue was fixed in the client, it is still possible 
for other clients to continue submitting profiles with repeated wearables.

This ADR proposes a new validation to prevent it.

## Proposed solution

Add a validation to be run on profile deployment that prevents repeated
wearables from being submitted.

## Deadline

    ADR75_DEADLINE: 2023-05-09T12:00:00Z
    Unix Timestamp: 1680571200000
