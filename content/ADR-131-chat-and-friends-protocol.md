---
layout: doc
adr: 131
date: 2022-11-16
title: Chat and Friends protocol
description: Document with chat and friends protocol definitions
type: RFC
status: Draft 
spdx-license: CC0-1.0
authors:
  - guidota 
---

## Abstract

Most communications between the Explorer and Kernel, use a JSON based mechanism that we want to replace with RPC and a protocol. 
Chat and Friends features are using that mechanism and fixing or extending the functionality can be very hard to define and mantain.
In this RFC, the interactions will be reviewed and a protocol for those features will be defined.

## Need

Nowadays, communication flows are very hard to document, fix, extend or even mantain. Changing a single field in a message can break the hole feature or the user session.
Also, JSON based messages deserialization are creating objects that then would be deleted by the Garbage Collector, affecting Explorer stability when there are a lot of them.

## Approach

First of all, every feature flow should be identified in order to define the messages between Explorer and Kernel, then:
 - Review messages that are not Request-Response based
 - Add chat and friends definitions to Decentraland Protocol (@dcl/protocol)
 - Implement RPC Server on Kernel
 - Implement RPC Client on Explorer

As part of this RFC, flows should be described here before adding the definitions to the Decentraland Protocol.

TODO: Complete flow diagrams for every action

## Benefit

De/serializing JSON can be very slow and waste a lot of time collecting the garbage. Using decentraland protocol and RPC would improve performance and mantainability. 
Also, developers would be talking in the same language and would not have to replicate definitions in both sides, making it reliable and secure.
In the same direction, these features can be extracted in the future into a service that would not run in the Kernel, simplifying code and improving performance. 

## Competition

 --

---

