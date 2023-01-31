---
layout: adr
adr: 180
title: Communication protocols
date: 2023-01-26
status: Draft # pick one of these
type: Standards Track
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

<!--
Abstract is a multi-sentence (short paragraph) technical summary. This should be a very terse and human-readable version of the document section. **Someone should be able to read only the abstract to get the gist of what this document is about in its current state.** Abstracts should be always up to date with the current state of the document.
-->

This document lists and describes the official communication protocols available for [realms (ADR-110)](/adr/ADR-110). This document should be updated regularly when the implementations change or are added to the explorers.

## Glossary

- **Communications transport** underlying technology and/or underlying transport protocol in which the Decentraland explorers implement an adapter
- **Communications adapter** piece of code or object that connects the internal state of the explorer with a specific transport
- **Realm** [set of configurations](/adr/ADR-110) for an [explorer](/adr/ADR-102)

## Solution Space Exploration

Decentraland explorers connect to different communications transports via connection strings, URL-like identifiers containing all the information needed to select the technology and establish the connection to the target network.

The basic structure of a connection string is defined with the following BNF

```bnf
PROTOCOL          := !':' [A-Za-z][A-Za-z0-9-]+
PARAMETERS        := any+
CONNECTION_STRING := PROTOCOL ':' PARAMETERS
```

Here are some examples:

```
ws-room:ws-room-service.decentraland.org/rooms/123-room-id
^^^^^^^                                                    protocol
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ parameter

offline:offline
^^^^^^^         protocol
        ^^^^^^^ parameter

livekit:wss://livekit.decentral.io?access_token=abc1223123
^^^^^^^                                                    protocol
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ parameter

```

## Specification

The realms will provide ways to get a connection string for our session. A communications adapter must be created with that connection string, which will use a communications transport under the hood.

All communications adapters must implement the semantics defined in [ADR-104](/adr/ADR-104). Some adapters, like livekit, may take advantage of their underlying implementations to set up Voice chat.

> TODO: Document the voicechat semantics

### Resolution of communications transport

1. Get the connection string
1. Parse it and separate the components protocol and params `[protocol, params] = str.split(':', max: 2)`
1. Find the function that handles the `protocol` and call it with the `params`

### Protocols

Here is the list of officially supported protocols

- `offline` will create an empty adapter. This protocol is used to test without communications servers and by some single-player experiences like the onboarding tutorial. The parameters for the offline protocol are implementation dependent.
- `simulator` will create different simulation conditions to evaluate performance and use cases. The parameters for the offline protocol are implementation dependent.
- `ws-room` will create a WebSocket transport, using the wire protocol and semantics defined in [ADR-105](/adr/ADR-105). The parameter is the absolute URL to be connected to, including the hostname. If no protocol is defined in the URL, `wss://` will be prepended.
- `livekit` will create a LiveKit transport. The parameter is the absolute URL to be connected to, including the hostname and the livekit token if needed. It is mandatory to specify the `wss://` protocol as part of the URL.
- `signed-login` performs a signed-fetch as defined in [ADR-44](/adr/ADR-44). It is used to authenticate the user BEFORE sending the final connection string. The connection string comes as part of the response in the `fixedAdapter` JSON field. In case of an error or denied access, a `message` can be sent to the user to provide more information about the reason for the denial.

#### `signed-login` verifications

The signed login exists as part of a "handshake" mechanism to enable authenticated log-ins and access control to different communication services like Livekit.

The verifications of the [signed fetch](/adr/ADR-44) must look for the following properties: `intent`, `signer`, and `isGuest`.

```typescript
// connectionString = "signed-login:https://my-server/authenticate-comms"

import { Request } from "express"
import * as dcl from "decentraland-crypto-middleware"

app.post("/authenticate-comms", dcl.express(), (req: Request & dcl.DecentralandSignatureData, res) => {
  const address: string = req.auth
  const metadata: Record<string, any> = req.authMetadata
  const isGuest: boolean = req.authMetadata.isGuest

  if (!validateMetadata(req.authMetadata)) {
    res.json({ message: "Access denied, invalid metadata" })
    return
  }

  if (!validateAddressHasAccess(address, isGuest)) {
    res.json({ message: "Access denied" })
    return
  }

  // if this point is reached, we can generate a safe token for the address
  res.json({ fixedAdapter: getAdapterFor(address) })
})

function validateMetadata(metadata: Record<string, any>) {
  if (metadata.signer !== "dcl:explorer" || metadata.intent !== "dcl:explorer:comms-handshake") {
    // this validation prevents signedFetch from the SDK to be used
    // to authenticate users into comms
    return false
  }
  return true
}
```

Implementations of `signed-login` SHOULD add more safety mechanisms like HMAC-signed tokens to their URLs to prevent fraudulent logins.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
