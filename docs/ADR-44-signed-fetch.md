# Signed Fetch

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
const METADATA: string = JSON.stringify({ /* extra data */  })

/**
 * Payload
 */
const payload = (
  [
    METHOD,
    PATH,
    TIMESTAMP,
    METADATA
  ]
  .join(':')
  .toLowerCase()
)

```

### Sign the payload

Once you have an Identity from [`decentraland-crypto`](https://github.com/decentraland/decentraland-crypto) use `signPayload` to get an `AuthLink`

```typescript

import { Authenticator } from 'decentraland-crypto'

const auth = await Authenticator.signPayload(identity, data)

```

### Sign the request

To sign a request the `AuthChain` should be included as a header in the request along with the timestamp and the metadata

```typescript

fetch(
  'https://decentraland.org/ping',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Identity-Auth-Chain-0': JSON.stringify(auth[0]),
      'X-Identity-Auth-Chain-1': JSON.stringify(auth[1]),
      'X-Identity-Auth-Chain-2': JSON.stringify(auth[2]),
      'X-Identity-Timestamp': TIMESTAMP,
      'X-Identity-Metadata': METADATA,
    },
    body: JSON.stringify({})
  }
)

```
