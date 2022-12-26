## Profile Files

Validates that given profile deployment includes a `face256.png` file and a `body.png` file.

```
parameter ADR_158_TIMESTAMP = 1673362800000

----

1. If deployment.timestamp <= ADR_158_TIMESTAMP return

2. Fail if deployment.content['face256.png'] is not present

3. Fail if deployment.content['body.png'] is not present

```
