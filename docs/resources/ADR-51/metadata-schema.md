## Metadata Schema

Validates entity metadata against its corresponding schema, which can be found in [common-schemas repository](https://github.com/decentraland/common-schemas/tree/main/src/platform)

```
parameter ADR_45_TIMESTAMP = 1648771200

----

1. If deployment.timestamp <= ADR_45_TIMESTAMP return

2. Let entity be the uploaded deployment entity

2. Let SCHEMA be the json schema of current entity.type

3. Fail if entity.metadata does not satisfy SCHEMA
```
