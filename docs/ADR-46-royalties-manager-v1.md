# Royalties Manager v1

## Statement of the problem

The user generated collections (Decentraland Collections V2) does not support royalties out of the box when a transfer occurs.

## Solution proposed

Decentraland marketplaces (Marketplace and Bid) can support royalties with the help of a new module: **Royalties Manager**.

For the first version, the royalties manager will return just the royalties receiver which is the address where the royalties should be sent. The royalties receiver is going to be defined by quering the collection on-chain:

- If the item has a beneficiary, then the royalties receiver will be the item beneficiary. If not,
- If the collection creator is not the zero address, The collection creator will be returned as the royalties receiver. If not,
- The address zero will be returned as the royalties receiver.

Moreover, if the collection is not a Decentraland collection V2 compliant, the royalties receiver will be the zero address.

The collection is compliant, if implements the following interface:

```solidity
interface IERC721CollectionV2 {
    function creator() external view returns (address);
    function decodeTokenId(uint256 _tokenId) external view returns (uint256, uint256);
    function items(uint256 _itemId) external view returns (string memory, uint256, uint256, uint256, address, string memory, string memory);
}
```

### Interface

The interface proposed for the Royalties Manager is

```solidity
interface IRoyaltiesManager {
    function getRoyaltiesReceiver(address _contractAddress, uint256 _tokenId) external view returns (address);
}

```

- `getRoyaltiesReceiver`: must not revert at any circumstances (only run out of gas). It is 100% recommended to use `staticCall` to be 100% sure that it won't allow any state changes.

## Implementation

- [RoyaltiesManager.sol](https://github.com/decentraland/marketplace-contracts/pull/56/files#diff-25b66877c494660071f3b1e2ea81d010a1e7207ebcd8700faf17fc8a157d06bb)

## Participants

- @Agus F

- @Fer

- @Nico

- @Juanca

- @Lautaro

- @Nacho
