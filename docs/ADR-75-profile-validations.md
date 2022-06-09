# Profile validations

## Context and Problem Statement

During deployment of a profile content server currently runs a lot of validations on the profile. However, there
are a few more validations that are important to implement:
* if the profile contains wearables
  * all wearables should be a valid urn.
  * all wearables that are nfts should be owned by the address deploying the profile.
* if the profile contains names that are nfts, they should be owned by the address deploying the profile.

These validations should hold not only for organic deployments but also when synchronizing state from other catalysts.

> Because these validations are introduced at this stage, deployments prior to this ADR will not be validated as they may
not be compliant. 

Regardless of what happened at the time of deployment, later on, when the profile is retrieved, it is done using lambas 
profiles endpoints. Lambda endpoints take care of removing any names or wearables that might have
been owned by the profile at the time of deployment but are no longer owned. This currently allows a user to deploy a profile
containing stuff they don't own, but as soon as they fetch their profile they get a sanitized profile with only what the user owns.
This is precisely the situation we want to avoid with these new validations.

### Valid URN
Each wearable listed in the avatar has to be:
* either a constant whitelisted in the validator. This is to support emotes coming from initial implementation. The allowed values are:
  * clap
  * dab
  * dance
  * disco
  * dontsee
  * fistpump
  * hammer
  * handsair
  * hohoho
  * kiss
  * money
  * raiseHand
  * robot
  * shrug
  * snowfall
  * tektonik
  * tikxx
  * wave
* or it is correctly parsed by `parseUrn` function from [@dcl/urn-resolver](https://github.com/decentraland/urn-resolver).

### Wearable Ownership
Each wearable listed in the avatar has to be owned by the address deploying the profile.

For this validation, a check is made using TheGraph against the collection graphs both in 
[Ethereum (L1)](https://thegraph.com/hosted-service/subgraph/decentraland/collections-ethereum-mainnet) 
and [Polygon (L2)](https://thegraph.com/hosted-service/subgraph/decentraland/collections-matic-mainnet) 
network.


### Names Ownership
Each name listed in the avatar has to be owned by the address deploying the profile.

For this validation, a check is made using TheGraph against the marketplace graph in 
[Ethereum (L1)](https://thegraph.com/hosted-service/subgraph/decentraland/marketplace) 
network.



## Considered options

### Use the exact same checks lambdas is doing when retrieving the profiles
This is perfect for organic deployments. But the problem is that it uses the 
"current" state of ownership, not the one at the time of deployment, so this
would fail the validations for the deployment during synchronization.

### Use the entity timestamp to validate ownership at the time of the deployment
These validations are a tad more complex as they involve figuring out the height
of the network at the time of the timestamp of the deployment, and then running
the ownership validation on the given block.

For determining the network height the following graphs are used:
* For [Ethereum](https://thegraph.com/hosted-service/subgraph/decentraland/blocks-ethereum-mainnet) (L1). 
* For [Polygon](https://thegraph.com/hosted-service/subgraph/decentraland/blocks-matic-mainnet) (L2).

Once the block is determined a check is made using either the marketplace (for names) or the collections 
(for wearables) graphs but specifying the query to be run on that particular block. Actually, the check
is done twice for given block and for a block 5 minutes in the past. This way if changes in ownership occur
during that window of time, the validation will succeed anyway.

### Reuse new validations in lambda
Another option considered was the possibility of re-using the new validation code in the lambdas
(replacing existing lambdas code) that filters non-owned items, so that there is no code duplication 
with the same logic in two repos.

As mentioned above, the lambdas are running similar checks but always against the latest block
of the blockchains. In order to reuse the new code a block needs to be specified, so a new
request would be needed to figure out the current height of the blockchain. And in the case of
wearables, as the ownership query is done against 2 different blockchains (Ethereum and Polygon)
then the height of each needs to be determined, not just one.

The following table compares the complexity of the new time-based validations compared to
current implementation in lambdas, and the number of requests that in each case.

<table>
  <tr>
    <th></th>
    <th>Current approach</th>
    <th>New approach</th>
  </tr>
  <tr>
    <td>Name ownership</td>
    <td>
      1 request to L1 marketplace graph with n queries (1 for each profile) <br/><br/>
      Total requests: 1 <br/>
      Total queries: n <br/>
    </td>
    <td>
      1 request to L1 block graph to figure out current block<br/>
      2 requests to L1 marketplace graph: 1 for current block, 1 for block 5 minutes ago.<br/>
      Each request contains n queries (1 for each profile).<br/><br/>
      Total requests: 1 + 2 = 3 <br/>
      Total queries: 1 + 2*n = 2n+1 <br/>
    </td>
  </tr>
  <tr>
    <td>Wearables ownership</td>
    <td>
      1 request to L1 and 1 request to L2 collections graphs, each with n queries (1 for each profile).<br/><br/>
      Total requests: 2<br/>
      Total queries: 2*n = 2n<br/>
    </td>
    <td>
      1 request to L1 block graph to figure out current block (can probably reuse from names, but needs extra coding)<br/>
      1 request to L2 block graph to figure out current block<br/>
      1 requests to collection graph for each network for each block. So it is 4 requests with n queries each.<br/> 
      Total requests: 2+2*2=6<br/>
      Total queries: 2+4*n = 4n+2<br/>
    </td>
  </tr>
</table>

> Depending on the number of profiles to be retrieved, pagination can potentially generate more requests according
to the number of pages needed to fetch all the profiles.

As seen in the table, the number of requests/queries grows so much that it doesn't seem like a good
solution for several reasons:
* More requests -> more time before lambdas can respond and users are waiting.
* More requests -> more money (if DCL needs to start paying for them, which seems it will be the case soon).


## Decision

We will use the entity timestamp to validate ownership at the time of the deployment for
both organic deployments and synchronization.

We will keep lambdas profile cleansing code as is.

## Deadline

    ADR45_DEADLINE: 2022-06-20T00:00:00Z
    Unix Timestamp: 1655683200000

## Status

Proposed

## Consequences

Deployments after this ADR is effective will no longer be allowed when deploying either
invalid urns or use nft names or wearables that are not owned by the address deploying the 
profile.

All deployments prior to this ADR being effective will not be validated as they might
not be compliant.

## Participants

- @marianogoldman
