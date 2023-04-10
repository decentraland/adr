---
layout: adr
adr: 207
title: Content Addressable URNs for Decentraland
date: 2023-04-10
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
- ChatGPT
- menduz
- robtfm
---

# Abstract

This ADR proposes a content-addressable URN format for the Decentraland ecosystem, adhering to RFC 8141 standards. By adopting this format, Decentraland ensures a uniform, extensible, and decentralized method for addressing content, paving the way for enhanced interoperability and integration with other systems.

## Context, Reach & Prioritization

Decentraland requires a standard way to address content hosted on distributed systems, such as the Catalyst network or IPFS. This ADR  proposes the use of URNs (Uniform Resource Names) in the following format:

`urn:decentraland:entity:<IPFS_CIDv1>?=&baseUrl=https://content.server/content`

This format complies with RFC 8141 and allows the Decentraland ecosystem to reference content in a uniform, flexible, and extensible manner.

According to the proposed format, a content-addressable URN for Decentraland would have the following structure:

- `urn`: The URN scheme identifier, as defined by RFC 8141.
- `decentraland`: The Namespace Identifier (NID) representing the Decentraland ecosystem.
- `entity`: The Namespace Specific String (NSS) denoting the type of content being addressed. In this case, it represents an entity within Decentraland.
- `<IPFS_CIDv1>`: The unique content identifier, using the CIDv1 format from the InterPlanetary File System (IPFS).
- `?=`: `q-component` of the RFC 8141, used to enable query parameters in strict URN parsing mode. It MUST be present if any other query parameter is present. If none are, it can be omitted.
- `&baseUrl=https://content.server/content`: An optional query component specifying the base URL of the content server hosting the asset. If none is provided, the implementation will fall-back to a content server of the Catalyst network.

The adoption of this URN format offers the following advantages:

- **Uniformity**: URNs provide a consistent, standardized way to reference content within the Decentraland ecosystem.
- **Content-addressability**: By using IPFS CIDs, content can be addressed based on its cryptographic hash, ensuring data integrity and resilience against tampering.
- **Extensibility**: The URN format allows for the addition of extra query components, enabling future extensions or additional metadata.
- **Decentralization**: The use of IPFS and content-addressable URNs supports the decentralized nature of Decentraland, ensuring content persistence and availability. By making the `baseUrl` part of the query parameters, the entity ID becomes decoupled from the server. Enabling resolution or retries in multiple servers.
- **Interoperability**: As the URN format is compliant with RFC 8141, it facilitates interoperability with other systems and services.

# How to generate the URN

The dynamic part of the URN is the `<IPFS_CIDv1>`, that is the CID of the entity uploaded to the content server. The process is thoroughly described at [ADR-208](/adr/ADR-208)

# Usage in the platform

The `scenesUrn` of the [realm definition (ADR-110)](/adr/ADR-110) use this urn schema to instruct the explorers how to resolve the deployment.

This schema is also used by worlds, to describe the URN of the deployed scenes, and by the `sdk-commands export-static` command to create static realms like for [sdk7-goerli-plaza](https://github.com/decentraland/sdk7-goerli-plaza) pull requests.

## RFC 2119 and RFC 8174

> The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "
> SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL"
> in this document are to be interpreted as described in RFC 2119 and RFC 8174.
