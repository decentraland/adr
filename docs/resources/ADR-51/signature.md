## Signature

Validate that the signature belongs to the Ethereum address

([reference](https://github.com/decentraland/decentraland-crypto/blob/master/src/Authenticator.ts))

```
function validateSignature: (see reference)
  1. Fail if authChain is malformed
  2. For each authLink L in authChain
    a. Let validator V be the validator by L.type
    b. Fail if V can't validate on that time


1. Let validateSignature be a function that validates the auth chain of the deployment

2. Fail if validateSignature(entity.id, deployment.authChain, deployment.timestamp)
```
