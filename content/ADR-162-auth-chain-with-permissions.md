---
layout: adr
adr: 162
title: Extend auth chain to include permissions
date: 2022-12-28
status: Draft
type: RFC
spdx-license: CC0-1.0
authors:

- marianogoldman

---

## Abstract

This document discusses the creation and use of ephemeral keys for signing
service requests or operations on behalf of users in the Decentraland platform.
It proposes the use of a set of permissions to be associated with the ephemeral
key in order to ensure that it can only be used for specific types of requests (
for e.g. profile deployments).

The document explores various options for specifying and reading these
permissions, including using a structure similar to Amazon's AWS IAM service and
using human-readable text that can also be machine-parsed. The goal of these
measures is to ensure that ephemeral keys are used in a way that follows the
principle of least privilege, and to allow users to sign keys that grant access
only to the specific types of operations they wish to authorize.

## Context, Reach & Prioritization

When signing in to Decentraland an ephemeral key is created and the user
signs it using Metamask / WalletConnect / etc. That ephemeral key is
then used by the Explorer to sign deployment of entities on behalf of the user,
like for profile updates. For e.g.

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

The ephemeral key has an expiration date and can be used for signing any
kind of deployments on behalf of the user while the key is not expired. A
malicious user could attempt to use it for deploying other kind of entities
on behalf of the user, such as scenes in the Catalyst Network or a scene for
a World using a DCL name.

Following the principle of the least privilege it would be useful to be able
to grant the ephemeral key only the set of permissions that are required
for the purpose of the client using it.

* In case of Explorer, just deploying profiles should be enough.
* When using `dcl deploy` the only permissions
  required are for deploying scenes (or wearables? emotes?). Not needed for
  deploying profiles. However, in this case, no ephemeral key is used but
  rather the deployment is signed directly with the user wallet.

So this proposal is about extending the Auth Chain to support the creation
of the ephemeral key with a given set of permissions associated to it, and
that the server that receives those requests can validate that the user granted
access to the scopes required for the operation being requested. This way, the
user could sign the ephemeral key to only allow deployment of worlds under a
certain name but not deployment of profiles nor scenes in the Catalyst network.

It is worth mentioning that this does not have any effect or implications on
Auth Chains in which there is no ephemeral key, but rather the user signs the
request directly. This is usually the case for scene deployments. For e.g.:

```json
{
  "version": "v3",
  "localTimestamp": 1669232361483,
  "authChain": [
    {
      "type": "SIGNER",
      "payload": "0xe2b6024873d218b2e83b462d3658d8d7c3f55a18",
      "signature": ""
    },
    {
      "type": "ECDSA_SIGNED_ENTITY",
      "payload": "bafkreignljg5bvmzczke42gymktbraf7py7riwyclmbgzmwcyswxdgktju",
      "signature": "0x82ccde2c7c6b300566c40fd6f3234876614564a6e13643e968fe4f69828a2fb41e8286fbf94ac92a19a5dfb96ff636a2d5e41406d5dfc200e76145cc4b0d96321c"
    }
  ]
}
```

## Solution Space Exploration

### Permission specification

Permissions must be specified when creating an ephemeral key. A simple and very
flexible way for this could be similar to how Amazon does it
in [AWS IAM](https://aws.amazon.com/iam/). In this case, it would consist of
a collection of a resource name and either an allow or deny expression.

For e.g.:

```yaml
Permissions:
  - resource: "my-dcl-name.dcl.eth"
    allow: "dcl:worlds:deploy"
  - resource: "0,0"
    allow: "dcl:scene:deploy"
  - resource: "0xaddress"
    allow: "dcl:explorer:*"
  - resource: "0xaddress"
    deny: "dcl:explorer:denied-operation"
```

The `resource` name must be an item referencing an entity of the domain that
the server knows. For e.g. for DCL Worlds, it can be a DCL name, while for
scene deployment in Genesis City it can be the coordinates of the land, or
for a profile deployment it can be the profile address.

The `allow` and `deny` elements are structured as follows:
`namespace:service-name:operation-name` or `namespace:service-name:*`.
The namespace is used to for prefixing all the services that belong to an
organization. For e.g., in Decentraland the prefix could be `dcl`. The
second part, the service name, refers to the service that this permission
declaration is intended for. It has to be unique for services within the
same namespace. The last part can be either a single operation name or a `*`
character meaning any possible operation for the service.

In the example above, resource `0xaddress` allows `dcl:explorer` to do any
operations except `denied-operation`. A single operation name always weighs
more than the wildcard operator, and hence takes precedence over it.

### Permission readability

One of the key points in the permission specification is that they must be
human-readable, because the user signing the creation of the ephemeral key needs
to be able to read it in plain text and understand what he is about to sign.

On the other hand, the text has to be machine parsable so that the server is
able to parse the message signed by the user that contains the permission
specification and be able to interpret it for allowing or disallowing the
operation request accordingly.

Here is a few options proposed for permission specification. Options 1 and 2
propose different payload options to be
signed, based
on [EIP-4361 Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361).

Option 1: more yaml-like:

```text
Decentraland Login
Ephemeral address: 0x4f9c4Ff265357F937B14BCd1E5519f1537985301
Expiration: 2022-12-29T00:00:00.000Z

Permissions:
  - resource: "menduz.dcl.eth"
    allow:    "dcl:worlds:deploy"
  - resource: "menduz.dcl.eth"
    allow:    "unicorn:worlds:deploy"
  - resource: "0,0"
    allow:    "dcl:scene:deploy"
  - resource: "0xaddress"
    allow:    "dcl:explorer:*"
```

Option 2: yaml-like list of parsable phrases:

```text
Decentraland Login
Ephemeral address: 0x4f9c4Ff265357F937B14BCd1E5519f1537985301
Expiration: 2022-12-29T00:00:00.000Z

Permissions:
- allow "dcl:worlds:deploy" for menduz.dcl.eth
- allow "dcl:explorer:*" for 0xaddress
- deny "dcl:explorer:voice" for 0xaddress
- deny "dcl:explorer:voice2" for 0xaddress
- allow "unicorn:worlds:deploy" for menduz.dcl.eth
- allow "dcl:scene:deploy" for *
```

Option 3: Typed structured data

An alternative approach to permission specification would be to use structured
data signing, as defined in
[EIP-712 Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712).

The follow snippet can be run in the browser console:

```javascript
let domain = [
    {name: "name", type: "string"},
    {name: "chainId", type: "uint256"}
]

let authChain = [
    {"name": 'content', "type": 'string'},
    {"name": 'ephemeralAddress', "type": 'string'},
    {"name": 'expiration', "type": 'string'},
    {"name": 'permissions', "type": 'string[]'},
]

let domainData = {
    name: "Decentraland Explorer",
    chainId: parseInt(window.ethereum.networkVersion, 10)
}

let message = {
    content: 'Decentraland Login',
    ephemeralAddress: '0x4f9c4Ff265357F937B14BCd1E5519f1537985301',
    expiration: '2022-12-29T00:00:00.000Z',
    permissions: [
        {
            resource: 'menduz.dcl.eth',
            allow: 'dcl:worlds:deploy'
        },
        {
            resource: 'menduz.dcl.eth',
            allow: 'unicorn:worlds:deploy'
        },
        {
            resource: '0,0',
            allow: 'dcl:scene:deploy'
        },
        {
            resource: '0xaddress',
            allow: 'dcl:explorer:*'
        },
    ]
}

let eip712TypedData = {
    types: {
        EIP712Domain: domain,
        AuthChain: authChain
    },
    domain: domainData,
    primaryType: "AuthChain",
    message: message
}

let signer = window.ethereum.selectedAddress
let data = JSON.stringify(eip712TypedData)

await window.ethereum.request({
    method: 'eth_signTypedData_v4',
    params: [signer, data],
    from: signer
})
```

And it generates a signature screen as follows (using Metamask):

| ![1](resources/ADR-162/img1.png) | ![2](resources/ADR-162/img2.png) | ![3](resources/ADR-162/img3.png) |
|----------------------------------|----------------------------------|----------------------------------|

### Backwards compatibility

In order to ensure that previously created Auth Chains continue to function
correctly, it is important that the absence of permission specifications be
treated as granting access to all operations. This means that if no permissions
are specified, the Auth Chain should allow all operations to be performed.

> Or alternatively, we could introduce a version number that can be used to
> select the validation logic to be applied.

### Permission checks

The Auth Chain validation process should involve a method that returns an
instance of a permission checker. This checker will be used by the service
performing the checks to verify whether a particular operation is allowed on a
specified resource. The checker will examine the permissions listed in the Auth
Chain's permissions section and return a verdict indicating whether the
operation is allowed or not based on the presence of allow or deny statements.

### Signature validation

Signature validation should not be affected at all. It should continue to
work as before.

## Specification

<!--
The technical specification should describe the syntax and semantics of ackaony 
new feature.
-->

The technical specification should describe the syntax and semantics of any new
feature.

## RFC 2119 and RFC 8174

> The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "
> SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL"
> in this document are to be interpreted as described in RFC 2119 and RFC 8174.
