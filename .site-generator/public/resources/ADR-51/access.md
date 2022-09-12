## Access

Validates that the pointers are valid, and that the Ethereum address has write access to them

```
parameter LEGACY_CONTENT_MIGRATION_TIMESTAMP = 1582167600000
parameter DECENTRALAND_ADDRESS = 0x1337e0507eb4ab47e08a179573ed4533d9e22a7b

----

1. If deployment.pointers.any(p => p.lowerCase().startsWith('default)) && deployment.entity_type === SCENE
  return

2. If deployment.timestamp < LEGACY_CONTENT_MIGRATION_TIMESTAMP and deployment.address != DECENTRALAND_ADDRESS
  return

3. Execute entity access validation by type:
  PROFILE ACCESS or SCENE ACCESS or STORE ACCESS or WEARABLE ACCESS

```
