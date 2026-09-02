---
adr: 44
date: 2022-01-26
title: "Authentication mechanism for HTTP requests: Signed Fetch"
status: Living
authors:
  - 2fd
  - nachomazzara
  - cazala
type: Standards Track
spdx-license: CC0-1.0
---

## Abstract

This document presents the problem of authenticating requests in http servers at Decentraland. It presents two alternatives: Ephemeral keys or Private keys. Ephemeral keys are decided to improve the user experience to not require N interactions on the wallet.

## Context and Problem Statement

We want to integrate our dApps with the explorer in order to provide a better experience for our users. To do so we need to send request authenticated by the user's wallet.

## Considered options

### Alt 1

Ask the user to sign each request

#### Pros

- Users will known each time a scene will interact in their name
- No intermediate code is required

#### Cons

- For consuming APIs it will require too many interactions for the users, potentially degrading the experience within the explorer

### Alt 2

Use [`decentraland-crypto`](https://github.com/decentraland/decentraland-crypto) as intermediary to sign each request

#### Pros

- It only requires one sign from the user
- It is already integrated in the explorer
  - [`signedFetch`](https://docs.decentraland.org/development-guide/network-connections/#signed-requests)
- Libraries to interact with these firms are already published
  - [`decentraland-crypto`](https://github.com/decentraland/decentraland-crypto)
  - [`decentraland-crypto-middleware`](https://github.com/decentraland/decentraland-crypto-middleware)
  - [`decentraland-crypto-fetch`](https://github.com/decentraland/decentraland-crypto-fetch)

#### Cons

- It requires an extensive documentation
- It requires extra code

## Decision

The option to use [`decentraland-crypto`](https://github.com/decentraland/decentraland-crypto) to interact with our services was chosen in order to provide a better experience to our users

## How to sign a request

### Generate a payload

In order to minimize the reutilization of request each payload must include data about the request and the moment it is made

```typescript
/**
 * Request method
 */
const METHOD: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = `POST`

/**
 * request path without domain, query string or hash
 * @example
 * - `/ping`
 * - `new URL('https://decentraland.org/ping').pathname`
 */
const PATH: string = `/ping`

/**
 * request timestamp
 * each service decide how long it will consider valid a request using this timestamp,
 * if timestamp is greater than now the request should fail
 */
const TIMESTAMP: number = Date.now()

/**
 * request metadata
 * can include extra data about the service that is making the request
 * shouldn't contains data required to make the request, if it is empty
 * and empty object should be use
 */
const METADATA: string = JSON.stringify({
  /* extra data */
})

/**
 * Payload
 *
 * The method and the path are lowercased so a signature does not depend on how a
 * client happened to spell them. The metadata is joined verbatim: it is a JSON
 * document whose property names and values are compared exactly by the services
 * that authorize on them, so its bytes MUST be the bytes that were signed.
 */
const payload = [METHOD.toLowerCase(), PATH.toLowerCase(), TIMESTAMP, METADATA].join(":")
```

### Metadata is signed verbatim

The payload above lowercases the method and the path only. Earlier revisions of this
document folded the whole joined string, metadata included:

```typescript
// Superseded. Do not use.
const payload = [METHOD, PATH, TIMESTAMP, METADATA].join(":").toLowerCase()
```

Folding after the metadata was joined in left the metadata's casing **outside** the
signature. `{"signer":"decentraland-kernel-scene"}` and
`{"Signer":"decentraland-kernel-scene"}` produce a byte-identical payload and therefore
share one valid signature, while the `X-Identity-Metadata` header is delivered as
written. A service comparing `metadata.signer` reads the second as *absent* — so a
request could be re-spelled in flight, keep a valid signature, and bypass a check that
the property was there to enforce.

Joining the metadata verbatim binds every property name and value — including
service-defined ones — to the signature, so what is verified is what the handler reads.

Requests are otherwise unchanged: the `X-Identity-Metadata` header still carries the
same JSON, and only the string that is signed differs.

#### Notes for implementers

- **Signers** *MUST* build the payload as above. `METADATA` *MUST* be the exact string
  sent in the `X-Identity-Metadata` header — serialize it once and reuse it, rather than
  re-serializing, since key order and whitespace are part of the signed bytes.
- **Verifiers** *MUST* rebuild the payload from the metadata exactly as delivered, and
  *MUST NOT* normalize it before verifying.
- Verifiers that authorize on a metadata property *SHOULD* compare it exactly rather
  than case-folding it, so a value that differs only in case is refused rather than
  read as something it is not.
- Signers and verifiers are not deployable atomically. A verifier *MAY*, for the length
  of a migration, fall back to the superseded payload after the current one fails —
  but only for the properties it authorizes on, and only while refusing a delivered
  property name that differs from the expected spelling, since the superseded payload
  cannot bind it. Such a fallback *SHOULD* be removed once its callers have migrated.

### Sign the payload

Once you have an Identity from [`decentraland-crypto`](https://github.com/decentraland/decentraland-crypto) use `signPayload` to get an `AuthLink`

```typescript
import { Authenticator } from "decentraland-crypto"

const auth = await Authenticator.signPayload(identity, data)
```

### Sign the request

To sign a request the `AuthChain` should be included as a header in the request along with the timestamp and the metadata

```typescript
fetch("https://decentraland.org/ping", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Identity-Auth-Chain-0": JSON.stringify(auth[0]),
    "X-Identity-Auth-Chain-1": JSON.stringify(auth[1]),
    "X-Identity-Auth-Chain-2": JSON.stringify(auth[2]),
    "X-Identity-Timestamp": TIMESTAMP,
    "X-Identity-Metadata": METADATA,
  },
  body: JSON.stringify({}),
})
```
