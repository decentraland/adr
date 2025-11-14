---
layout: adr
adr: 289
title: Explorer Client Scenes Signed Fetch
date: 2025-11-07
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - lpetaccio
  - pentreathm
  - nachomazzara
  - gonpombo8
---

## Abstract

This document describes how the Signed Fetch functionality works in the Explorer Client for Decentraland scenes. It details the structure and purpose of the scene-specific metadata headers that are included when scenes perform HTTP requests. The Explorer Client extends the Signed Fetch mechanism defined in [ADR-44](/adr/ADR-44) with additional contextual metadata including scene identity, parcel location, realm information and a specific signer, the `decentraland-kernel-scene` enabling external services to verify the origin and context of requests.

## Context, Reach & Prioritization

### Context

The Explorer Client runs scenes that interact with external HTTP services. When scenes make requests on behalf of users, additional context beyond the basic Signed Fetch mechanism is valuable for external services. The Explorer Client includes scene-specific metadata in signed requests to provide:

- Scene identification and location (parcel coordinates)
- Realm information (where the user is connected)
- Environment context (production, staging, development)
- Request body integrity verification
- Signer identification (to identify who made the request)

This additional metadata enables external services to verify not only the user's identity but also the scene context from which the request originates.

**Important**: The Explorer Client controls the entire signature generation process, ensuring that all metadata accurately reflects the true context of the request and cannot be forged by malicious scene code.

### Reach

This specification impacts:

- All scenes running in the Explorer Client that make HTTP requests
- Services that need to verify requests originated from specific scenes, locations or realms

## Specification

### Overview

The Explorer Client Signed Fetch functionality extends [ADR-44](/adr/ADR-44) by including scene-specific metadata in the signature. This metadata is included in the `X-Identity-Metadata` header and is part of the signed payload, ensuring its integrity and authenticity.

### Signature Metadata Structure

The signature metadata includes contextual information about the scene making the request:

```json
{
  "sceneId": "bafkreiabcdef...",
  "parcel": "52,68",
  "tld": "org",
  "network": "mainnet",
  "isGuest": false,
  "signer": "decentraland-kernel-scene",
  "realm": {
    "hostname": "peer.decentraland.org",
    "protocol": "v3",
    "serverName": "realm-1"
  },
  "hashPayload": "a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

#### Metadata Fields

- **`sceneId`** (string, required): The unique identifier of the scene making the request, typically the IPFS hash of the scene entity.

- **`parcel`** (string, required): The base parcel coordinates in the format `"x,y"` where the scene is located. For Genesis City, these are integer coordinates. For Worlds, this represents the decoded base coordinates.

- **`tld`** (string, required): The top-level domain environment identifier. Valid values:

  - `"org"` - Production environment (decentraland.org)
  - `"zone"` - Staging environment (decentraland.zone)
  - `"today"` - Development environment (decentraland.today)

- **`network`** (string, required): The blockchain network. Currently always `"mainnet"`.

- **`isGuest`** (boolean, required): Indicates whether the user is authenticated with a wallet (`false`) or is a guest user (`true`).

- **`signer`** (string, required): Identifier for the signing entity. Set to `"decentraland-kernel-scene"` to indicate the request originates from a scene runtime.

- **`realm`** (object, required): Information about the realm where the user is currently connected:

  - **`hostname`** (string): The hostname of the realm server (e.g., `"peer.decentraland.org"`)
  - **`protocol`** (string): The communications protocol version (e.g., `"v3"`)
  - **`serverName`** (string): The human-readable name of the realm

- **`hashPayload`** (string, optional): The SHA-256 hash of the request body, included only when the request has a body. This is a lowercase hexadecimal string.

#### Body Hashing

When a request includes a body, it MUST be hashed using SHA-256. The request body is encoded as UTF-8 bytes before hashing. The resulting hash is a lowercase hexadecimal string that is included in the signature metadata as `hashPayload`.

For example, an empty JSON object `{}` would produce:

```
44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a
```

### Security Considerations

#### Trusted Execution Environment

The Signed Fetch process is implemented and executed exclusively within the Explorer Client's trusted environment. Scene code running within the client cannot access, modify, or forge any of the metadata headers that are included in the signature. This architectural boundary ensures that:

- Scenes cannot impersonate other scenes by modifying the `sceneId`
- Scenes cannot falsify their location by changing `parcel` coordinates
- Scenes cannot manipulate realm information to appear connected to different servers
- Scenes cannot bypass body integrity checks by modifying `hashPayload`
- Scenes cannot change the `signer`, being always `decentraland-kernel-scene`

The Explorer Client validates and populates all metadata fields based on its internal state before generating the signature. This prevents malicious scenes from crafting fraudulent signed requests.

#### Request Replay Prevention

The signature metadata includes several fields that prevent request replay:

- **`timestamp`**: Ensures requests expire after a service-defined time window
- **`sceneId`**: Prevents requests from being reused by different scenes
- **`parcel`**: Prevents requests from being reused when the scene moves to a different location
- **`realm`**: Allows services to verify the user is connected to the expected realm
- **`hashPayload`**: Ensures the body cannot be modified without invalidating the signature.

## References

- [ADR-44: Authentication mechanism for HTTP requests: Signed Fetch](/adr/ADR-44)
- [decentraland-crypto](https://github.com/decentraland/decentraland-crypto)

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
