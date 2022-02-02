## Size

Validates that the full request size is within limits

```
parameter ADR_45_TIMESTAMP = 1648771200
parameter MAX_SIZES_BY_ENTITY_TYPE_PER_POINTER:
  - SCENE: 15MB
  - WEARABLE: 3MB
  - PROFILE: 2MB
  - STORE: 1MB
----

1. Let MAX_SIZE_PER_POINTER be the maximum size in bytes allowed by ENTITY_TYPE

2. Let CURRENT_SIZE be the sum of all content files' sizes in bytes:
  a. If deployment.timestamp < ADR_45_TIMESTAMP, sum only uploaded files
  b. If deployment.timestamp >= ADR_45_TIMESTAMP, sum includes stored files

3. Fail validation if CURRENT_SIZE > (MAX_SIZE_PER_POINTER * deployment.pointers.length)
```
