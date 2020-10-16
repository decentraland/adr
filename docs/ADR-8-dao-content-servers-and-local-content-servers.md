# DAO content servers and local content servers

## Context and Problem Statement
* Today Catalyst servers are split in two groups listed and unlisted in the DAO
  Listed servers sync with eachother by a pull mechanism (between each other, listed in the DAO).
  Unlisted servers, sync again those who are listed but. Listed servers never pull changes from unlisted servers.
* Big scenes are constrained by server configurations or proxy limitations of the deployed nodes (i.e. body post size). Nowadays, those limitations are workarounded by selecting another server with a different configuration (Kyllian's).

### Use cases
* I want to push my scene to my own server and I expect it to replicate to other servers.
* Create a "local-staging" environment in which land owners or creators can synchronize the whole world from a DAO node and test locally.
  * Broadcast of changes should be optional.

## Considered Options
* Enable custom Catalyst servers from Explorer
* `https://catalyst.mydomain.com/open-explorer` opens an explorer pointing to this Catalyst instance
* `POST https://catalyst.mydomain.com/broadcast-changes` pushes new changes to DAO nodes. In DAO nodes, accept signed messages from anyone.

## Decision Outcome
* Enable custom Catalyst servers from Explorer
* Define action plan for broadcasting/commiting local deployments to the DAO servers. [issue](https://github.com/decentraland/catalyst/issues/195)

## Participants

- Esteban Ordano
- Nicolás Chamo
- Marcos Nuñez Cortés
- Agustin Mendez

Date: 2020-10-16
