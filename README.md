# Architecture Decisions Records

- [ADR-1 - Documenting architecture decisions](docs/ADR-1-documenting-architecture-decisions.md)
- [ADR-2 - State sync for builder-in-world](docs/ADR-2-state-sync-for-builder-in-world.md)
- [ADR-3 - Explorer packages organization](docs/ADR-3-explorer-packages-organization.md)
- [ADR-4 - Collections architecture in L1 & L2](docs/ADR-4-collections-architecture-in-L1-L2.md)
- [ADR-5 - How to organize ADR files](docs/ADR-5-how-to-organize-adr-files.md)
- [ADR-6 - Git style guide](docs/ADR-6-git-style-guide.md)
- [ADR-7 - Standards repository](docs/ADR-7-standards-repository.md)
- [ADR-8 - DAO content server and local content servers](docs/ADR-8-dao-content-servers-and-local-content-servers.md)
- [ADR-9 - `DecentralandInterface` evolution plan](docs/ADR-9-DecentralandInterface-evolution-plan.md)
- [ADR-10 - Profile deployment debouncing](docs/ADR-10-profile-deployment-debouncing.md)
- [ADR-11 - Add version to content-as-bundle URL](docs/ADR-11-add-version-to-content-as-bundle-url.md)
- [ADR-12 - Documentation as a priority](docs/ADR-12-documentation-as-a-priority.md)
- [ADR-13 - Custom UI modes for builder in world](docs/ADR-13-custom-ui-modes-for-builder-in-world.md)
- [ADR-14 - L1 & L2 Governance Smart Contracts Architecture](docs/ADR-14-l1-l2-governance-smart-contracts-architecture.md)
- [ADR-15 - L1 & L2 Collections Approval Flow](docs/ADR-15-l1-l2-collections-approval-flow.md)
- [ADR-16 - Unity Data Store Architecture](docs/ADR-16-unity-data-store-architecture.md)
- [ADR-17 - Wearable Collection Approval And Economics](docs/ADR-17-wearable-collection-approval-and-economics.md)
- [ADR-18 - Content mappings flow for Explorer and Builder in-world](docs/ADR-18-content-mappings-flow-for-explorer-and-builder-in-world.md)
- [ADR-19 - L2 Roadmap: Stage 1 & Stage 2 alternatives](docs/ADR-19-l2-roadmap-stage-1-stage-2-alternatives.md)
- [ADR-20 - Explorer Settings Panel Architecture](docs/ADR-20-explorer-settings-panel-architecture.md)
- [ADR-21 - Update cycle of catalysts](docs/ADR-21-update-cycle-of-catalysts.md)
- [ADR-22 - Quests progress UI](docs/ADR-22-quests-progress-ui.md)
- [ADR-23 - Entities meta-data flow for builder in-world](docs/ADR-23-entities-meta-data-flow-for-builder-in-world.md)
- [ADR-24 - Decouple Kernel and Unity APIs](docs/ADR-24-decouple-kernel-and-unity-apis.md)
- [ADR-25 - Explorer Repositories Decoupling](docs/ADR-25-explorer-repositories-decoupling-.md)
- [ADR-26 - Port signup screen to Unity](docs/ADR-26-port-signup-screen-to-unity-.md)
- [ADR-27 - Port loading screen to Unity](docs/ADR-27-port-loading-screen-to-unity-.md)
- [ADR-28 - Smart contract wallets and meta-transactions](docs/ADR-28-smart-contract-wallets-and-meta-transactions.md)
- [ADR-29 - Refactor HUD Controller](docs/ADR-29-refactor-hud-controller.md)
- [ADR-30 - Front and back end architecture for the Marketplace ](docs/ADR-30-front-and-back-end-architecture-for-the-marketplace.md)
- [ADR-31 - Signin/signup Kernel<>Website](docs/ADR-31-signin-signup-kernel-website.md)
- [ADR-32 - Wearable Committee Reverts](docs/ADR-32-wearable-committee-reverts.md)
- [ADR-33 - Collections Bridge](docs/ADR-33-collections-bridge.md)
- [ADR-34 - Collections approval flow](docs/ADR-34-collections-approval-flow.md)
- [ADR-35 - Catalyst communication protocol optimizations](docs/ADR-35-coms-protocol-optimizations.md)
- [ADR-36 - Kernel repository separation](docs/ADR-36-kernel-repository-separation.md)
- [ADR-37 - Explorer desktop launcher technology](docs/ADR-37-explorer-desktop-launcher-technology.md)
- [ADR-38 - Communication between Kernel and Desktop](docs/ADR-38-communication-kernel-desktop.md)
- [ADR-39 - DApps blockchains support](docs/ADR-39-dapps-blockchains-support.md)
- [ADR-40 - DCL UI dependencies upgrades](docs/ADR-40-ui-dependencies-upgrades.md)
- [ADR-41 - Collection Items Approval Flow Enhancement](docs/ADR-41-collection-items-approval-flow-enhancement.md)
<<<<<<< HEAD
- [ADR-42 - Third Party Collections Registry](docs/ADR-42-third-party-collections-registry.md)
- [ADR-43 - Catalyst API refinement](docs/ADR-43-catalyst-api-refinment.md)
=======
- [ADR-42 - Third Party Collections Registry](ADR-42-third-party-assets-integration.md)
>>>>>>> feat: rename adr

## How to?

Read [the ADR explaining the rationale](docs/ADR-1-documenting-architecture-decisions.md), by Michael Nygard.

## Template

For consistency, please name your files using incremental numbers in the shape `docs/ADR-###-title-using-dashes.md`.

To organize the files, please save the assets in a folder for each document using the same ADR number: `docs/resources/ADR-###/{filename}`.

More info: [ADR-5 - How to organize ADR files](docs/ADR-5-how-to-organize-adr-files.md).

Feel free to write the documents in the way that is more convenient to you.
If you want, there is a template you can use to start with:

```markdown
# (title)

## Context and Problem Statement

This section describes the forces at play, including technological, political, social, and
project local. These forces are probably in tension, and should be called out as such.
The language in this section is value-neutral. It is simply describing facts.

## Considered options

- option 1
- option 2
- option 3

## Decision

This section describes our response to these forces. It is stated in full sentences,
with active voice. "We will …"

## Status

Accepted (or "proposed", "deprecated" or "superseded"). A decision may be "proposed"
if the project stakeholders haven't agreed with it yet, or "accepted" once it is agreed.
If a later ADR changes or reverses a decision, it may be marked as "deprecated" or
"superseded" with a reference to its replacement.

## Consequences

This section describes the resulting context, after applying the decision. All consequences
should be listed here, not just the "positive" ones. A particular decision may have
positive, negative, and neutral consequences, but all of them affect the team and project
in the future.

## Participants

Date: YYYY-MM-DD

- Alice
- Bob
- Christy
- Doug
```
