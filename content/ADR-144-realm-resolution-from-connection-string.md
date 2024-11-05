---
layout: adr
adr: 144
title: Realm resolution from connection string
date: 2022-12-13
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

This document describes the Realm resolution algorithms to consistently resolve servers based on a realm connection string. It resembles DNS, and uses the DAO catalysts, ENS and URLs to resolve the realms as described in [ADR-110](https://adr.decentraland.org/adr/ADR-110).

## Context, Reach & Prioritization

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

Realms ([ADR-110](https://adr.decentraland.org/adr/ADR-110)) are the configurations that define what and how is executed and rendered in a Decentraland Explorer ([ADR-102](https://adr.decentraland.org/adr/ADR-102)). If we reason by analogy and consider an Explorer like a Web Browser, and the Scenes like WebSites. Then the Realm is the URL of that site.

## Specification

<!--
The technical specification should describe the syntax and semantics of any new feature.
-->

Realms are represented as strings. Those strings need to be resolved to a base URL of a valid realm, which then will be used to calculate `baseUrl+'/about'` to comply with the realm specification.

The mechanism to resolve that endpoint is:
1. If the string is an URL, then it use the URL
1. If the string is an ENS, then 
   1. If there is a `dcl.realm` TXT record in the ENS, return that value
   1. Otherwise, if it is a `.dcl.eth` subdomain, then it falls back to the Worlds resolver
1. If the string equals to the name of a DAO catalyst, then it picks the URL of the Catalyst like `https://peer.decentraland.org` using the DAO catalyst resolver.
1. If this point is reached, then the realm is invalid.

### ENS resolver

NAME and ENS holders can decide where their worlds are hosted. For that purpose, a special record `dcl.realm` can be added both to ENS and NAME tokens and it should resolve to a base URL that is compliant with the [Realm specification (ADR-110)](https://adr.decentraland.org/adr/ADR-110)

### Worlds resolver

Worlds is a configuration of services that enable deploying Decentraland scenes using a NAME, as described in [ADR-111](/adr/ADR-111). To resolve Worlds, an URL in the shape of `https://worlds-content-server.decentraland.org/world/<NAME>.dcl.eth` is used, the `/about` response is compliant with the [Realm specification (ADR-110)](https://adr.decentraland.org/adr/ADR-110)

### DAO catalyst resolver

The DAO catalysts are not registered using their friendly name in the [DAO Catalyst Registry](https://etherscan.io/address/0x4a2f10076101650f40342885b99b6b101d83c486) contract, the baseUrl is used instead. To resolve their names, the following algorithm is RECOMMENDED:
1. First the contract needs to be queried to get the list
1. For each catalyst baseUrl, a request needs to be made to their `/about` endpoint
   1. And finally select the matching name
1. If no matching name is selected then return null


## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
