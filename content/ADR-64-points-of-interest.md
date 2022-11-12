---
adr: 64
date: 2022-03-22
title: Points of interest (POIs)
status: Draft
authors:
  - davidejensen
type: Standards Track
spdx-license: CC0-1.0
---

## Context

In the context of creating a system that allows the DAO to target the most valuable places around Decentraland, there needs to be a mechanism to add, obtain and remove different points of interest.
This system has been existing with various components divided across multiple teams, this ADR documents the current integration.

## Current solution

### Introduction

Points of interest (aka POIs), are parcels or estates that have been voted by the DAO as such, a POI is visualized inside the explorer to reflect this choice.
This functionality requires an integration on different levels, from the smart contract to the final visualization in the current unity-renderer.

![resources/ADR-64/POIs-flow.png](resources/ADR-64/POIs-flow.png)

### Smart contract

A smart contract to hold this informations has been created, its main functionalities are:

- Hold the list of current active POIs
- Provide a functionality to add new POIs
- Provide a functionality to remove POIs

The smart contract address for the mainnet is: 0x0ef15a1c7a49429a36cb46d4da8c53119242b54e
The smart contract address for the test net (ROPSTEN) is: 0x5DC4a5C214f2161F0D5595a6dDd9352409aE3Ab4

### DAO

The DAO utilizes the smart contract functionalities to add and remove POIs.

### Lambda

A lambda function has been created to provide an access point where to obtain the list of the current active POIs https://decentraland.github.io/catalyst-api-specs/#operation/getPois

### Kernel

Kernel uses the Lambda function to retreive the list of current POIs, and then attach this info in the metadata sent for each parcel when requested by the unity-renderer.

### Unity renderer

When displaying the map and its POIs the unity renderer communicates with the kernel getting the list of parcels/estates that are POIs and displaying a star in their position. It also applies a filter for POIs that are Empty Parcels and it reduces the number of visible characters to avoid saturating the map visuals.

## Current problems

A problem was noticed with a wider use of POIs. There are currently some POIs that are Empty Parcels. This has been currently solved by a filtering in the unity-renderer of those parcels, but the POIs still are in the smart contract.
