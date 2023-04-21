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

The [realm-picking algorithm currently in use](https://adr.decentraland.org/adr/ADR-86) has the ability to manually add or remove rules, allowing for dynamic adjustments during runtime based on the platform context. However, going forward, the algorithm will be enhanced with a predefined set of rules that are specifically designed to address expected contexts such as events or performance degradation. These predefined rules will be configured and managed by the Foundation.

Some examples of the new rules that may be added to the algorithm include:

- Overloaded Catalyst: This rule will filter out nodes with CPU or memory usage exceeding 90% or reaching maximum user capacity, ensuring efficient workload distribution.
- Catalyst Version: This rule will allow the Foundation to specify the minimum required version of the Catalyst service to be eligible for realm picking, ensuring compatibility and optimal performance.
- Catalyst Force: This rule will enable the Foundation to direct the workload to a specific Catalyst, facilitating targeted resource allocation.

In addition, multiple default rule sets will be created, making it easy to switch between different techniques for realm picking based on the current context of the platform. Moreover, the algorithm will be relocated to the server-side to accommodate multiple client implementations while retaining its full capabilities.

## Solution Space Exploration

### Algorithm improvement

The existing implementation of the realm picking algorithm, as outlined in the [Realm Picking Algorithm ADR](https://adr.decentraland.org/adr/ADR-86), allows for extensibility through the addition of new rules. In this proposal, three rules will be introduced:
- **OVERLOADED_CATALYST**: This rule will exclude a Catalyst if its resource usage or user capacity reaches a certain threshold.
- **VERSION_CATALYST**: This rule will exclude a Catalyst if it does not meet the minimum required version as specified in its own configuration.
- **FORCE_CATALYST**: This rule will enable the forcible selection of a Catalyst listed in its own configuration.

Furthermore, a predefined set of rules will be created to enable quick switching between them based on the platform context. Currently, four sets of rules are planned to be added:
- **Default**: This set of rules will be used as the standard configuration, prioritizing performance and proximity of users.
- **Versioning**: This set of rules will be employed when it is necessary to ensure a minimum version requirement for compatibility and optimal performance.
- **Force**: This set of rules will be used for targeted resource allocation, allowing for specification of multiple Catalysts sorted by priority or a single one.
- **Crowd**: This set of rules will be utilized when it is desired to increase the density of nodes to facilitate frequent interaction among users.

These predefined sets of rules will be managed by the Foundation, and can be easily switched between based on the current context of the platform.

### Allocating the algorithm on its own server

The algorithm will be implemented as a serverless service, outside of the Catalyst services bundle, to accommodate various client implementations. While this may involve modifying the `LARGE_LATENCY` rule to obtain necessary information from the client-side, it opens up possibilities for enhancements such as implementing cache mechanisms or event-driven notifications to proactively filter out unhealthy Catalysts, leading to improved algorithm performance. For further details on this specific rule implementation, please refer to the section on the Large Latency rule.

To fulfill the goal of creating a cost-effective, scalable and globally accessible service, two implementation proposals, CloudFlare Workers and AWS Lambdas, are being considered. The optimal choice for this service will be determined by analyzing various aspects related to cost, pricing model, performance, and latency, which will be discussed in detail in the Server-Side Implementation section.

To assess these aspects, we will examine the workload of the current algorithm, which is monitored through Segment events. The chart below presents the workload data for the past 4 months as of the time of writing.

<img src="resources/ADR-145/realm-picking-algorithm-workload.png" alt="drawing" style="width:100%;"/>

_The average workload is 10k realm picks per day._

In light of the service being allocated on the server-side going forward, it is imperative to implement a fallback mechanism on the client-side for situations where the service may be unavailable at certain times. This desirable feature would allow for connecting to the most suitable node based on specific user and rule criteria. In the event that the service is unavailable, the client would then redirect the user to any available node using a Round Robin algorithm, ensuring uninterrupted access to Decentraland.

The service will continue to operate as it currently does, returning the most suitable node based on specific user and rule criteria, if it is reachable. However, in case there are no eligible Catalyst nodes based on the given context, the service will utilize a Round-Robin algorithm to select any available node.

## Specification

### Overloaded Catalyst

_Description_:

Exposing the available resources of Catalyst Nodes publicly poses a security risk, and thus, their estimation should be conducted within the Catalyst itself, rather than in the Kernel.

Consequently, the Catalyst will utilize the `acceptingUsers` field, which will be returned as part of the realm description in a specific endpoint, to leverage the calculation of this value. The logic on the Kernel side will be straightforward, involving filtering out nodes with a value of false for this field.

On the other hand, the Catalyst will implement a set of rules to determine the value of `acceptingUsers`. The `acceptingUsers` field will be set to false if:
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

Every Catalyst node provides information about the versions of its Content, Lambdas, and Comms components. The Kernel reads these version fields and compares them with the minimum required version specified in the rule configuration. As a result, the configuration has the flexibility to specify minimum required versions for one or more services, allowing the Catalyst to be considered as a candidate only if it meets these requirements. This means that the configuration file can specify minimum required versions for X and Xn services, giving the flexibility to specify versions for one or more services as needed.


_Pseudo Code_:

```typescript
export function catalystVersionRule(configuration: CatalystVersionConfig) {
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
export function catalystVersionRule(configuration: ForceCatalystConfig) {
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

This rule will still operate as it currently does. However, to implement it on the server-side, the client will be required to check the latency of all nodes and provide this information to the service. To avoid excessive latency checks by clients, they will first verify if the realm-picking service is utilizing a set of rules that includes `LARGE_LATENCY`, and only then gather latency information to pass on. Ultimately, if this rule is in effect, it will filter out nodes that do not meet a predefined threshold as per its configuration.

### Set of Rules

#### Default

This set of rules will serve as the default configuration when no specific context needs to be addressed.
1. Filter by OVERLOADED_CATALYST
    - Firstly, nodes that are struggling to perform as expected will be filtered out.
2. Filter by LARGE_LATENCY
    - Next, nodes that are located far away from the user in terms of latency will be filtered out.
3. Score by CLOSE_PEERS_SCORE
    - After filtering, if the user is attempting to connect to a specific scene, they will be redirected to the node with the highest number of peers in that scene.
4. Score by ALL_PEERS_SCORE
    - If the previous score does not result in the selection of a single catalyst, the node with the highest number of peers connected to it will be chosen.
5. Balance with LOAD_BALANCING
    - As a fallback, if multiple catalysts are eligible for selection, a Round-Robin strategy will be implemented to evenly distribute the load among them.

#### Versioning

This set of rules will be utilized when it is necessary to ensure that users connect to a specific or minimum version of Catalyst.
1. Filter by CATALYST_VERSION
    - Firstly, nodes that do not meet the specified version criteria will be filtered out.
2. Filter by OVERLOADED_CATALYST
    - Then, nodes that are struggling to perform as expected will be filtered out.
3. Balance with LOAD_BALANCING
    - As a fallback, if multiple catalysts are eligible for selection, a Round-Robin strategy will be implemented to evenly distribute the load among them.


#### Force

This set of rules will be employed when it is necessary to forcibly direct users to connect to specific realms.
1. FORCE_CATALYST
    - This rule will be used to attempt selection of a node as specified in its configuration.

#### Crowd

This set of rules will be useful when we want to crowd the nodes so the users can interact between them more frequently.
1. Score by CLOSE_PEERS_SCORE
    - After filtering, if the user is attempting to connect to a specific scene, they will be redirected to the node with the highest number of peers in that scene.
2. Score by ALL_PEERS_SCORE
    - If the previous score does not result in the selection of a single catalyst, the node with the highest number of peers connected to it will be chosen.
3. Balance with LOAD_BALANCING
    - As a fallback, if multiple catalysts are eligible for selection, a Round-Robin strategy will be implemented to evenly distribute the load among them.

### Server-Side Implementation

In this section, we will analyze the options for implementing the algorithm on the server side, considering factors such as global availability, cache capabilities, scalability, and cold-start performance. The two options under consideration are `AWS Lambdas` and `CloudFlare Workers`.

CloudFlare Workers have a unique advantage in terms of cold-start performance compared to AWS Lambdas. CloudFlare Workers are built on CloudFlare's extensive global edge network, which allows them to be _always on_ and ready to respond to requests, with no cold-start delays. This is because CloudFlare Workers are deployed across numerous data centers worldwide, enabling them to be readily available and responsive to incoming requests, even in geographically distributed environments.

Additionally, CloudFlare Workers leverage CloudFlare's global edge network to provide worldwide availability and offer built-in caching capabilities, making it easy to cache responses and implement flexible caching strategies using features like custom cache control headers, edge caching, and KV storage. This can significantly improve performance and reduce the load on the origin server.

On the other hand, AWS Lambdas, while highly scalable, do not have built-in caching capabilities and may experience cold-start delays, where the first request to a Lambda function after a period of inactivity may experience higher latency due to the need to spin up a new instance of the function. This can result in longer response times for the initial request compared to subsequent requests, and may impact applications with strict latency requirements or variable workloads.

Therefore, in terms of global availability, cache capabilities, and performance, CloudFlare Workers may have an advantage over AWS Lambdas, as they do not experience cold-start delays, are _always on_ due to their global edge network architecture, and offer built-in caching capabilities, making them a preferable choice for this use case.