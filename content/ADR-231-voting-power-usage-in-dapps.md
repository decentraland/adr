---
layout: adr
adr: 231
title: Voting Power usage for High Rated Places and Marketplace Saved Items
date: 2023-05-09
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - kevinszuchet
---

## Abstract

This document outlines the guidelines for dApps that utilize Voting Power (VP) in their voting and ranking procedures and provides strategies to prevent its abuse. The VP feature is instrumental for dApps like Places and the Marketplace, as it can help determine the number of reliable users interacting with them.

## Context, Reach & Prioritization

Voting Power can be used to address the problem of account spamming and aims to provide more accurate and reliable results in dApps. Interacting with these dApps only requires a wallet, which makes it easy for users to create multiple accounts and manipulate metrics such as the number of likes for a Place or the count of users who saved an item in their list. By implementing the Voting Power mechanism, dApps can combat this manipulation and ensure more reliable data.

For example, Places utilizes the VP system to identify the top-rated locations and the number of times they've been favorited. Likewise, the Marketplace employs the same method to tally and showcase how many users have bookmarked a particular item. By incorporating VP, these dApps can showcase the popularity and reliability of their content.

## Solution Space Exploration

To prevent users from creating multiple accounts to manipulate numbers and metrics in the applications mentioned above, a strategy was put in place to retrieve each user's Voting Power (VP) from the Snapshot platform whenever they perform relevant actions, such as saving an item or liking a place. This information is then stored for future use, and only users with a specific VP, as defined by each dApp, are considered in the final calculation.

To improve performance, the decision was made to store the VP when a user performs an action, rather than retrieving it each time the calculation is requested. This approach is more efficient, as the number of VP calculations increases linearly with the number of users who perform relevant actions.

However, it is important to note a potential drawback of this method. Users could transfer their assets to a new account and use the same VP they had in their original account to perform actions again in the new one. This could result in inaccurate calculations, as the same assets would be counted twice when retrieving the VP. Additionally, this approach could undervalue new users or those with less Voting Power, as their actions would not be considered in the final count.

## Specification

The guidelines mentioned above were released to production on September 28, 2022 for Places upvotes, downvotes, and favorites ([here](https://github.com/decentraland/places/pull/81) the link to the PR) and on May 4, 2023 for the Marketplace Lists ([here](https://github.com/decentraland/marketplace-favorites-server/pull/27) and [here](https://github.com/decentraland/marketplace-favorites-server/pull/80) the links to the PRs).

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
