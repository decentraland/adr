---
adr: 236
date: 2023-05-12
title: Add validation that prevents scene thumbnails from being URLs
status: Review
authors:
  - marianogoldman
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

Currently, it is possible to add a full URL as a thumbnail in the scene 
display metadata. That fields should only allow referencing a file that is 
part of the scene deployment.

This ADR proposes a new validation to prevent it.

## Proposed solution

Add a validation to be run on scene deployment that forces scenes that have 
a thumbnail to be one of the files embedded in the deployment.

## Deadline

    ADR236_DEADLINE: 2023-05-19T12:00:00Z
    Unix Timestamp: 1681660800000
