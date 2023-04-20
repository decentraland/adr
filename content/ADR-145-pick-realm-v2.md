---
layout: adr
adr: 145
title: Pick Realm Algorithm V2
date: 2022-11-28
status: Draft
type: RFC
spdx-license: CC0-1.0
slug: /adr/TEMPLATE
authors:
  - agusaldasoro
  - aleortega
---

## Abstract

The purpose of this document is to outline the necessary modifications to improve the realm picking algorithm, both in terms of its functionality and implementation.

With regard to functionality, the algorithm will be updated to incorporate additional variables in the Catalyst selection process through the addition of new rules. As for the implementation, the software will be relocated to the server-side to accommodate multiple client implementations.

## Context, Reach & Prioritization

The realm-picking algorithm utilizes a predefined set of rules called `variants` to dynamically switch to the optimal approach based on the platform context through configuration files. However, it has been identified that this algorithm lacks certain capabilities to address potential contexts that Decentraland may encounter. To enhance the selection algorithm, the following improvements are intended:

- Addition of new rules:
  - Overloaded Catalyst: Servers with CPU or memory usage exceeding 90%, or reaching maximum user capacity, will be excluded from selection.
  - Catalyst Version: Nodes with a version lower than the minimum required version (_as specified in the configuration_) will be excluded from selection. This will allow us to set minimum required version for each service running within a Catalyst.
  - Catalyst Force: Possibility to forcibly select a Catalyst.
- Creation of multiple default rule sets (known as _variants_) that can be easily switched to use different techniques for realm picking.
- Relocating the algorithm to the server-side to accommodate multiple client implementations without losing any capabilities.

From now on, the rules will be referred to as `links` and `filters`. Filters will be used to remove nodes that do not meet specific criteria, while links will be used to assign scores to nodes to determine the best one for redirecting users.

## Solution Space Exploration

### Algorithm improvement

The existing implementation of the realm picking algorithm, as outlined in the [Realm Picking Algorithm ADR](https://adr.decentraland.org/adr/ADR-86), allows for extensibility through the addition of new links and filters. In this proposal, two filters and a new link will be introduced:
- **OVERLOADED_CATALYST**: This filter will exclude a Catalyst if its resource usage or user capacity reaches a certain threshold.
- **VERSION_CATALYST**: This filter will exclude a Catalyst if it does not meet the minimum required version as specified.
- **FORCE_CATALYST**: This new link will enable the forcible selection of a Catalyst listed in its configuration.

Furthermore, four new variants will be added, each containing a set of rules designed to address specific contexts.

### Server-side

This algorithm will be implemented on the server-side to accommodate various client implementations. While this may require modifying the implementation of the `LARGE_LATENCY` rule to receive necessary information from the client-side, it will enable enhancements such as adding a cache mechanism or event-driven notifications to proactively filter out unhealthy Catalysts, thereby improving the overall performance of the algorithm.

To fulfill the goal of creating a cost-effective, scalable and globally accessible service, two implementation proposals, CloudFlare Workers and AWS Lambdas, are being considered. The optimal choice for this service will be determined by analyzing various aspects related to cost, pricing model, performance, and latency, which will be discussed in detail in the Server-Side Implementation section.

To assess these aspects, we will examine the workload of the current algorithm, which is monitored through Segment events. The chart below presents the workload data for the past 4 months as of the time of writing.

<img src="resources/ADR-145/realm-picking-algorithm-workload.png" alt="drawing" style="width:100%;"/>

_The average workload is 10k realm picks per day._

## Specification

### Overloaded Catalyst

_Description_:

Exposing the available resources of Catalyst Nodes publicly poses a security risk, and thus, their estimation should be conducted within the Catalyst itself (_specifically in the BFF_), rather than in the Kernel.

Consequently, the BFF will utilize the `acceptingUsers` field in the `/about` endpoint to leverage the calculation of this value. The logic on the Kernel side will be straightforward, involving filtering out Catalysts with a value of false for this field.

On the other hand, the BFF will implement a set of rules to determine the value of `acceptingUsers`. The `acceptingUsers` field will be set to false if:
- The maximum number of users for the server has been reached, with the maximum amount being specified through environment variables.
- The CPU is at 90% or higher
- The memory usage is at 90% or higher


_Pseudo Code_:

To filter out a new check will need to be added to:
https://github.com/decentraland/kernel/blob/main/packages/shared/dao/index.ts#L69


```typescript
export function fetchCatalystStatus() {

  if (currentChecks && result.acceptingUsers) {
    // ...
  }

  return undefined
}
```

### Catalyst Version

_Description_:

Every Catalyst node provides information about the versions of its Content, Lambdas, BFF, and Comms components. The Kernel reads these version fields and compares them with the minimum required version specified in the rule configuration. As a result, the configuration has the flexibility to specify minimum required versions for one or more services, allowing the Catalyst to be considered as a candidate only if it meets these requirements. This means that the configuration file can specify minimum required versions for X and Xn services, giving the flexibility to specify versions for one or more services as needed.


_Pseudo Code_:

```typescript
export function catalystVersionLink(configuration: CatalystVersionConfig) {
  const minimumRequiredVersions = configuration

  Object.keys(minimumRequiredVersions).forEach(([serviceName, serviceRequiredVersion]) => {
    validCandidates = picked.filter(candidate => meetsVersion(candidate, serviceName, serviceRequiredVersion))
    // ...
  })

  return validCandidates
}
```

_Configuration_:

```typescript
export type CatalystVersionConfig = {
  config?: 
          { comms?: string;
            bff?: string;
            content?: string;
            lambdas?: string;
          }
}
```

### Force Catalyst

_Description_:

This rule will have multiple Catalysts, sorted by priority, defined in its configuration. The rule will attempt to connect to the first Catalyst in the list. If it is unavailable, it will continue trying with the subsequent Catalysts specified in the configuration in order of priority.

_Pseudo Code_:

```typescript
export function catalystVersionLink(configuration: ForceCatalystConfig) {
    let picked = context.picked
    
    const candidates = picked.map(candidate => candidate.catalystName)
    const selected = configuration.sortedOptions?.find(candidate => candidates.includes(candidate))
    
    context.selected = !!selected 
        ? picked.find(candidate => candidate.catalystName === selected)
        : undefined

    return context
}
```

_Configuration_:

```typescript
export type ForceCatalystConfig = {
  config?: { sortedOptions?: [string]; }
}
```

### Large Latency

_Description_:

This rule will still operate as it currently does. However, in order to implement it on the server-side, the client will need to check the latency on all nodes to pass this information to the service. To prevent clients from constantly calling all nodes to check latency, they will first check if the realm-picking service is using a `variant` that contains the `LARGE_LATENCY` filter and only if it does it will gather the latency information to pass it over.

### Variants

#### Default

This variant will serve as the default configuration when no specific context needs to be addressed.
- Filter by OVERLOADED_CATALYST
  - Firstly, nodes that are struggling to perform as expected will be filtered out.
- Filter by LARGE_LATENCY
  - Next, nodes that are located far away from the user in terms of latency will be filtered out.
- Score by CLOSE_PEERS_SCORE
  - After filtering, if the user is attempting to connect to a specific scene, they will be redirected to the node with the highest number of peers in that scene.
- Score by ALL_PEERS_SCORE
  - If the previous score does not result in the selection of a single catalyst, the node with the highest number of peers connected to it will be chosen.
- Balance with LOAD_BALANCING
  - As a fallback, if multiple catalysts are eligible for selection, a Round-Robin strategy will be implemented to evenly distribute the load among them.

#### Versioning

This variant will be utilized when it is necessary to ensure that users connect to a specific or minimum version of Catalyst.
- Filter by CATALYST_VERSION
  - Firstly, nodes that do not meet the specified version criteria will be filtered out.
- Filter by OVERLOADED_CATALYST
  - Then, nodes that are struggling to perform as expected will be filtered out.
- Balance with LOAD_BALANCING
  - As a fallback, if multiple catalysts are eligible for selection, a Round-Robin strategy will be implemented to evenly distribute the load among them.


#### Force

This variant will be employed when it is necessary to forcibly direct users to connect to specific realms.
- FORCE_CATALYST
  - This link will be used to attempt selection of a node as specified in its configuration.

#### Crowd

This variant will be useful when we want to crowd the nodes so the users can interact between them more frequently.
- Score by CLOSE_PEERS_SCORE
  - After filtering, if the user is attempting to connect to a specific scene, they will be redirected to the node with the highest number of peers in that scene.
- Score by ALL_PEERS_SCORE
  - If the previous score does not result in the selection of a single catalyst, the node with the highest number of peers connected to it will be chosen.
- Balance with LOAD_BALANCING
  - As a fallback, if multiple catalysts are eligible for selection, a Round-Robin strategy will be implemented to evenly distribute the load among them.

### Server-Side Implementation

TBD