---
layout: adr
adr: 251
title: Offchain Marketplace
date: 2024-09-12
status: Review
type: RFC
spdx-license: CC0-1.0
authors:
- fzavalia
---

# Abstract

This document delves into the advantages of implementing an Offchain Marketplace contract for the Decentraland Marketplace. By leveraging off-chain trade signing and on-chain execution, the proposed system introduces a more efficient, scalable, and cost-effective way to conduct digital asset transactions.

# Context

The Decentraland Marketplace currently operates through a series of smart contracts that facilitate various marketplace functionalities, such as creating and executing orders and bids for NFTs, as well as conducting primary sales of wearables.

1. **[Marketplace Contract](https://etherscan.io/address/0x8e5660b4ab70168b5a6feea0e0315cb49c8cd539)**: 

    This contract enables users to list NFTs for sale and execute sales. Users can create orders for their assets, allowing others to buy them. A similar version of this contract is deployed on [Polygon](https://polygonscan.com/address/0x02080031b45A3c67d338Dd4A2CC309D28756A160) for assets in that chain.
   
2. **[Bid Contract](https://etherscan.io/address/0xe479dfd9664c693b2e2992300930b00bfde08233)**: 
    
    The Bid contract allows users to place and accept bids on NFTs. This is useful for users who want to make offers for assets that aren’t currently listed for sale. The contract also exists on [Polygon](https://polygonscan.com/address/0xb96697FA4A3361Ba35B774a42c58dACcaAd1B8E1).
   
3. **[CollectionStore Contract](https://polygonscan.com/address/0x214ffC0f0103735728dc66b61A22e4F163e275ae)**: 
    
    This contract enables primary sales of Decentraland wearables, particularly useful for creators who release new collections of digital assets. The contract only exists on Polygon.

#### Current Limitations

One of the main challenges with the current smart contract architecture in Decentraland is that **every transaction requires users to interact directly with the blockchain**, incurring gas fees for each action. Whether a user is listing an NFT for sale, placing a bid, or purchasing an item, they must submit an on-chain transaction, paying Ethereum or Polygon gas fees in the process. This can be an expensive and cumbersome process, especially on Ethereum during periods of high network congestion.

In contrast, other marketplaces such as [OpenSea](https://opensea.io/) have implemented **off-chain signing mechanisms** for creating orders and bids. Rather than paying gas fees each time a user interacts with the platform, users simply sign an off-chain message with their wallets, signaling their intent to list, bid, or purchase an asset. The trade is only executed on-chain once a counterparty is ready to complete it, resulting in just **one final on-chain transaction**—saving significant gas fees for both buyers and sellers.

Additionally, Decentraland's current contracts **lack some common features** typically found in web2 marketplaces (such as Amazon), including:

- **Shopping carts**: The ability to buy multiple items in a single transaction.
- **Bundles**: Grouping multiple assets together for sale in a single order.
- **Discounts and promotions**: Allowing sellers to offer special pricing or discounts on items for a limited time.

These limitations hinder the marketplace's flexibility and user experience.

# Proposal

The marketplace smart contracts found in the [Offchain Marketplace GitHub repository](https://github.com/decentraland/offchain-marketplace-contract) implement a flexible and efficient system for handling digital asset trades on Ethereum and Polygon. The contracts aim to enhance Decentraland's existing Marketplace functionality, enabling users to perform complex asset exchanges through trades while minimizing on-chain transaction costs.

### Core Mechanism: Off-Chain Trade Signing

At the heart of the system is the ability to define `Trade` structures that contain all the necessary conditions for asset swaps between users. Instead of requiring every trade action to be carried out on-chain, resulting in higher transaction costs, trades are created off-chain and only executed on-chain when needed. This allows users to sign a trade agreement with their wallets off-chain and incur no transaction fees before execution.

This process is made possible through the `accept(Trade[] _trades)` function, which is the main entry point for executing trades. This function accepts an array of `Trade` objects and executes them sequentially, if all specified conditions are met.

### Key Features of Trades

Trades are designed to be versatile, supporting a wide range of asset exchanges and custom conditions. Each trade consists of the following critical components:

1. **Signature**
    
    A trade becomes valid once it has been signed by the creator. The signature verifies the authenticity of the trade and ensures that it was indeed signed by the creator. This is essential for confirming the identity of the party offering the trade and is used to validate the trade's data during execution.

2. **Checks**
    
    Trades incorporate multiple layers of verification to ensure they can be executed correctly. These checks include:
    
    - **Expiration Date**
    
      Specifies when the trade can no longer be executed. Once the expiration date is reached, the trade becomes invalid and cannot be used.

    - **Effective Date**
    
      Determines when the trade becomes active and can be executed. This allows for trades to be scheduled for future activation.

    - **Contract Signature Index**  

      A value stored in the smart contract that must be used when signing trades. The contract owner can update this value to invalidate all previous trade signatures created with an old index.

    - **Signer Signature Index**  
     
      Similar to the contract signature index but specific to each signer. The signer can update this value to invalidate all previously signed trades with an outdated index.

    - **Allowed Executors**  
     
      Defines a list of specific addresses authorized to execute the trade. If no list is provided, the trade is open to be executed by anyone.

    - **External Checks**  
     
      A set of additional verifications performed through external smart contracts. These checks add a custom layer of validation, such as confirming ownership, balance, or other on-chain conditions.

3. **Assets Involved**  
    
    Trades specify the assets that will be exchanged when the trade is executed. These assets can include ERC721 tokens, ERC20 tokens, and Collection Items.  
    
    - **Assets to be Received**: 
      
      Lists the assets that the trade creator (signer) will receive from the counterparty.  

    - **Assets to be Sent**: 

      Lists the assets that the trade creator will give in exchange.  

   The system supports multiple combinations of assets, providing flexibility for diverse asset swaps within a single trade.

### Execution Flow of Trades

- **Off-Chain Creation and Signing**:  

    A trade is defined off-chain, and its structure is signed by the wallet of the user who creates it. This creates a cryptographically secure agreement, ensuring that the trade cannot be tampered with once signed.

- **On-Chain Execution via `accept(Trade[] _trades)`**:  

    When a user (or an authorized address) is ready to execute a trade, they call the `accept` function on-chain with the signed `Trade` object(s). This triggers the on-chain validation, where the smart contract checks the trade’s conditions. Once all checks are satisfied, the trade is executed, and the assets are swapped accordingly.

### Benefits

1. **Lower Gas Costs**:  

    By moving the creation and signing of trades off-chain, users avoid paying transaction fees until the trade is actually executed. This significantly reduces gas costs, especially for trades that are negotiated but never finalized.

2. **Flexibility**:

    Built to support multiple new features and advanced use cases that will add plenty of value to the Decentraland Marketplace.

### Use Cases

#### 1. **Creating a Public Order**

A user wants to list an ERC721 token for sale in exchange for a specific amount of an ERC20 token.

- The owner of the ERC721 token signs a trade offer, specifying that they will transfer the token in exchange for receiving the agreed-upon amount of ERC20 tokens.
- This creates a **public order**, meaning any user can fulfill the conditions (by providing the ERC20 tokens) to complete the trade and acquire the ERC721 token.

**Purpose**: This feature allows users to list their assets for sale on the marketplace, where anyone can purchase them by meeting the trade requirements.

#### 2. **Creating a Bid**

A user wants to acquire a specific ERC721 token and offers a certain amount of ERC20 tokens as payment.

- The buyer signs a trade offer, proposing to send the specified amount of ERC20 tokens in exchange for the ERC721 token.
- This creates a **bid**, meaning the owner of the ERC721 token can review and accept the offer to complete the transaction.

**Purpose**: This allows buyers to make offers on assets they want to purchase, even if the assets are not actively listed for sale. The bid invites the asset owner to accept the buyer's offer.

#### 3. **Creating a Private Order**

A user wants to sell an ERC721 token for a certain amount of ERC20 tokens but restricts the sale to specific addresses.

- The seller creates a **private order** that allows only certain addresses (specific users) to purchase the ERC721 token.
- Only users whose addresses are pre-approved by the seller can complete the transaction.

**Purpose**: This feature is useful for restricted or exclusive sales, allowing sellers to target specific groups of users.

#### 4. **Auctions**

Auctions allow multiple bids for a specific asset or collection of assets.

- Users can place bids for an ERC721 asset, offering a specific amount of ERC20 tokens. The auction runs for a set duration (e.g., one week).
- Once the auction ends, the highest bid can be accepted by the asset owner, and other bids become invalid.

**Purpose**: This provides a flexible way to run decentralized auctions while ensuring that bids that are outbid are invalidated once the auction is over.

#### 5. **Public Order for Multiple Items**

A public order allows a user to sell multiple items in one transaction. The seller can bundle several supported assets, specifying a single amount of ERC20 tokens to receive in exchange.

- The seller lists several items for sale, and the buyer can purchase all of them in exchange for a specified amount of ERC20 tokens.

**Purpose**: This feature is ideal for batch sales or promotions.

#### 6. **Bidding for Multiple Items**

A bidder offers to acquire several assets in exchange for a specific amount of ERC20 tokens.

- A bidder makes an offer to purchase a group of assets by specifying the amount of ERC20 tokens they are willing to pay.

**Purpose**: This feature allows users to bid on multiple items at once, simplifying bulk transactions in cases where a buyer wants to acquire a set of assets for a single price.

#### 7. **Asset Swaps**

Asset swaps enable users to trade one type of asset for another, even if they are not ERC721 and ERC20 tokens.

- For example, a user wants to trade an ERC721 LAND token for another ERC721 Decentraland NAME token.
- The user signs a trade offer specifying that they will send the LAND token and receive the NAME token in return.

**Purpose**: This feature facilitates flexible trades between different asset types supported by the marketplace, beyond just ERC721 and ERC20 combinations.

#### 8. **Hot Sale**

Hot Sales offer time-limited discounts on assets.

- Suppose a user has a Decentraland wearable listed for 100 MANA. They decide to offer a temporary discount to 50 MANA for the next 12 hours.
- The original trade offer specifies the item for 100 MANA.
- The discounted trade offer will be valid for 12 hours only, after which the price reverts to the original amount.

**Purpose**: This feature allows sellers to run promotions or flash sales, adjusting prices dynamically for a limited period.

#### 9. **Discounts**

Discounts can be applied to individual trades or using broader mechanisms like Coupons.

- For example, a creator wants to offer a 50% discount on all items in a collection. They first create a standard trade offer for the items at the full price.
- Then, they generate a discount coupon that applies a 50% discount to all items in the specified collection.

**Purpose**: Discounts make it possible to adjust pricing strategies, either for individual items or entire collections, enhancing marketing flexibility and sales incentives.

#### 10. **Revenue Share**

Revenue sharing allows sellers to distribute the proceeds from a trade between multiple addresses.

- For instance, a user sells a LAND token for 100 MANA but wants to allocate 20% of the MANA to themselves and 80% to a charity.
- The trade offer is structured to specify two separate ERC20 asset transfers, one for each recipient.

**Purpose**: This feature facilitates distributing trade proceeds to multiple beneficiaries, supporting use cases like charity donations or revenue sharing among partners.

#### 11. **Shopping Cart**

The shopping cart feature enables users to bundle multiple trades into a single transaction.

- Users can add various items to their shopping cart and execute all trades together in one go.
- For example, a user might want to buy multiple LAND tokens from different trades. They can add each trade to their cart and execute them in one transaction.

**Purpose**: This feature streamlines the purchasing process for users, making it easier to handle multiple transactions efficiently.

#### 12. **External Checks**

External checks validate trade eligibility by querying external smart contracts.

- For instance, a collection discount coupon can be restricted to users who own at least one wearable from a specific collection. This is enforced by adding an external check to the coupon.

**Purpose**: External checks enhance trade security and eligibility by integrating additional criteria based on external contract data.

#### 13. **USD Pegged MANA Trades**

USD pegged MANA trades allow users to price assets in USD, with the payment being made in MANA.

- For example, a user lists a LAND token for sale at 100 USD. The amount of MANA to be received is calculated based on the current USD to MANA exchange rate provided by Chainlink price feeds.

**Purpose**: This feature enables asset pricing in USD, simplifying pricing for users and ensuring that the payment amount in MANA adjusts with the current exchange rate.

# Conclusion

In summary, the off-chain marketplace contracts for Decentraland provide a powerful, flexible framework for facilitating asset exchanges in a decentralized, trustless environment. By combining off-chain signing with on-chain execution, the system significantly reduces gas costs, supports complex trade conditions, and enhances the overall user experience for trading in Decentraland.
