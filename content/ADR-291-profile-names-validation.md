---
layout: adr
adr: 291
title: Profile names validation
date: 2025-11-10
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - LautaroPetaccio
  - pentreathm
  - nachomazzara
  - kuruk-mm
---

## Abstract

Due to the growth of new clients, the need for proper validation of profile names appeared. This ADR proposes adding new restrictions to profile names, which include length and special characters validations.

## Context, Reach & Prioritization

### Context

Profile entities currently have no requirements for their names beside being defined. This has caused different clients to allow the deployment of names with different criteria, resulting in naming inconsistencies. The aim of this ADR is to address this issue, standardizing the rules for names validation.

After the implementation of this ADR, names MUST:

- Have between 2 and 15 characters
- Have only characters or numbers.
- Not have special characters, including whitespaces.

To be more explicit about the new restrictions, names MUST now comply with the following JS Regex:

```js
/^[a-zA-Z0-9]{2,15}$/;
```

### Reach

This specification impacts:

- All clients deploying profile entities.
- All sites or services deploying profile entities.

Clients and sites deploying profile entities MUST include these validations before the deployment process of profiles. These clients MUST be aware of old profiles that, when being updated, MUST correct or prompt user for a new name or they will be rejected.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
