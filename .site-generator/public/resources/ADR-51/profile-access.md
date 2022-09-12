## Profile Access

```
parameter DECENTRALAND_ADDRESS = 0x1337e0507eb4ab47e08a179573ed4533d9e22a7b

----

1. Fail if deployment.pointers.length != 1

2. Let pointer P be deployment.pointers[0].toLowerCase()

3. If P starts with 'default'
  a. Fail if deployment.address != DECENTRALAND_ADDRESS

4. Fail if P is not an Ethereum address

5. Fail if P != deployment.address.toLowerCase()
```
