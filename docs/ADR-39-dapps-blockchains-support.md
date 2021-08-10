# DApps Blockchains Support

## Context and Problem Statement

Every dApp and the explorer support meta transactions following the [EIP-712](https://eips.ethereum.org/EIPS/eip-712) to interact with secondary blockchains as Polygon. Meta transactions are sent by the transaction server which is using a third-party to relay them.

[Trezor](https://github.com/trezor/trezor-firmware/pull/1568) and Smart contract wallets (we don't support on-chain validation for signatures) can't send meta transactions. Moreover, users may want to not depends on a server to interact.

Currently, the dApps and the explorer only support one chain per domain.

## Considered options

- Have different subdomains per blockchain like: goerli-market.decentraland.org or goerli.market.decentraland.org

- Supports multiple blockchains within the same subdomain/domain by enabling/disabling features.

## Decision outcome

To make life easier for the users, we have decided to support multiple blockchains by using the same domain/subdomain. Users can switch to different networks and the webapp must respond to the network change event by enabling/disabling features.

# Solution

The dApps team will make a breaking change in the [decentraland-dapps](https://github.com/decentraland/decentraland-dapps) lib to support multiple blockchains in the dApps.

Each dApp will require a manual update to enable/disable features. A common strategy for this will be needed across all the dApps.

The explorer & the SDK should provide a way for the scenes to check the network where the user is connected.

# Participants

- Nacho M.
- Brian.
- Juanca.
- Mendez.
