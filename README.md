---
layout: index
slug: /
title: Decentraland RFC & ADR
---

## How to?

Read [the ADR explaining the rationale](/adr/ADR-1), by Michael Nygard.

## Template

For consistency, please name your files using incremental numbers in the shape `ADR/ADR-###-title-using-dashes.md`.

To organize the files, please save the assets in a folder for each document using the same ADR
number: `.site-generator/public/resources/ADR-###/{filename}`.

More info: [ADR-5 - How to organize ADR files](/adr/ADR-5).

Feel free to write the documents in the way that is more convenient to you. If you want, there is a template you can use
to start with:

```markdown
---
layout: doc
adr: 1
date: 2020-01-01
title: Documenting architecture decisions
---

## Context and Problem Statement

This section describes the forces at play, including technological, political, social, and project local. These forces
are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply
describing facts.

## Considered options

- option 1
- option 2
- option 3

## Decision

This section describes our response to these forces. It is stated in full sentences, with active voice. "We will …"

## Status

Accepted (or "proposed", "deprecated" or "superseded"). A decision may be "proposed"
if the project stakeholders haven't agreed with it yet, or "accepted" once it is agreed. If a later ADR changes or
reverses a decision, it may be marked as "deprecated" or
"superseded" with a reference to its replacement.

## Consequences

This section describes the resulting context, after applying the decision. All consequences should be listed here, not
just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them
affect the team and project in the future.
```
