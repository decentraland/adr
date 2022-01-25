## Wearable Access

Given the pointers (URNs), determine which layer should be used to check the access.  
 Checks if the ethereum address has access to the collection.

```
parameter DECENTRALAND_ADDRESS = 0x1337e0507eb4ab47e08a179573ed4533d9e22a7b

parameter ALLOWED_TYPES = ['off-chain', 'blockchain-collection-v1-asset', 'blockchain-collection-v2-asset']

parameter L1_NETWORKS = ['mainnet', 'ropsten', 'kovan', 'rinkeby', 'goerli']

parameter L2_NETWORKS = ['matic', 'mumbai']

function checkCollectionAccess:
  1. Let permissions P be
    - the addresses of:
      - collection creator
      - collection managers
      - item managers
      - comitee
    - the contentHash
    - isApproved && isCompleted
    at the moment

  2. If P.contentHash is pressent
    a. Fail if deployment.address ∉ P.comitee
    b. Fail if P.contentHash != IPFS_HASH_V0(deployment.content.bytes) or P.contentHash != IPFS_HASH_V1(deployment.content.bytes)

  3. Else
    a. Fail if deployment.address ∉ (P.collectionManagers ∪ P.collectionCreator ∪ P.itemManagers ∪ P.comitee)
    b. Fail if !(P.isApproved and P.isCompleted)

----

1. For each pointer P in deployment.pointers
  a. Fail if P does not satisfy URN like:
   urn:decentraland:{protocol}:collections-v2:{contract(0x[a-fA-F0-9]+)}:{name}

2. Fail if deployment.pointers.length > 1

2. Let parsed pointer P be the parsed deployment.pointers[0]

3. Fail if P.type ∉ ALLOWED_TYPES

4. If P.type == 'off-chain'
  a. Fail if deployment.address != DECENTRALAND_ADDRESS

5. Else
  a. Fail if P.network ∉ L1_NETWORKS and parsed.network ∉ L2_NETWORKS
  b. Let HAS_ACCESS be the result of checkCollectionAccess(deployment, P)
  c. If !HAS_ACCESS
    . Fail if P.network ∈ L2_NETWORKS
    . Fail if deployment.address != DECENTRALAND_ADDRESS
```
