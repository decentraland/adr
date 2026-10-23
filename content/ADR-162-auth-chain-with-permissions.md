---
layout: adr
adr: 162
title: Scoped logins for auth chains
date: 2022-12-28
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - marianogoldman
  - LautaroPetaccio
---

## Abstract

Signing in to Decentraland delegates to an ephemeral key everything the wallet can do, until the key expires. This ADR adds a **scoped login**: a delegation that names the only operations the ephemeral key may perform, per service and optionally per resource, in a message the user can read before signing. It is a new auth link type, `ECDSA_SCOPED_EPHEMERAL` (and `ECDSA_EIP_1654_SCOPED_EPHEMERAL` for contract wallets), rather than extra lines in the `Decentraland Login` message. Verifiers that don't know the type already reject it, so a scoped key is never accepted as a full login, by catalysts, Worlds content servers and services that haven't been updated included. A service opts in by validating with its own service identifier; it then receives the grants for that service and checks each operation against them. Chains in use today keep working unchanged and keep granting every operation.

## Context, Reach & Prioritization

### The full login

When signing in, a client creates an ephemeral key and the user signs a `Decentraland Login` message delegating to it ([ADR-44](/adr/ADR-44)). The client then signs deployments and requests with that key, without asking the wallet again:

```json
{
  "version": "v3",
  "localTimestamp": 1672836992842,
  "authChain": [
    {
      "type": "SIGNER",
      "payload": "0xed93e62f69c386617003ca0c8d78faca37a73912",
      "signature": ""
    },
    {
      "type": "ECDSA_EPHEMERAL",
      "payload": "Decentraland Login\r\nEphemeral address: 0x9272b45a74942068e6Ebe3e326dc065F7C28e41d\r\nExpiration: 2023-01-09T09:11:13.802Z",
      "signature": "0x827970db4cab26dd0b4743d4eff58c0e3401c400b50362421694b9d070ac624c7da889fa726c38429e8896c5de127666a33786d0c821aef2eea548029e7407eb1c"
    },
    {
      "type": "ECDSA_SIGNED_ENTITY",
      "payload": "bafkreigwzkkzrpkjugifokndlmvwsqfvpmoogthuol2zij67s7hj3flaxq",
      "signature": "0x67f77d86e3e91459469110c2be16682d0c9ff57e402df6d0396033676d087f72334cbcc29972968311c5987660c58ac4d14876792c354bbd864e0302a6cce53f1c"
    }
  ]
}
```

Until it expires, that key can do anything the wallet can: deploy profiles, but also deploy scenes to the user's LAND or to a World under their name, and sign requests to every service that accepts signed fetch. Whoever obtains it, from a compromised client, a leaked file or a malicious dependency, has the same reach.

### Why it matters now

The Explorer needs only a fraction of that: deploying profiles and signing its own requests. Other clients need even less, and increasingly keep their key outside a browser:

- command line tools that sign once and keep a session on disk for hours, such as a tool reading a creator's scene logs and metrics;
- automated agents and scripts that receive such a session to act for the user;
- single-purpose web tools that only read data.

Each of them holds a credential that can deploy scenes, although it only needs to read one service. Following the principle of least privilege, the user should be able to sign a key that can do only what the client needs, and see what it can do before signing.

Deployments signed directly by the wallet, without an ephemeral key, such as most scene deployments from the CLI, are not affected by this proposal.

### Reach

- **Clients** that create ephemeral keys: the Explorer, the CLI, the linker dApp, web tools.
- **Verifiers**: catalysts, the Worlds content server, and every service that validates signed fetch, mostly through `@dcl/crypto` and `@dcl/crypto-middleware`, plus verifiers in other languages.
- **`@dcl/schemas`**, which defines the auth link types.

### Vocabulary

- **Full login**: a delegation through the `Decentraland Login` message (`ECDSA_EPHEMERAL` or `ECDSA_EIP_1654_EPHEMERAL` link). It allows every operation.
- **Scoped login**: a delegation through the message defined here. It allows only its grants.
- **Grant**: one allowed operation of one service, optionally on one resource.
- **Service identifier**: the name of a service in grants, such as `insights` or `worlds`. It is not a hostname: every environment of a service shares it.
- **Verifier**: the code that validates an auth chain and decides what the request may do.

## Solution Space Exploration

### Permissions in the `Decentraland Login` message

The first draft of this ADR proposed appending permissions to the login message, in a YAML-like block or as phrases:

```text
Decentraland Login
Ephemeral address: 0x4f9c4Ff265357F937B14BCd1E5519f1537985301
Expiration: 2022-12-29T00:00:00.000Z

Permissions:
- allow "dcl:worlds:deploy" for menduz.dcl.eth
- allow "dcl:explorer:*" for 0xaddress
- deny "dcl:explorer:voice" for 0xaddress
```

It needs no new link type, and an absent block would mean full access. But today's verifiers read only the ephemeral address (line 2) and the expiration (line 3) of that message, and ignore every other line. Such a key would still be a full login for every catalyst, Worlds content server and service that hasn't been updated, so the risk described above would stay open until every verifier on the network upgrades. **Rejected.**

### A version number in the login message

Marking scoped messages with a version, as the first draft also suggested, has the same flaw: today's verifiers ignore it and accept the key as a full login. **Rejected.**

### IAM-style policies

The first draft modeled permissions on AWS IAM: `allow` and `deny` statements on `namespace:service:operation`, with wildcards, per resource. `deny` is only needed to carve exceptions out of wildcards, and the precedence rules between them are easy to get wrong in a verifier. The `dcl:` namespace only matters if other organizations issue permissions under the same login, which isn't the case. **Simplified:** this ADR keeps `service:operation` and per-resource grants, as an allow-list with no `deny`, no namespace and no wildcard across services.

### EIP-712 typed data

The message could be signed as EIP-712 typed data, which wallets show as named fields:

| ![1](resources/ADR-162/img1.png) | ![2](resources/ADR-162/img2.png) | ![3](resources/ADR-162/img3.png) |
|----------------------------------|----------------------------------|----------------------------------|

It reads better in wallets that support it and is domain-separated from personal messages. But:

- `@dcl/crypto` and the verifiers in other languages have no typed-data validation yet;
- wallets refuse to sign a domain whose `chainId` differs from the network they are on, and users switch between Ethereum and Polygon;
- older hardware wallet firmware blind-signs typed data, showing only hashes;
- clients that delegate from a browser key they already hold, such as the linker dApp, never show a wallet prompt, so they gain nothing.

**Deferred:** the grant model below does not depend on the encoding, so a typed-data link type can be added later with the same grants and validation (see Future work).

### Per-service session tokens

Each service could exchange a full-login request for its own short-lived token. It needs no protocol change, but every service builds its own session store and revocation, the user still signs a full login to obtain the token, and the token only exists after that full login has already been exposed to the client. **Rejected** as a general solution.

### Chosen: a scoped login link type

A new auth link type whose message lists the grants:

- old verifiers reject it, because they validate an unknown link type as an error;
- upgraded verifiers accept it only when they opt in with their service identifier;
- the message is plain text, readable in every wallet and signable by any key that holds a full login;
- full logins are unchanged.

## Specification

### Link types

| Type | Signed with | Validated like |
| ---- | ----------- | -------------- |
| `ECDSA_SCOPED_EPHEMERAL` | an EOA personal signature | `ECDSA_EPHEMERAL` |
| `ECDSA_EIP_1654_SCOPED_EPHEMERAL` | a contract wallet ([EIP-1654](https://github.com/ethereum/EIPs/issues/1654)) | `ECDSA_EIP_1654_EPHEMERAL` |

The `signature` of the link is the current authority's signature of its `payload`, as for the `ECDSA_EPHEMERAL` and `ECDSA_EIP_1654_EPHEMERAL` links. The authority that comes out of the link is its `Ephemeral` address.

### Message

```text
Decentraland Scoped Login
Ephemeral: 0x1111111111111111111111111111111111111111
Expiration: 2026-10-23T18:00:00.000Z
Allow: insights:logs-read
Allow: insights:metrics-read for world:example.dcl.eth
```

```abnf
payload    = prefix LF ephemeral LF expiration 1*( LF grant )
prefix     = "Decentraland Scoped Login"
ephemeral  = "Ephemeral: 0x" 40( DIGIT / %x61-66 )   ; lowercase hex
expiration = "Expiration: " timestamp
grant      = "Allow: " service ":" operation [ " for " resource ]
service    = 1*64( %x61-7A / DIGIT / "-" )
operation  = 1*64( %x61-7A / DIGIT / "-" ) / "*"
resource   = 1*256( %x21-7E )                        ; visible ASCII, no space
```

- `timestamp` MUST be in the form JavaScript's `Date.prototype.toISOString()` writes, in UTC with milliseconds: `YYYY-MM-DDTHH:mm:ss.sssZ`.
- Lines MUST be separated by a single LF. The payload MUST NOT contain CR, empty lines or a trailing LF.
- The first three lines MUST be the prefix, `Ephemeral` and `Expiration`, in that order, followed by 1 to 32 `Allow` lines. Two identical `Allow` lines MUST NOT appear.
- The payload MUST NOT be longer than 4096 bytes.
- A verifier MUST reject a link whose payload deviates from this format in any way. It MUST NOT trim, case-fold or otherwise normalize a value before comparing it.

The field is `Ephemeral:`, not `Ephemeral address:`, so code that reads the payload as a `Decentraland Login` message, whatever the link type, fails on it.

### Grants

A grant `<service>:<operation>` names a service and one of its operations.

- `service` is the identifier of the service the grant is for. Each service MUST document its identifier, its operations and its resource forms.
- `operation` is one of that service's operations. `*` means every operation of that service, including operations added later. Clients SHOULD list operations instead of using `*`. There is no wildcard across services.
- `for <resource>` limits the grant to one resource. A service defines its resource forms, and SHOULD write them as `<kind>:<value>`, for example `world:example.dcl.eth` or `parcel:10,-20`. Resources are compared as exact strings: no case folding, prefixes or wildcards. Each service MUST define a canonical form for its resources, for example lowercase world names, and MUST build the resource of a request in that form before comparing it. Clients MUST write grants in that form.
- Without `for`, the grant covers every resource of that service.

There are no `deny` grants: a grant list is an allow-list, so an operation not listed is denied.

A grant never adds access. The service still authorizes the signer as it does for a full login, for example by checking that the address owns the world; the grant only limits what the ephemeral key may do with that access.

### Auth chain structure

A chain with a scoped link MUST have this structure:

1. a `SIGNER` link;
2. zero or more `ECDSA_EPHEMERAL` or `ECDSA_EIP_1654_EPHEMERAL` links;
3. exactly one `ECDSA_SCOPED_EPHEMERAL` or `ECDSA_EIP_1654_SCOPED_EPHEMERAL` link;
4. at most one `ECDSA_SIGNED_ENTITY` link, signed by the scoped link's ephemeral key.

A chain that ends at the scoped link is the scoped identity itself, and its final authority is the `Ephemeral` address: that is how a client checks an identity it stored. A request adds the `ECDSA_SIGNED_ENTITY` link.

So a scoped key cannot delegate to another key, and a chain cannot widen its scope after narrowing it. Step 2 allows a key that already holds a full login, such as a browser dApp's ephemeral key, to delegate a narrower one. An `ECDSA_EIP_1654_SCOPED_EPHEMERAL` link only follows `SIGNER` directly.

The chain expires at the earliest expiration of its links.

### Validation

A verifier that accepts scoped logins is configured with its own service identifier `S`.

1. It validates the chain as it does today, with the validators for the new link types, and checks the structure above.
2. If the chain has no scoped link, the request has access to every operation, as today.
3. If the chain has a scoped link:
   - a verifier without a configured `S` MUST reject it;
   - it MUST reject the chain if no grant has service `S`;
   - it MUST ignore grants for other services;
   - it MAY reject a scoped link expiring further from now than a maximum it configures.
4. Each request performs exactly one operation, which the verifier chooses from the request it serves: the endpoint, and where the endpoint's behavior depends on it, the request's parameters. The verifier also chooses the resource the request acts on, if any. A verifier that configures `S` MUST assign an operation to every endpoint that accepts signed requests, and MUST reject a scoped chain on any request it cannot assign one.
5. The verifier checks `can(operation, resource?)`:
   - for a chain without a scoped link, `can` is always true;
   - for a scoped chain, `can` is true when a grant for `S` has the same `operation` or `*`, and either has no `for`, or has a `for` equal to the `resource` of the request.

A request has one operation, not a list of them. An endpoint that does several things at once needs an operation of its own, and a grant never implies another grant: `Allow: insights:logs-admin` permits `logs-admin`, and nothing else unless the service defines it to.

A request whose chain is valid but whose grants don't allow the operation SHOULD be answered with HTTP 403. A scoped chain on a request the verifier assigns no operation SHOULD be answered with HTTP 401, as a verifier that doesn't accept scoped logins does.

These checks run after the [ADR-44](/adr/ADR-44) signed fetch is verified. The signed metadata of the request may name the resource the request acts on, such as a scene, since the scoped key signed it; the verifier MUST then act on that same resource. The metadata never names the operation, and nothing in it can widen a grant.

### Backwards compatibility

- Chains in use today are not affected and keep granting every operation.
- Verifiers that don't know the new link types reject scoped chains: `@dcl/crypto` validates a link of unknown type as an error and ends the chain with no authority. This covers catalysts, Worlds content servers, the signature validation of the lambdas, and every service using `@dcl/crypto-middleware`. Schema validation with `@dcl/schemas`, which checks the link `type` against a fixed list, rejects them as well while the list doesn't include the new types.
- Upgrading those libraries doesn't change what a service accepts: a scoped chain is valid only for a verifier that configures its service identifier.
- `@dcl/schemas` can add the new link types at any time, before or after `@dcl/crypto` supports them. Adding them makes no verifier accept a scoped chain: earlier versions of `@dcl/crypto` still reject the link, and later ones still require a service identifier.
- [ADR-44](/adr/ADR-44) signed fetch is unchanged: the request is still signed by the final key of the chain.
- Contract-wallet scoped logins can be validated only by verifiers that check EIP-1654 signatures themselves. Verifiers that delegate that check to the catalyst reject them until the catalyst supports scoped links.

### Security considerations

- **What a leaked scoped key can do:** the listed operations, on the listed resources, of the listed services, with the wallet's access, until it expires. Nothing on any other verifier.
- **No revocation.** As with full logins, a scoped login lasts until its expiration. Clients SHOULD keep it short, and verifiers MAY cap it.
- **Environments share service identifiers.** A scoped login for `insights` is accepted by every environment of that service, as a full login is today. A service that needs to tell environments apart MUST use different identifiers.
- **Readable text.** Wallets display the message as text before signing, so the user sees every grant. Clients MUST NOT hide grants from the user in the interface that asks for the signature.
- **Strict parsing.** Any deviation rejects the link, so two verifiers can never read different grants from the same signed bytes.

### Libraries

- `@dcl/schemas`: the two link types.
- `@dcl/crypto`:
  - the two link validators;
  - a builder and a strict parser for the message;
  - a service identifier option for `validateSignature`, whose result then includes the grants for that service.
- `@dcl/crypto-middleware`:
  - a service identifier option;
  - an option, set per endpoint, naming the operation it performs and the resource it acts on, so a scoped chain is rejected on any endpoint that doesn't name one;
  - the grants on the verification result.
- Verifiers in other languages reject scoped chains until they support them.

### Example

A command line tool that reads a creator's scene logs and metrics delegates a key that can do nothing else:

```text
Decentraland Scoped Login
Ephemeral: 0x1111111111111111111111111111111111111111
Expiration: 2026-10-23T18:00:00.000Z
Allow: insights:logs-read
Allow: insights:metrics-read
```

```json
[
  {
    "type": "SIGNER",
    "payload": "0x2222222222222222222222222222222222222222",
    "signature": ""
  },
  {
    "type": "ECDSA_SCOPED_EPHEMERAL",
    "payload": "Decentraland Scoped Login\nEphemeral: 0x1111111111111111111111111111111111111111\nExpiration: 2026-10-23T18:00:00.000Z\nAllow: insights:logs-read\nAllow: insights:metrics-read",
    "signature": "0x<signature of the payload by 0x2222…2222>"
  },
  {
    "type": "ECDSA_SIGNED_ENTITY",
    "payload": "get:/v1/logs:1792756800000:{}",
    "signature": "0x<signature of the payload by 0x1111…1111>"
  }
]
```

If the key leaks, it can read the logs and metrics of the scenes that address may read until it expires. Catalysts, Worlds content servers and every other service reject it.

### Future work

- **Typed data.** A link type signed as EIP-712 typed data, with the same grants and validation, so wallets show each grant as fields. Its domain would be `{ name: "Decentraland Scoped Login", version: "1" }`, without `chainId`, since the signature is never used on chain.
- **Explorer adoption.** The Explorer could sign in with a scoped login granting only profile deployments and its own services, once the catalysts and those services accept scoped logins.

## RFC 2119 and RFC 8174

> The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "
> SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL"
> in this document are to be interpreted as described in RFC 2119 and RFC 8174.
