
# 2021-04-06 - Decouple kernel and unity APIs

## Context and Problem Statement

As of today, kernel and unity have huge dependencies in business logic: sagas in TS, requests are made in TS, and everything is used from Unity.

That generates coupling between technoligies and teams, generating blockers and planning problems.

## Considered Options

* Continue as it is today
* Start migrating new features that previously required a Saga to unity directly. ✅

## Decision Outcome

* Start migrating new features that previously required a Saga to unity directly. ✅

New features for the ECS/SDK will have the common product process (RFC, roadmap, backlog, refinement). Alvaro will gather together the team when necessary to discuss implementation of new changes to the SDK.

CLI should be handled in the same way as the kernel and SDK developments.

For Unity migration, it may be required to expose some functionalities from kernel directly, like Ethereum logic, comms, or signed requests.

## Participants

- Alvaro
- Brian
- Mendez
- Nico Chamo