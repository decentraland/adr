## Size

Validates that the full request size is within limits

```
parameter ADR_45_TIMESTAMP = 1648771200

----

1. Let MAX_SIZE be the maximum size in bytes allowed by ENTITY_TYPE

2. Let CURRENT_SIZE be the sum of all content files' sizes in bytes:
  a. If deployment.timestamp < ADR_45_TIMESTAMP, sum only uploaded files
  b. If deployment.timestamp >= ADR_45_TIMESTAMP, sum includes stored files

3. Fail validation if CURRENT_SIZE > MAX_SIZE
```
