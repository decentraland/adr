
# 2021-06-15 - Smart contract wallets and meta-transactions

## Context and Problem Statement

Currently we support meta-transactions on Polygon from several of our dApps (Marketplace, Builder, Account) and the Explorer. 

Meta-transactions require the user to sign a function signature that they want us to call on their behalf (so we can subsidize the gas).

The smart contracts that support meta-transactions (like the Marketplace contract) recover the account from the signature on chain, and uses that as the message sender.

Smart contract wallets are smart contracts that can hold assets, and have a set of signers that can command the wallet to perform actions on those assets by providing signed messages authorizing given actions.

When a user of a contract wallet signs a meta transaction, and the public key is recovered on chain by the smart contract that supports meta-transactions, the public key is the one from the signer, and not the contract address of the smart contract wallet (which is the actual owner of the assets). This causes the meta-transactions to fail on chain.

## Considered Options

1) Use EIP-1654 to check if the signature is valid

We can use EIP-1654 to validate the signature, although we would need the smart contract wallet to also be deployed on Polygon for this to work.

2) Disable meta-transactions for accounts that are not EOAs

We can disable meta-transactions for smart contract wallets.

## Decision Outcome

We choose option 2 since we can never be sure that the smart contract wallet has a matching deployment on Polygon, and is not the case for the most popular smart contract wallets (like Argent or Authereum)

## Participants

- @cazala
- @nachomazzara
- @nicosantangelo
