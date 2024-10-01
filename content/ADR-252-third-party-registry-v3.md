---
layout: adr
adr: 252
title: Third Party Registry V3
date: 2024-10-01
status: Review
type: RFC
spdx-license: CC0-1.0
authors:
- fzavalia
---

# Abstract

This document explores the enhancements introduced by the third version of the Third Party Registry smart contract. Notably, it outlines how Third Parties can now be created by any wallet, with the cost determined by the number of required item slots. Additionally, it explains the concept and benefits of “programmatic” Third Parties within this new framework.

# Context

In the previous version of this smart contract, the creation of Third Parties was restricted to a designated wallet known as the “Third Party Aggregator”. This wallet was responsible for manually adding a Third Party whenever a proposed “Linked Wearable” project was approved through governance in https://decentraland.org/dao/.

This process restricted the number of projects that could be added to Decentraland, necessitating the development of an alternative approach to improve this functionality.

# Proposal

Integrate version 3 of the [Third Party Registry](https://github.com/decentraland/wearables-contracts/blob/91e936526b98f0ac045960507730192121be25ef/contracts/registries/ThirdPartyRegistryV3.sol).

This updated version removes the `onlyThirdPartyAggregator` modifier from the `addThirdParties` function, enabling any wallet to invoke the function, and thereby allowing anyone to create a new third party.

However, invoking this function incurs a cost in MANA for the caller, determined by two primary factors:

**Item Slots**

When creating a third party, the user specifies the number of item slots by setting the `ThirdPartyParam.slots` argument. The number of slots directly influences the amount of MANA required to pay.

Each slot has a fixed price in USD, stored in the `itemSlotPrice` variable. This USD price is then converted to MANA using the [MANA/USD Chainlink price feed](https://data.chain.link/feeds/polygon/mainnet/mana-usd), which determines the final MANA amount the user must pay.

For instance, if MANA is priced at 0.5 USD, and the user wishes to create a Third Party with 10 slots at a rate of 100 USD per slot, the total cost would be 2000 MANA (200 MANA per slot * 10).

**Programmatic Third Parties**

Version 3 introduces the concept of "programmatic" Third Parties. Programmatic TPs refer to third parties whose item representations are generated automatically through a script or other processes. For example, an NFT project with 1000 racing cars may generate car representations through a script that modifies textures or other simple details, rather than creating them manually.

In such cases, users can designate a third party as programmatic by setting the `_areProgrammatic` variable in the `addThirdParties` function as `true`.

Programmatic third parties are charged a fixed rate based on the `programmaticBasePurchasedSlots` variable. For example, if this variable is set to 20, a programmatic TP will be billed as if it had 20 item slots. However, there is no limit to the number of item slots a programmatic TP can actually have.

Given that programmatic Third Parties are reviewed by curators before being made available on the platform, users cannot exploit the different pricing models for programmatic and non-programmatic Third Parties. For instance, a user attempting to create a Third Party with 30 manually created items and marking it as programmatic to pay less would fail to comply with the committee's rules and would not be approved.

---

The `buyItemSlots` function has been updated to allow programmatic Third Party managers to add an unlimited number of item slots for free if the initial amount defined was insufficient.

This function enables users to add item slots to their Third Parties. For non-programmatic Third Parties, the cost of adding additional slots remains the same as the price per slot at the time of creation.

# Conclusion

This version of the Third Party Registry removes the reliance on the Third Party Aggregator by allowing anyone to create Third Parties at any time, with the associated cost being collected by the DAO.

This change grants users greater control and flexibility in managing their projects within the platform.