## Content

Validates that uploaded and reported hashes are corrects and files corresponds to snapshots

```
parameter ADR_45_TIMESTAMP = 1648771200
parameter ADR_X_SNAPSHOT_FILES = {"face.png", "body.png"}

----

1. For each content file item C in the deployment
  a. Fail if C is not stored in disk or is not one of the uploaded files

2. For each uploaded file F in the deployment
  a. Fail if F is not one of the content file items in deployment

3. If deployment.timestamp > ADR_45_TIMESTAMP
   a. For each content file F in the deployment
      i. Fail if F.filename ∉ ADR_X_SNAPSHOT_FILES
```
