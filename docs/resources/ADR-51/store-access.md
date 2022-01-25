## Store Access

```
1. Fail if deployment.pointers.length != 1

2. Let pointer P be deployment.pointers[0].toLowerCase()

3. Fail if P does not satisfy URN like:
 urn:decentraland:off-chain:marketplace-stores:{address}

4. Fail if deployment.address != urn.address
```
