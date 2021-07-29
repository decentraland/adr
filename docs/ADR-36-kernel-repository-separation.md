---
team: sdk
date: 2021-07-27
author: "@menduz"
---

# Kernel repository separation

## Context and Problem Statement

As of today, we already decoupled the `renderer` (decentraland/unity-renderer) from the `explorer` repository. And we are in the process of decoupling `website` (decentraland/explorer-website). The ECS and building tools are also in the path of being migrated to their own repositories (decentraland/js-sdk-toolchain).

The context of the problem is around the tactical/execution aspect. Since the changes affect directly the publishing cycles and processes of every package. We must optimize not blocking development and also not breaking things in a way that prevent us from releasing hotfixes.

## Considered Options

* **Merge https://github.com/decentraland/explorer/issues/2479 to decentraland/explorer**  
  It would disable the publishing of website, preventing any team to perform releases to `decentraland-ecs` and `play.decentraland.org/zone`.
  That would remain that way until we have 
* **Create a decentraland/kernel repository**  
  To contain only the `kernel` itself and all of its toolchains. ECS, AMD, build-ecs would not be part of this repository. This is anyways part of what would come next for option 1, that makes it not strictly necessary but it is worth mentioning.
  It would also enable publishing of the new `@dcl/kernel` repository, enabling faster testing in libraries depending on that specific package (decentraland-ecs in the new decentraland/js-skd-toolchain).

## Decision Outcome

We choose to create a separated repository to not block the releases and development of explorer during this migration stage.

Also having separated repositories, will foster external contributions, ensuring clear scopes and responsibilities for each repository.

## Participants

- Mendez
- Brian