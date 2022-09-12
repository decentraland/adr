## Wearable Size

Validates wearable files size, excluding thumbnail, is less than expected

```
parameter ADR_45_TIMESTAMP = 1648771200
parameter MAX_SIZE_IN_MB = 2
----
1. If deployment.timestamp <= ADR_45_TIMESTAMP return
2. Let THUMBNAIL_HASH be deployment.content.find(deployment.metadata.thumbnail)
3. Fail if THUMBNAIL_HASH is not present
4. Let CURRENT_SIZE be the size of deployment files (uploaded and stored) in MB
5. Let THUMBNAIL_SIZE be the size of the deployment file corresponding to THUMBNAIL_HASH in MB
6. Fail if MAX_SIZE_IN_MB < CURRENT_SIZE - THUMBNAIL_SIZE
```
