# Content Server - New Synchronization

## Context and Problem Statement

The Content Servers have to offer the ability to deploy content on them, but also ensure that any content deployed on any other valid and running Catalyst from the DAO is available there too. Resolving this is what we call “synchronization”. Due to the increase of users that Decentraland has experienced last year, the synchronization was the bottleneck to support more concurrent users, so we changed the way that it was done.

This document is not about how we could change the way that the catalyst communicate with each other or their topology, that topic will be discussed in abother document.

## Considered options

### Requirements
As a requirement we have the following rules:
- Deploying entities on any catalyst in the DAO should be transparent: this means that it doesn’t matter on which catalyst I’ve deployed my content, I should be able to reach it from any of all the Catalyst after a reasonable amount of time (5minutes for example).
- When a Catalyst receives a deployment from the original Catalyst, then the new one validates it all again. We do this as a mechanism to avoid deploying invalid entities if a Catalyst has been compromised.

### Old Sync
In the old synchronization, every catalyst asks for all the deployments from the other catalysts. This means that every catalyst exposes `/deployments` endpoint where you can get all the history of deployments. So if a Catalyst needs to sync with the others, it gets all of them and deploy them locally.

```
// Synchronization code
const allServers = await  getAllCatalystFromDao() // gets that info from the contract

while(true) {
  for (server of allServers) {
    // GET /deployments : first time will be all, then only diff
    allDeployments = await server.getNewDeployments()
    deployLocally(allDeployments)
    server.updateLastSeenTimestamp()
  }
}
```

This behaviour is correct as no info is missed and we can ensure that every new entity deployed will be discoverable. A characteristic from this solution is that not only current active entities will be synchronized but also all the history, this can be beneficial if you want to store all the historical data from Decentraland but could be a disadvantage if you don’t care or you need to use less space.

#### Stability issues
Using that way to synchronize we found out that when increasing the amount of users, this implied an increase of the amount of deployments (profiles mostly) and the servers weren’t responding well to that: the servers that need to retrieve the deployments experienced a huge amount of usage of CPU and also the queries to the DB to get all the deployments  and as all servers sync with each other that implied a maximum amount of users of 100/140 users per catalyst which was  below of what we expected and we needed.

#### Time to be up
When there were few deployments all of this worked fine, but when we reached 2M deployments and 50k deployments daily, the time spended retrieving all the history from the other servers and deploying that locally was always bigger than the new amount of deployments. So if you wanted to create a new Catalyst and sync it from scratch it could take you a month and you will never be synced.


## Decision

### New Sync
To build the new sync we put the focus on making the Catalyst work, so we left behind the concept of having all the historical deployments everywhere. This doesn’t mean that we lost that data, it is backed up in s3. But to implement the sync we only took into account the deployed entities that are active.

For the new sync we continue communicating all the catalysts between them, but in a more efficient way:
1. We decreased the amount of requests for bootstrapping from 400 to 1.
2. Deprecate the endpoint /deployments (which was the most expensive in the db)

```
// Synchronization code
const allServers = await  getAllCatalystFromDao() // gets that info from the contract

// Bootstrapping
for (server of allServers) {
  // GET /snapshots : get all entities that are active
  allDeployments = await server.getSnapshots() 
  deployLocally(allDeployments)
  server.updateLastSeenTimestamp() // the biggest timestamp seen in snapshots
}

while(true) {
  for (server of allServers) {
    // GET /pointer-changes : always only the new deployments
    allDeployments = await server.getNewDeployments() 
    deployLocally(allDeployments)
    server.updateLastSeenTimestamp() // the biggest timestamp seen in pointer-changes
  }
}
```

In pseudo code both implementations look similar, and they are. But the key here was to stop using `/deployments` endpoint and implement a new performant `/snapshots`.

Why is `/deployments` endpoint so expensive? It’s an endpoint with lots of filters and conditions. We've changed and created indexes in the database but all of the tests ended up with very expensive queries.

The snapshots are generated once a period of time (currently 15 min but it could be 6hs) with a full scan of the database which only filters that the overwritten_by field is null, this ensures that all active entities are retried. Then that data is stored in a file, so when requesting the `/snapshots` endpoint you receive the hash of the file with the information and no query to the database is done.

Then `/pointer-changes` retrieves all the deployments done in a period of time, this includes not active entities too. So, the only historical data that may be lost is the data transferred when a Catalyst was down. This endpoint is stored in a separate db and the requests are optimized.


## Status

Accepted

## Consequences

First of all, to synchronize a new Catalyst from scratch it now takes 6hours while we weren’t able to bootstrap a new Catalyst with the old sync.

Then, we found less CPU usage on the servers and that implied in increasing the max concurrent amount of users.

We are already working on:
- Removing pg-promise library
- Store all files in IPFS

And we identified that the size of the snapshots may increase a lot as more active entities will be active. Another idea that we’ve been discussing is that not all catalysts sync all the entity types.


## Participants

Date: 2021-12-20

- @agusaldasoro
- @menduz
- @pentreathm
- @jmoguilevsky
- @guidota
