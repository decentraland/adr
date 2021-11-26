# Collections secondary marketplaces v2

## Statement of the problem

The current marketplaces (Marketplace & Bid) have two fees, a publication fee which is charged to the seller of the asset once they create an order, and a cut fee which is deducted to the seller to the final price when an order/bid is executed. For the time being, the publication fee is `0` and the cut fee is `2.5%`. Those fees go to the owner of the smart contract. Here, arise the first issue, the owner of the smart contract is not always where we want to send the fees making the management of those fees hard. The second one, and the most important, is that it doesn't support royalties for user-generated collections assets (Decentraland collections v2).

## Solution proposed

### Fees

The publication and cut fees go to the fees collector instead of the owner.

A new fee is added: **Royalties fees**. The royalties fees apply only when an order or bid is executed.

- The cut and royalties fees must be lower than 100%. Both happen once an order/bid is executed.
- If the cut and royalties fees are set, both are calculated and sent independently.
- If the royalties fees are set but the receiver can't be calculated, the fees go the fees collector.
- The owner of the contract can modify the fees.

### Roles

There are two new roles:

**Fees collector**: the publication and cut fees go there keeping the owner of the contract as a different entity. The owner of the contract can change the fees collector.

**Royalties Manager**: not completely a new role but a module. This contract will return where the royalties fees must go. Find the [specs here](./ADR-46-royalties-manager-v1.md). The owner of the contract can change the royalties manager contract. This allows using further versions of the royalties manager.

### Small enhancements

This is not part of the main reason, but also the Solidity version is updated to 0.8 and the error messages are standardized.

## Implementation

- [Marketplace](https://github.com/decentraland/marketplace-contracts/pull/56)
- [Bid](https://github.com/decentraland/bid-contract/pull/2)

## Links

- [Proposal for royalties fees](https://governance.decentraland.org/proposal/?id=b70c59d0-09c5-11ec-a4d1-8d5d2cba0825)

## Participants

- @Agus F

- @Fer

- @Nico

- @Juanca

- @Lautaro

- @Nacho
