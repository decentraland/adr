
# 2021-06-22 - Front and back end architecture for the Marketplace

## Context and Problem Statement

The newest version of the Marketplace supports various sources for it's data.

We need to agreggate the blockchain, multiple graphs and data from our partners, which themselves are represented as API requests to different servers.

We don't only need to show the data to the user, but we should also provide different ways to interact with it, mainly buying and selling assets. We should also allow the user to filter the data in different ways.

To do this, assets from different sources have their own version of what it means to filter them, and we might also need to interact with different contracts, depending on the operation.

## Considered Options

1) Use the front-end as both an aggregator and data handler for the UI

All APIs we need to hit are public. The front-end could decide which one to hit, aggregate the data and show it to the user

2) Write and use a server as a middle man which abstracts the APIs we manage (excluding partners) and aggregates the data with a single, generic type shared between both sides

The server would be in charge of putting up a generic interface to access and filter all the assets Decentraland knows about

3) Write and use a server as a middle man which abstracts all APIs away, aggregates the data with a single, generic type shared between both sides and handles contract interactions

The server would be in charge of putting up a generic interface to access and filter all assets and the interaction with them, having to know also each contract and how to access it

## Decision Outcome

We choose option 2 because it gives us many advantages over centralizing the logic in the front-end, like:
- having a server other parts of Decentraland can access
- making the front-end lighter and simpler, to be able to deliver the webpage faster to the user
- providing caching for problematic endpoints if necessary

but allowing us to keep parts that are Marketplace-centric in the front end, like the interaction with partners and with contracts.

## Participants

- @cazala
- @nachomazzara
- @nicosantangelo
