# Importing wearables

## Context and Problem Statement

In order to import an item into the Decentraland platform, more specifically, into the Builder, the user needs to upload a ZIP file containing its configuration in a file called `asset.json`. This JSON file has information with mixed responsibility. The [ADR-67](docs/ADR-67-wearables-configuration.md) sets up a new format to describe the properties that describe a wearable but, to be able to import it into the Builder, it needs specific information about the item in the platform. Besides the problem of the information having mixed responsibilities, the current `asset.json` format doesn't fullfil the requirements that the platform currently has, specially because there's no way to set a `collection` or a `URN` for the wearable.

## Proposed solution

To be able to provide a configuration file for our platform that doesn't mix the information between the wearable itself and what the platform needs, a new file, called `builder.json` MUST be included alongside the `wearable.json` file described in the [ADR-67](docs/ADR-67-wearables-configuration.md) document.

In this first version of the file, the following information will be included:

```typescript
type WearableAsset = {
  /** UUID of the item in the builder server */
  id?: string;
  /** UUID of the collection in the builder server */
  collectionId?: string;
  /** Complete URN of the wearable */
  urn?: string;
};
```

Where the `id` will be used to identify which item to update or which UUID to use when creating a new item, the `collectionId` will be used to identify the collection where the item will be created, and the `urn` will be used to set the URN of Third Party items or to identify a Third Party item to be updated. New properties can be added or the purpose of the ones mentioned in this ADR can be changed in the future according to the needs of the platform.

The following is an example of the `builder.json` file:

```json
{
  "id": "f12313b4-a76b-4c9e-a2a3-ab460f59bd67",
  "collectionId": "272233f5-e539-4202-b95c-aa68b0c8f190",
  "urn": "urn:decentraland:mumbai:collections-thirdparty:third-party-id:collection-id:1"
}
```

## Participants

- @lpetaccio
- @menduz
