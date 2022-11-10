---
layout: doc
rfc: 16
date: 2022-09-02
title: Content-Server Fast Bootstrapping
authors:
- pedrotambo
status: ACCEPTED
---

# Abstract
Every time a Catalyst is restarted, the content server processes a snapshot containing all the active entities ƒor each server. It reads all the entities in these snapshots and deploys the ones that it does not already have locally. This process takes up to ~half an hour. This document discusses and proposes solutions to improve this situation.

# Need
Every time a Catalyst is started a Catalyst takes up to half an hour to be ready. It's a necessary process to be synchronized with the rest of the catalysts. But this brings many complexities:
1. The catalyst being restarted has a downtime of ~30 min.
2. The network consumption is high. The rest of the catalysts have to serve the snapshot files that are really big (~1GB).
3. Most of the entities are re-processed each restart. They were already processed in previous restarts.

With this work, we estimate to delete or reduce as much as possible the job of re-processing entities that were already processed. We estimate to reduce the bootstrapping time to less than 5 minutes.

# Technical details
Every 6 hours a Catalyst runs a job that re-creates a snapshot file that contains all its active entity hashes and also the timestamp of the latest entity included. When a Catalyst starts, it asks each of the rest of the nodes for this snapshot file and processes all of them. A snapshot is at most ~6 hs outdated. Then using the timestamp of the last entity included in it, asks for the "newest" active entities using an expensive endpoint /pointer-changes. Before the snapshots mechanism, the /pointer-changes was used to synchronize the whole catalyst and there were performance issues. It is a huge improvement for starting a catalyst from scratch and it works relatively fine for a synchronization not from scratch (i.e. normal restart).
But we want to continue improving that by solving the problem where for each restart it needs to process the whole snapshot in order to be up to date **even though the downtime is very little**.

![old_snapshot](resources/RFC-16/old_snapshot.png)

# Approach
Leverage the snapshots mechanism by partitioning the snapshots by time range. The snapshot structure and how it is processed will remain the same.  A catalyst will serve the content of all its active entities in multiple snapshots separated by its local deploy timestamp. Any time a snapshot is processed, a Catalyst remembers this and won't process it again anymore.

### Snapshot generation
Instead of generating a complete snapshot every 6 hs, it will generate snapshots as time goes by only for the newest entities. Let's say the snapshot units are daily, weekly, monthly and yearly. It will create daily snapshots until a week has passed, then it will replace the 7 daily snapshots with the weekly one and continue generating daily snapshots again. The same logic goes for weekly, monthly and yearly snapshots. 

![multiple_snapshots](resources/RFC-16/multiple_snapshots.png)

### Snapshot process at bootstrap
A Catalyst asks another for its snapshots, then it will process the same way it's done now, but will save in the database its hash. Next time a Catalyst sees this hash, it won't process it again.

This way we avoid reprocessing snapshots but two complexities arise:
1. When replacing a set of snapshots by another bigger one, the hash of the bigger one is not known by a Catalyst that already processed the smaller replaced ones.
2. When a snapshot gets too old, it could contain many entities that were active in the snapshot generation time but no longer are. To solve this, from time to time a new snapshot generation for the same time range can be re-generated. It would contain a subset of the active entities in the previous snapshot.

To address this situation, it is proposed that the Catalyst serving the active entities, provides:
a. The hash of the snapshot
b. A list of hashes that it replaces.
Now a Catalyst processing the snapshots would process the snapshot only if it hasn't processed its hash or one hash of the list of replaced ones.

![snapshot_replacement](resources/RFC-16/snapshot_replacement.png)

The returned objects from the endpoint /snapshots will change to:
```
const snapshots: SnapshotMetadata[] = fetch(/snapshots)

export type SnapshotMetadata = {
  hash: string
  timeRange: {
      initTimestamp: number
      endTimestamp:number
  }
  numberOfEntities: number
  replacedSnapshotHashes?: string[]
}
```
	
# Benefit
There will be important performance improvements in the Catalyst bootstrap when a synced Catalyst is restarted:
1. Reduce the catalyst downtime from ~30 min to less than 5 min.
2. Reduce the network traffic of 1 GB per node to something way smaller.
3. Process an active entity only one time.

In addition, there will be performance improvements in the snapshots generation as it won't be necessary to regenerate the snapshot covering the whole timeline. It will be only needed for a short period of time.

# Competition (alternatives)
- Do the same but separated by entity type.
- Apply this mechanism only to profiles. The rest of the entities continue as full snapshots.

# Key Dependencies and Open Questions

- How will the transition be where multiple Catalysts have a different behavior in /snapshots?
