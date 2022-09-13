## IPFS Hashing

Validates that all hashes used by the entity are actually IPFS hashes

```
parameter ADR_45_TIMESTAMP = 1648771200

1. If deployment.timestamp <= ADR_45_TIMESTAMP return

2. Let ALL_HASHES be entity.id U entity.content.hashes

3. For each hash H in ALL_HASHES
  a. Fail if H is not a valid IPFS_HASH_V1
```
