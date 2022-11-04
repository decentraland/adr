---
layout: doc
adr: 86
date: 2022-11-03
title: Realm Picking Algorithm
status: ACCEPTED
authors:
  - pablitar
  - agusaldasoro
---


## Abstract

This ADR documents the current implementation for Realm Picking in Kernel.

## Need
When an user starts the client and no realm is specified, then there are multiple criterias to pick realms, and there is no clear agreement on which of these criterias is more important.

## Approach

There are different variables to take into consideration:
- **Latency**: Different realms will have different latency. The user should prioritize those with lower latency, and if using P2P connections that will group people that have low latency to each other too.
- **Amount of users**: In order for people to have a fun and social experience, they should be directed to those realms that have the most amount of people.
- **Load balancing**: When there is a high load of users, or all other criteria being equal, the users should be distributed to different catalysts servers in order to balance the load.

This is quite straightforward. The main issue is that those variables sometimes run against each other. For instance, what if the catalyst with the lowest latency is empty and there is a catalyst with a little more latency that has users? Or what happens if the catalyst that has the lowest latency is overloaded?

A simple solution would be to define a priority of these variables. But which is more important? The answer most of the time is it depends. For instance, if latency is too much (let's say, >3 seconds), it’d be the most important variable. But if you have two catalysts, one with 20 ms of latency and the other with 30 ms latency, maybe you can consider them equal and the amount of users would become the most important factor.
Let’s say that there’s an event, and there are 3 catalysts that have at least 1000 people. In that case, given their latency can be considered equal, balancing the load would probably be the most important factor.

## The Algorithm
Taking into consideration the cases variables and cases listed above is how the algorithm works. Something that will try to “intelligently” decide which is the best realm, given all the conditions.

1. It considers the latency difference as the most important factor. If the difference is greater than a hard limit (for instance, 1.5 seconds), always prefer the catalyst with the lowest latency. If the latency difference is less than this hard limit, consider the next criteria.
2. It gives an score to a realm based on the amount of users it has. The greater the number of users, the better.
3. Then, it deduces some score based on the latency, exponentially. For instance, consider 100 ms of latency equivalent to 1 user. 200 ms equivalent to 5 users. 500 ms equivalent to 30 users. 1000 ms equivalent to 200 users, etc. This is to account for the effect the latency may have on user experience (latencies lower than 500 ms may not be noticed by most people, given our current experiences).
4. If the number of users pass a certain threshold (for instance, 1000 users), give a maximum score so the next criteria can be considered.
5. Of those catalysts that have the same score, and latency that can be considered “acceptable”, pick the one with the least amount of users, to balance the load.

This algorithm considers the three variables listed above balancing between them in most of the cases.

The algorithm has some configurable parameters, in order to be able to tune it without deploying, and even making hot changes.

There are a couple of requirements that are nice to have for the algorithm, namely:
- Making it so it is easy to add/remove/tune the different rules considered
- Adding the possibility of changing parameters of the algorithm in runtime

### Chain of Responsibility
This algorithm is implemented as a [Chain of Responsibility](https://sourcemaking.com/design_patterns/chain_of_responsibility).

This means that it encapsulates the processing elements inside a "pipeline" abstraction; and have clients "launch and leave" their requests at the entrance to the pipeline. The pattern chains the receiving objects together, and then passes any request messages from object to object until it reaches an object capable of handling the message. The number and type of handler objects isn't known a priori, they can be configured dynamically. The chaining mechanism uses recursive composition to allow an unlimited number of handlers to be linked.

The request for the chain will be picking a realm from a list of candidates. Each “rule” of the algorithm can be a link of the chain. Rules are prioritized. If a rule can make a decision, then it does. If not, it delegates in the following rules.

Rules can share a context. This context could be used to avoid recalculating values if rules can reuse them. Rules have a name, which is used to log and report analytics on which rule was used to make a decision. 
The rules can be enabled or disabled through runtime configuration. Rules have parameters to tune their configuration.

Extending the algorithm should be as simple as adding a new rule and selecting the appropriate priority for it. In the same vein, changing or tuning an existing rule should be quite independent from other rules.
Rules may be composed in the future, effectively turning the chain into a kind of decision tree.

### Links

#### Load Balancing

_Description_:


_Configuration_:
```typescript
export type LoadBalancingConfig = {
  type: AlgorithmLinkTypes.LOAD_BALANCING
}
```

#### Large Latency

_Description_:
Calculates the latency to all peer candidates, then filters out the ones with a latency greater than the threshold. If only one meets the condition, then it's returned. If not, then it delegates the decision to the next link from the filtered peers.

_Pseudo Code_:
```typescript
export function largeLatencyLink() {

  const sorted // all peers sorted by latency
  const minElapsed = sorted[0]

  picked = sorted.filter((it) => it.elapsed - minElapsed < largeLatencyThreshold)

  if (picked.length === 1) {
    context.selected = context.picked[0] // return a candidate only if one meets the threshold
  }

  return picked // delegate to next link only the filtered peers
}
```

_Configuration_:
```typescript
export type LargeLatencyConfig = {
  type: AlgorithmLinkTypes.LARGE_LATENCY
  config?: { largeLatencyThreshold: number }
}
```

#### All Peers Score

_Description_:
Assigns to all peers a scored based on their amount of total users. Then calculates the estimation of the size of the peer if assigning current user to it, and returns the score deduced by latency, equivalent to users. This responds to the following formula: `m * (e ^ (x / d) - 1)`.

_Pseudo Code_:
```typescript
export function allPeersScoreLink() {
  const score = peers.forEach(peer => calculateAllPeersScore(peer))
  return selectFirstByScore(context, score, definitiveDecisionThreshold)
}

function linearUsersScore(usersCount: number) {
  return baseScore + usersCount
}

export function calculateAllPeersScore(peer) {
  
  if (peer.usersCount === 0) return 0 // Prefer realms that have users. Those will have at least baseScore
 
  if (maxUsers) {
    // Try to fill all realms until around the percentage provided
    if (peer.usersCount >= fillTargetPercentage * max) { 
      // If this is the case, then it's "downward" phase of the score
      // Calculate a segment joining the fillTargetPercentage% of users with baseScore at discourageFillTargetPercentage% maxUsers
      // In that way, when reach discourageFillTargetPercentage% maxUsers, realms that have at least one user start to get prioritized
      const segment = {
        start: { x: fillTargetPercentage * max, y: linearUsersScore(fillTargetPercentage * max) },
        end: { x: discourageFillTargetPercentage * max, y: baseScore }
      }

      const slope = (segment.end.y - segment.start.y) / (segment.end.x - segment.start.x)

      // The score is the result of calculating the corresponding point of this segment at usersCount
      return segment.start.y + slope * (count - segment.start.x)
    }
  }

  return linearUsersScore(peer.usersCount)
}
```

_Configuration_:
```typescript
export type AllPeersScoreConfig = {
  type: AlgorithmLinkTypes.ALL_PEERS_SCORE
  config?: {
    baseScore?: number // Base score for any realm that has at least 1 user. Default: 40
    fillTargetPercentage?: number // If the realm has maxUsers, the score will rise only until the target percentage of fullness represented by this value is reached
    discourageFillTargetPercentage?: number // If the realm has maxUsers, the score will become baseScore when this percentage is reached
    definitiveDecisionThreshold?: number // If the score difference between two candidates is greater than this value, this link makes a definitive decision. Otherwise, it is delegated to the next link
    latencyDeductionsParameters?: LatencyDeductionsParameters
  }
}
```

#### Close Peers

_Description_:
Calculates the score acording the amount of users near the current parcel.

_Pseudo Code_:

```typescript
export function closePeersScoreLink(){
  const score = peers.forEach(peer => closeUsersScore(peer))
  return selectFirstByScore(context, score, definitiveDecisionThreshold)
}

export function closeUsersScore(peer) {
  const parcels = usersParcels(peer)
  if (parcels && parcels.length > 0) {
    return baseScore + countParcelsCloseTo(currentParcel, parcels, closePeersDistance)
  } else return 0
}
```

_Configuration_:
```typescript
export type ClosePeersScoreConfig = {
  type: AlgorithmLinkTypes.CLOSE_PEERS_SCORE
  config?: {
    closePeersDistance?: number // Distance in parcels to which a peer is considered close, so it can count for the score.
    baseScore?: number
    definitiveDecisionThreshold?: number // If the score difference between two candidates is greater than this value, the link makes a definitive decision. Otherwise, it delegates to the next link
    latencyDeductionsParameters?: LatencyDeductionsConfig
  }
}
```

#### Common Configurations
```typescript
export type LatencyDeductionsConfig = Partial<LatencyDeductionsParameters>
/**
 * Score deduced by latency, equivalent to users. This responds to the following formula: m * (e ^ (x / d) - 1)
 * Where m is the multiplier, e is Euler's number, x is the latency and d is the exponencialDivisor.
 * See here for a visualization of the formula: https://www.desmos.com/calculator/zflj2ik6pl
 * By default, these values are 60 for the multiplier, and 700 for the divisor, resulting, for example, in the following values:
 *
 * | latency | deduction |
 * | ------- | --------- |
 * | 500     | 62        |
 * | 750     | 115       |
 * | 1000    | 190       |
 * | 1250    | 300       |
 * | 1500    | 451       |
 * | 1750    | 670       |
 * | 2000    | 984       |
 *
 * If a maxDeduction is provided, then no more than that number of users will be deduced from the score.
 */
export type LatencyDeductionsParameters = {
  multiplier: number
  exponentialDivisor: number
  maxDeduction: number
}
```

### Feature Flag

To Configure which algorithms to use, then a feature flag `explorer-pick_realm_algorithm_config` is used. Currently it has two configurations:

1. Default config
```json
[ 
   {
      "type": "ALL_PEERS_SCORE"
   },
  {
      "type": "CLOSE_PEERS_SCORE"
   }
]
```

2. Prioritize Load Balancing
```json
[
   {
      "type": "LARGE_LATENCY"
   },
   {
      "type": "LOAD_BALANCING"
   },
   {
      "type": "CLOSE_PEERS_SCORE"
   },
   {
      "type": "ALL_PEERS_SCORE"
   }
]
```

### Pseudo Code

```typescript
pickCandidate(candidates: Candidate[], userParcel: Parcel) { // candidates = all DAO Peers
  if (candidates.length === 0) throw new Error('Cannot pick candidates from an empty list')

  for (const link of chain) { // Default: chain = ["ALL_PEERS_SCORE", "CLOSE_PEERS_SCORE"]

    context = link.pick(context) // Execute the current Link
    
    if (context.selected) return context.selected // If a link picks a particular candidate, it is returned
  }

  return candidates[0] // If all the links have gone through, and there is not a clear candidate, then pick the first
}

```

## Benefit
The main benefit is having an algorithm that can be tuned. In the long run, it could take advantage of the resources available to enable a nice user experience for those users who don’t pick a particular realm.

## Competition (alternatives)

Another option is also to leave the choice of the realm to the user, making them pick a realm from a list of options or suggestions when they haven’t selected one.


## Status

Accepted
