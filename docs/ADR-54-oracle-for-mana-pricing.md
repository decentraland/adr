# Use an Oracle for MANA pricing according to USD rate

## Statement of the problem

Some features require the user to pay a certain amount of MANA for execution. These features include:

- Publishing a collection, which charges the user a fixed amount of MANA depending on the rarities of the items being published with the collection

- Claiming a name, where the user is charged a fixed amount of MANA to claim.

- Purchasing Third Party item slots, which are charged according to the number of slots bought.

Given the price fluctuations of the token, more importantly, the increase in price over time, these features have become more expensive for the user to consume, thus discouraging content creators from actually adding content to the platform, hurting Decentraland as a whole on the process.

In the case of publishing a collection, prices are being changed manually each week so they reflect a certain price in USD, making the price more stable and fair for all creators. However, this being a manual process can become tedious and not completely precise as MANA price might still fluctuate mid-week.

## Proposed solution

Chainlink MANA/USD Data Feed allows our contracts to obtain the rate of MANA in USD. This can be used, given an original price in USD, to calculate how much MANA is required by the user to perform a certain transaction.

For more information about Chainlink go check their [homepage](https://chain.link/) or their [whitepaper](https://chain.link/whitepaper).

In summary, Chainlink is a solution in which via Oracles, one can obtain off-chain data in a tamper-proof and still decentralized manner to be used on-chain.

To implement these price feeds we will create a new contract `ChainlinkOracle` with a `getRate` function. This oracle will be consumed by other contracts which require the rate of MANA/USD to reflect a price accordingly. This `ChainlinkOracle` will receive both a Data Feed (Represented as an [AggregatorV3Interface](https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.7/interfaces/AggregatorV3Interface.sol) by the Chainlink [docs](https://docs.chain.link/docs/get-the-latest-price/#solidity)).

A contract consuming this oracle can then do the following calculation to obtain and use/return and amount of MANA converted from USD.

```
uint256 priceInUSD = 100000000000000000000; // 100 USD
uint256 rate = oracle.getRate(); // 5000000000000000000 -> 5 USD per MANA
uint256 finalPrice = priceInUSD.mul(1 ether).div(rate); // 20000000000000000000 -> 20 MANA
```

## MANA/USD Data Feed addresses

### Ethereum

[0x56a4857acbcfe3a66965c251628B1c9f1c408C19](https://etherscan.io/address/0x56a4857acbcfe3a66965c251628B1c9f1c408C19)

### Polygon

[0xA1CbF3Fe43BC3501e3Fc4b573e822c70e76A7512](https://polygonscan.com/address/0xA1CbF3Fe43BC3501e3Fc4b573e822c70e76A7512)

## Participants

- @nachomazzara
- @fzavalia
