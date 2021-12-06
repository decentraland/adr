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

- **Decentraland**: Once the user confirms the signature to send the publication, we'll send a POST to the server locking the collection (`/collections/COLLECTION_ID/lock`). This will set the current timestamp (`Date.now()`) on the `lock: timestamp` property of the Collection. This will be then checked in the server when returning each Decentraland Collection, adding a `isLocked: boolean` property to each object if the publication is still pending and a day has not gone by.

- **Third Party**: For Third party collections we publish items not collections.
  After the user signs the transaction that will lock the items, we send a POST to the server (`/items/lock`) with each item id to lock in the body of the request. This will set the current timestamp (`Date.now()`) on the `lock: timestamp` property of each Third party Item and set the same property for the collection that holds them. When the server returns the data it will add an `isLocked: boolean` property using the same logic we use for Decentraland data, the difference will be on how isPublished is filled for collections. Because Collections do not exist as an Entity on the third party graph, we need to check if any item has the `urn_suffix` set as a `searchCollectionId`.

An example of how we can implement the method is:

```ts
function isLocked(element: Collection | Item) {
  if (element.isPublished) {
    return false;
  }

  const { lock } = element;
  const deadline = new Date(lock);
  deadline.setDate(deadline.getDate() + 1);

  return deadline.getTime() > Date.now();
}
```

### What's being locked

As we said before, the locking mechanism is in place so we can avoid desynching the database with the blockchain. Anyone consuming this data can read this property and disable all components that change data that's being commited to the Blockchain.

- **Decentraland**: Once the collection is published, every property that changes the address should not be updated. These are:

  - The name
  - Adding or removing items
  - Changing items data:
    - rarity
    - price
    - beneficiary
    - metadata
      - type
      - name
      - description
      - data (the BodyShape and Category)

- **Third Party**: Once the items are published, the URN cannot change anymore. That means that item `token_id`s and virtual collection `urn_suffix`es. For reference, and URN looks like this: `urn:decentraland:{network}:collections-thirdparty:{third-party-name}:{collection-id}:{item-id}` where
  - network: the network the item is in, `mumbai`, `matic`, etc
  - third-party-name: the name of the third party record the item belongs to, like `crypto-motors`
  - collection-id: the virtual collection's `urn_suffix`, used as part of the full URN and locked after the first item is published as it will be used for all subsequent items
  - item-id: the item's `token_id`, editable up until publication

## Implementation

- [Builder-server](https://github.com/decentraland/builder-server)
- [Builder](https://github.com/decentraland/builder)

## Participants

- @Nico

- @Lautaro

- @Nacho
