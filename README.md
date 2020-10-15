# Architecture Decisions Records

- [ADR-1 - Documenting architecture decisions](docs/ADR-1-documenting-architecture-decisions.md)
- [ADR-2 - State sync for builder-in-world](docs/ADR-2-state-sync-for-builder-in-world.md)
- [ADR-3 - Explorer packages organization](docs/ADR-3-explorer-packages-organization.md)
- [ADR-4 - Collections architecture in L1 & L2](docs/ADR-4-collections-architecture-in-L1-L2.md)
- [ADR-5 - How to organize ADR files](docs/ADR-5-how-to-organize-adr-files.md)

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
