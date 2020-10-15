# Architecture Decisions Records

- [2020-10-05-documenting-architecture-decisions.md](ADR/2020-10-05-documenting-architecture-decisions.md)
- [2020-10-06-state-sync.md](ADR/2020-10-06-state-sync.md)
- [2020-10-08-explorer-packages-organization.md](ADR/2020-10-08-explorer-packages-organization.md)
- [2020-10-13-collections-architecture-in-l1-l2.md](ADR/2020-10-13-collections-architecture-in-l1-l2.md)

## How to?

Read [the ADR explaining the rationale](ADR/2020-10-05-documenting-architecture-decisions.md), by Michael Nygard.

## Template

For consistency, please name your file prefixed with the creation date `ADR/YYYY-MM-DD-adr-title.md`.

Feel free to write the documents in the way that is more convenient to you.
If you want, there is a template you can use to start with. It is extremely useful to add

Here is the template:

```markdown
# YYYY-MM-DD - (title)

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

- Alice
- Bob
- Christy
- Doug
```
