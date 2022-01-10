# Content Server - New Synchronization

## Context and Problem Statement

The Content Servers have to offer the ability to deploy content on them, but also ensure that any content deployed on any other valid and running Catalyst from the DAO List is available there too. Resolving this is called “synchronization”. Due to the increase of users that Decentraland has experienced last year, the synchronization was the bottleneck to support more concurrent users, so the way that it was done had to be changed.

This document does not discuss ideas to change the way that the catalyst communicate with each other or their topology, that topic will be discussed in another document.

## Considered options

### Requirements
- Deploying entities on any catalyst in the DAO List should be transparent: this means that it doesn’t matter on which catalyst I’ve deployed my content, I should be able to reach it from any of all the Catalyst after a reasonable amount of time (5 minutes for example).
- When a Catalyst receives a deployment from the original Catalyst, then the new one validates it all again. The trust model becomes hardened this way, since catalysts just have to check the signature, instead of relying on the source of the deployment.

### Old Sync
In the old synchronization, every catalyst asks for all the deployments from the other catalysts on the DAO List. This means that every catalyst exposes a `/deployments` endpoint where you can get all the history of deployments. So if a Catalyst needs to sync with the others, it gets all of them and deploy them locally.

```
// Synchronization code
const allServers = await  getCatalystsFromDAOList() // fetch list of catalysts from the DAO contract

while(true) {
  for (server of allServers) {
    // GET /deployments : first time it'll get all deployments, afterwards only the diff
    allDeployments = await server.getNewDeployments()
    deployLocally(allDeployments)
    server.updateLastSeenTimestamp()
  }
}
```

This behaviour is correct as no info is missed and it can be ensured that every new entity deployed will be discoverable. A characteristic from this solution is that not only current active entities will be synchronized but also all the history, this can be beneficial if you want to store all the historical data from Decentraland but could be a disadvantage if you don’t care or you need to use less space.

#### Stability issues
Because most deployments are profiles, this isn't scaling linearly: retrieving past deployments leads to a spike of CPU usage and also the queries to the DB to get all the deployments. As all catalyst servers in the DAO List sync with each other (leading to `O(n²)` scalability), for the generally used hardware on catalysts we see a limit of 100/140 users per catalyst, way below what's needed.

When the amount of deployments reached 2M and 50k deployments daily, the time spended retrieving and applying all the history from the other servers in the DAO List was always bigger than the new amount of deployments. Syncing a new Catalyst from scratch could take a month or longer before catching up.

## Decision
### New Sync Logic
The main motivation on this new logic is on making the Catalyst network work on a bigger scale. Historical deployments are demoted to be of lower priority and will not be warranteed to succeed. The focus is on keeping all catalysts in the network up to date and serving the same state.

All the catalysts continue to communicate with each other, but in a more efficient way:
1. Decreased the amount of requests for bootstrapping from N to 1. Being `N = TOTAL_DEPLOYMENTS / PAGE_SIZE (paginated list) + TOTAL_DEPLOYMENTS * 1 (audit data)`
2. Deprecate the endpoint /deployments (which was the most expensive in the db).
3. Add missing information to /snapshot endpoints to include `authChain` to reduce by TOTAL_DEPLOYMENTS the amount of requests.

```
// Synchronization code
const allServers = await  getCatalystsFromDAOList() // fetch list of catalysts from the DAO contract


async function sync(remoteServer) {
  // Bootstrapping
  
  // GET /snapshots : get all entities that are active
  allDeployments = await remoteServer.getSnapshots() 
  deployLocally(allDeployments)
  remoteServer.updateLastSeenTimestamp() // most recent timestamp seen in snapshots

  // Syncing
  while(remoteServer.isOnline()) {
    // GET /pointer-changes : only the new deployments
    allDeployments = await remoteServer.getNewDeployments() 
    await deployLocally(allDeployments)
    remoteServer.updateLastSeenTimestamp() // most recent timestamp seen in pointer-changes
  }
}

for (server of allServers) {
  // concurrently
  sync(server)
}
```

In pseudo code both implementations look similar. The key difference is to stop using the `/deployments` endpoint and implement a new performant `/snapshots`.

The `/deployments` endpoint caused a very expensive query to the DB, depending on too many filters and conditions. Indexes were created and changed in the database, but it still caused very expensive queries.

The new snapshots are generated with a certain frequency (currently set to 15 min, but anything up to 6hs sounds reasonable) with a full scan of the database which only filters that the `overwritten_by` field is `null`. This ensures that all active entities are retried. Then that data is stored in a file, so when requesting the `/snapshots` endpoint you receive the hash of the file with the information and no query to the database is done.

Then `/pointer-changes` retrieves all the deployments done in a period of time, this includes not-active entities too (those who have been overriden by a new deployment). So, the only historical data that may be lost is the data transferred when a Catalyst was down. This endpoint is stored in a separate db and the requests are optimized.

A future enhancement to the synchronization contemplates the addition of an endpoint similar to `/pointer-changes` that only includes the freshest pointers, ignoring the history in between. For a lighter use of the table and indexes holding the active entities.


## Status

Accepted

## Consequences

First of all, to synchronize a new Catalyst from scratch it now takes 6hours while it wasn't possible to bootstrap a new Catalyst with the old sync. Community members gave up after a month of "Bootstrapping" state.

Then, CPU usage was reduced on the servers and that implied in increasing the max concurrent amount of users and profile deployments.

A freshly identified issue with the new design is that the size of the snapshots' size may increase a lot as more active entities will be active. A possible mitigation or optimization could be that not all catalysts sync all the entity types, making specialized catalysts for either scenes+wearables and others for profiles.


## Participants

Date: 2021-12-20

- @agusaldasoro
- @menduz
- @pentreathm
- @jmoguilevsky
- @guidota
