# Collections v2 Bridge

## Abstract

With the collections v2 on Polygon around, we need to find the most efficient way in terms of UX and cost for users for moving collections' assets between Ethereum and Polygon.

The architecture of how collections will be represented between layers is already defined [here](./ADR-4-collections-architecture-in-L1-L2.md).

### Alt 1: Polling from the user account

The alternative needs one transaction per collection to approve the assets, and other transaction to poll the assets.

Tx.1) The user should approve the bridge contract to use their assets on their behalf for each collection. The transaction to approve is required only once per collection. It means that once the user approves the bridge on the collection, every time the user wants to move assets, the transaction to approve won't be needed. The user will be able to revoke the approval whenever they want.

```ts
collection1.approveForAll(user, bridge) # ERC721 standard approvalForAll method
collection2.approveForAll(user, bridge) # ERC721 standard approvalForAll method
collection3.approveForAll(user, bridge) # ERC721 standard approvalForAll method
```

Tx.2) The user should call the bridge smart contract to poll assets from their account to the bridge. The transaction to poll is required each time the user wants to deposit assets.

```ts
bridge.depositFor(user, beneficiary, [collections], [tokenIds])
```

_**Min transactions:** 2_

_**Recurrent transactions:** 1 if it is an approved collection. 2 if it is a collection to be approved_

_**Number of collections involved per deposit:** n_

_**Max assets per deposit**_: 60

### Alt 2: Transfering the assets

The alternative needs one transaction per collection to transfer the assets to the bridge.

Tx.1) The user should transfer the assets to the bridge contract. A transaction per collection is needed.

```ts
collection1.safeTransferFrom(user, bridge, [tokenIds]) # ERC721 standard safeTransferFrom method
collection2.safeTransferFrom(user, bridge, [tokenIds]) # ERC721 standard safeTransferFrom method
collection3.safeTransferFrom(user, bridge, [tokenIds]) # ERC721 standard safeTransferFrom method
```

_**Min transactions:** 1_

_**Recurrent transactions:** 1 per collection per deposit_

_**Number of collections involved per deposit:** 1_

_**Max assets per deposit**_: 60

## Decision Outcome

### Atl 1 ✅

#### Pros

- 1 transaction in the future after approving each collection.
- Can transfer assets from different collections in a single transaction.
- Suitable for mid-long terms users.
- Users are used to make the approval & transfer/deposit

#### Cons

- Less secure than Alt2 since the user needs to grant the bridge the ability to move their assets.

### Alt 2

#### Pros

- Suitable for short terms users.
- No need to grant allowances.

#### Cons

- If the user wants to move assets from different collections, they will need to do 1 transaction per collection

### Open Questions

- No relevant questions

## Participants

- @mat
- @nico
- @juanca
- @agus
- @nacho
