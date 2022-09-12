## Wearable Thumbnail

Validates that given wearable deployment includes a thumbnail with valid format and size

```
parameter ADR_45_TIMESTAMP = 1648771200
parameter THUMBNAIL_SIZE_IN_PIXELS = 1024

----

1. If deployment.timestamp <= ADR_45_TIMESTAMP return

2. Let THUMBNAIL_HASH be deployment.content.find(deployment.metadata.thumbnail)

3. Fail if THUMBNAIL_HASH is not present

4. Fail if THUMBNAIL_HASH ∉ deployment.files

5. Let THUMBNAIL_IMAGE be the image corresponding to the THUMBNAIL_HASH

6. Fail if THUMBNAIL_IMAGE is not a .PNG

7. Fail if THUMBNAIL_IMAGE width > THUMBNAIL_SIZE_IN_PIXELS

8. Fail if THUMBNAIL_IMAGE height > THUMBNAIL_SIZE_IN_PIXELS
```
