# 2021-07-02 - Wearable Committee Reverts

## Context and Problem Statement

The wearables committee needs to be able to revert wearables to a previous version. This is because there is a small time window where the committee might approve one version of a wearable, but the collection owner then deploys a new version.

Now, there is a property on the collections subgraph called `contentHash`. This property is a string that can be used by the committee to specify a specific wearable version. The questions is what how to specify such version.

## Considered Options

### 1. Use the entity id

The first option would be to:
1. Download the wearable version from a catalyst
2. Change the timestamp
3. Hash the whole wearable again
4. Save this hash on the blockchain (with the `contentHash` property)
5. Have anyone deploy the new wearable version
6. The catalyst would check that the deployed entity's id would match the `contentHash`


### 2. Use the hash(metadata + content)
The second option would be to:
1. Download the wearable version from a catalyst
2. Take the `metadata` & `content` properties from the wearable
3. Hash the value of those to properties
4. Save this hash on the blockchain (with the `contentHash` property)
5. Have a committee member deploy the new wearable version
6. The catalyst would:
    * Take those two properties, hash them and check that it matches the `contentHash`
    * Verify that the deployer is a committee member

Note: we need to make sure that only a committee member can make this type of deployments, because if we remove this validation, a possible attacker could make multiple deployments of the same wearable. They would only need to change the timestamp, and they could fill the database rather easily.

## Decision Outcome

Option 1 seems like the easiest, but it has a problem. The validation mechanism uses the entity's timestamp to determine which block to check the values from. Therefore, the timestamp needs to be after the blockchain was modified in step (4), but it also has to be a timestamp of a block that has already been mined. This is because the validation would fail if there is no block for a specific timestamp. So choosing a time in the future that needs to be after step (4) but not too far into the future can be extremely flaky.

That's why we decided to go with option 2.

## Participants

- @nchamo
- @mendez
