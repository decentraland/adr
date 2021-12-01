# Locking Collections in the builder

## Abstract

The builder allows users to create items which are composed of GLB or PNG files, and group them in Collections. There's a distinction here between Decentraland Collections and Third Party Collections, we'll point out the differences as they arise.
Managing items and collections is done off-chain until you decide to publish. This means that you can take items in and out of collections, modify their data, etc and it will be saved in our database. Once the publication occurs, some of the data (like the Decentraland's collection name for example) cannot change, and will be stored both in the blockchain and in our database

Publications vary for each type described above:

- Decentraland: You publish the entire collection with all it's items
- Third Party: You publish each item individually, but you can do it in batches

## Problem

Publishing is done by sending a transaction. This means that the user will craft a transaction and send it to our server where it will ultimately be sent to the corresponding Polygon network to be processed.
This process is usually pretty quick, but it can still take a while. It's a combination of a remote request to our server, and waiting for a transaction to be confirmed. The problem is therefore, that while we're waiting for the transaction to complete we should **lock** the collection/items that are being published, to avoid having missmatching data between the blockchain and our database.

### Solution

We propose a locking mechanism for both types of Collections and Items. We'll lock the collection/items for a day while the publication is still going. The lock is released after that if the publication ends successfully. The idea behind it is to lock the UI while the publish transaction is loading, preventing the user from making changes and the data to be in a missmatched state.

To do this we'll have to put two mechanisms in place, for both Decentraland and Third Party data:

- **Decentraland**: Once the user confirms the signature to send the publication, we'll send a POST to the server locking the collection (`/collections/COLLECTION_ID/lock`). This will set the current timestamp (`Date.now()`) on the `lock: timestamp` property of the Collection. This will be then checked in the server when returning each Decentraland Collection, adding a `isLocked: boolean` property to each object if the publication is still pending and a day has not gone by:

```ts
function isLocked(collection: Collection) {
  if (collection.isPublished) {
    return false;
  }

  const { lock } = collection;
  const deadline = new Date(lock);
  deadline.setDate(deadline.getDate() + 1);

  return deadline.getTime() > Date.now();
}
```

- **Third Party**: Third party collections work in a similar way but a key difference outlined before, we publish items not collections.
  After the user signs the transaction that will lock the items, we send a POST to the server (`/items/lock`) adding each item id to lock to the body of the request. This will set the current timestamp (`Date.now()`) on the `lock: timestamp` property of each Third party Item. When the server returns the data it will add an `isLocked: boolean` property to each item checking if the `lock` is smaller than the last item's `updated_at` date on the graph, which is the same as saying "last publication date", and if day has not gone by:

```ts
function isLocked(item: Collection, remoteItem: Item) {
  const { lock } = item
  const deadline = new Date(lock)
  deadline.setDate(deadline.getDate() + 1)

  return deadline.getTime() > Date.now()  || lock <= remoteItem.updated_at)
}
```

Anyone consuming this data can read this property and disable all components that allow changes that would create a desync, like changing the name of a Decentraland Collection for example.

## Implementation

- [Builder-server](https://github.com/decentraland/builder-server)
- [Builder](https://github.com/decentraland/builder)

## Participants

- @Nico

- @Lautaro

- @Nacho
