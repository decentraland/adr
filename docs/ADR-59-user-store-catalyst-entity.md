# User Store catalyst entity

## Statement of the problem

Users will be able to display on their own stores the following customizable elements:

- Banner image

- Description

- Website link

- Facebook link

- Twitter link

- Discord link

This way, users will be able to add a personalized feel to their stores and distinguish themselves from others.

The problem with this however, is that we need a way to store this data somewhere.

## Proposed solution

A `Store` entity stored in the catalyst to support this type of data while leveraging on the catalyst's decentralized storage properties.

## Schema

```ts
Store {
  id: string
  owner: string
  description: string
  links: {
    name: string
    url: string
  }[]
  images: {
    name: string
    file: string
  }[]
  version: number
}
```

`id`: The `urn` used as pointer to the entity, with the following structure: `urn:decentraland:off-chain:marketplace-stores:${address}`

`owner`: The address of the user that owns the store. Currently stores can only be uploaded by their owners, meaning that address A will not be able to upload a store for address B.

`description`: A description for the user store.

`links`: A list of different kind of links, initially, users can have links for `website`, `facebook`, `twitter` and `discord` but made it as a list to support many other links in the future. The `name` property acts as the identifier and the `url` property contains the actual link.

`images`: A list of data containing pointers to the different images stored in the catalysts to be used in the store. Currently users can have the store banner image but it is a list to support other kind of images in the future.

`version`: The current version of the store entity. In case the schema changes, the version can be used to handle the store differently depending on it.

## Fetching the entity

The Store entity can be fetched via:

```
GET https://peer-lb.decentraland.org/content/entities/store?pointer=urn:decentraland:off-chain:marketplace-stores:{address}
```

Where the address is the address of the owner of the store.

The payload of the response looks like:

```
[
  {
    "version": "v3",
    "id": "QmbRsYnc3RMcT1FqKxa54U1qqRsx3QEsQqG3DV4kDegn8W",
    "type": "store",
    "timestamp": 1643380808369,
    "pointers": [
      "urn:decentraland:off-chain:marketplace-stores:{address}"
    ],
    "content": [
      {
        "file": "cover/545051819691e9fde9f52cbb013a15ca423ba2d4_hq.gif",
        "hash": "QmPkf5CzpcLcBmAKyAME4Yt14hFYAa7ZSNCGkfMzDhQ9tL"
      }
    ],
    "metadata": {
      "id": "urn:decentraland:off-chain:marketplace-stores:{address}",
      "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce a pharetra ex. Mauris venenatis, odio sit amet malesuada iaculis, urna mi varius ipsum, ut sollicitudin est mauris ac odio.",
      "images": [
        {
          "name": "cover",
          "file": "cover/545051819691e9fde9f52cbb013a15ca423ba2d4_hq.gif"
        }
      ],
      "links": [
        { "name": "website", "url": "https://google.com" },
        { "name": "facebook", "url": "https://www.facebook.com/foo" },
        { "name": "twitter", "url": "https://www.twitter.com/bar" },
        { "name": "discord", "url": "https://discord.com/channels/baz" }
      ],
      "owner": {address},
      "version": 1
    }
  }
]
```

## Status

Stores can be currently deployed and consumed on all environments.

## Participants

- @guidota
- @cazala
- @fzavalia
