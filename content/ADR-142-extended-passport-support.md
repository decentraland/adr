---
adr: 142
date: 2022-11-25
title: Technical Assessment for the Extended Passport
authors:
  - manumena
status: Living
type: Standards Track
spdx-license: CC0-1.0
layout: adr
---

## Abstract

The Extended Passport view for Decentraland's Explorer requires storing and retrieving data from profiles to display NFT collectibles, blocking users, adding friends, and initiating chats. This document outlines the necessary requirements and performance considerations for the Catalyst, including the introduction of a user through the "description" field in profiles, the use of the "blocked" field to display blocked users, and the creation of new endpoints in lambdas for each type of item. The document also notes that the Explorer team should implement lazy loading and pagination to improve performance and scalability, as some users may have more than 1,000 NFTs. The document also provides details on the various endpoints that will be used to retrieve this data.

## Need

A New Passport view is being developed by the Explorer Team.

This view requires storing some information in the profile entity and retrieving other data (such as collectibles) to be displayed. It also allows blocking users, adding a user as a friend or initiating a chat.

## Requirements
The applicable requirements from the Catalyst point of view:

1. Intro of a user:
use the "description" field from profiles to use in the "Intro" section.

1. Block/Unblock users:
use the "blocked" field from profiles to see/report blocked users.

1. Equipped wearables:
take the information from the profile. There are the equipped wearables, emotes and DCL name.

1. Items: wearables/emotes/names/lands: new endpoints will be created in [lambdos](https://github.com/decentraland/lambdos) for each type of item.

1. Guest: passport for guest users will show only name and description, there is nothing to do for guests from the Catalyst end.

1. Social network links: this information is not currently available. It will be displayed in the profile under `socialLinks`.

## Performance
To load a passport, 5 requests to a Catalyst (lambdas) need to be made:

1. `lambdos/profiles`
1. `lambdos/nfts/wearables/:address`
1. `lambdos/nfts/emotes/:address`
1. `lambdos/nfts/lands/:address`
1. `lambdos/nfts/names/:address`

Once this information is obtained, to display wearables and emotes a few extra requests will be needed for each emote/wearable to download their image/thumbnail. This does not scale because some users have more than 1k NFTs. So the Explorer should implement a lazy loading mechanism (for image/thumbnail) as the user browses the collectibles.

All endpoints except `/profiles` are expensive requests. Internally, endpoints 2 to 5 make queries to TheGraph to check owned NFTs urns and then to the Content Server to get the definitions. Currently, endpoints 2 and 3 are not paginated, so making a query for a user that owns more than 1k wearables would be considerably heavy. Also, sometimes queries to TheGraph are slow. So to improve this situation the endpoints from 2 to 5 should be paginated.

### Pagination

The page number and size will be dynamic for every endpoint, received as query parameters. 

- `pageSize: number` (optional)
- `pageNum: number` (optional)

**Pagination will be optional**: if any of this parameters is not present, the response won't be paginated. 

### Wearables

The wearables are searched in 2 different collections: **ethereum** and **matic**. That involves doing 2 different queries to TheGraph.

To be able to return a paginated and sorted response, a full query is made for both, then that results are merged into a single one, then sorted and stored in a LRU cache where the key is the address. Paginated requests are resolved using the cached data.

For the rest of the paginated endpoints, queries to TheGraph are being paginated.

### Order

Items displayed in each endpoint's response will be ordered descending by the `transferredAt` field of the `NFT` entity (representing the date in which the NFT was received).

Wearables can also be ordered descending by the `rarity` field, adding `orderBy=rarity` to the query parameters.

## Endpoints details

- ` POST lambdos/profiles` receives
```
{
  ids: ["0x5e5d9d1dfd87e9b8b069b8e5d708db92be5ade99"]
}
```
returns
```
[
    {
        "timestamp": 1668115477142,
        "avatars": [
            {
                "hasClaimedName": false,
                "name": "cryptonico#e602",
                "description": "",
                "tutorialStep": 256,
                "userId": "0xa87d168717538e86d71ac48baccaeb84162de602",
                "email": "",
                "ethAddress": "0xa87d168717538e86d71ac48baccaeb84162de602",
                "version": 40,
                "socialLinks": ["https://github.com/username"]
                "avatar": {
                    "bodyShape": "urn:decentraland:off-chain:base-avatars:BaseMale",
                    "wearables": [
                        "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1",
                        "urn:decentraland:matic:collections-v2:0x74786778c018a683d45ad1bf61e94767dbefbbe7:1"
                    ],
                    "emotes": [
                        {
                            "slot": 0,
                            "urn": "handsair"
                        },
                        {
                            "slot": 1,
                            "urn": "urn:decentraland:matic:collections-v2:0xf9d6b233594b56fde782a247b4647a4a689f50fe:0"
                        },
                        {
                            "slot": 2,
                            "urn": "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7"
                        },
                        {
                            "slot": 3,
                            "urn": "dance"
                        },
                        {
                            "slot": 4,
                            "urn": "urn:decentraland:matic:collections-v2:0x875146d1d26e91c80f25f5966a84b098d3db1fc8:1"
                        },
                        {
                            "slot": 5,
                            "urn": "clap"
                        },
                        {
                            "slot": 6,
                            "urn": "money"
                        },
                        {
                            "slot": 7,
                            "urn": "kiss"
                        },
                        {
                            "slot": 8,
                            "urn": "headexplode"
                        },
                        {
                            "slot": 9,
                            "urn": "shrug"
                        }
                    ],
                    "snapshots": {
                        "body": "https://peer.decentraland.org/content/contents/bafkreidco3karzu2witrs6j5xav4cbq3cceytaa7qgyoz723v2a7n6tjv4",
                        "face256": "https://peer.decentraland.org/content/contents/bafkreib23wme2vvilbipx2nj7vfkcmpodibyqpzqsbqrbpwjox2w7jmqea"
                    },
                    "eyes": {
                        "color": {
                            "r": 0.37109375,
                            "g": 0.22265625,
                            "b": 0.1953125,
                            "a": 1
                        }
                    },
                    "hair": {
                        "color": {
                            "r": 0.234375,
                            "g": 0.12890625,
                            "b": 0.04296875,
                            "a": 1
                        }
                    },
                    "skin": {
                        "color": {
                            "r": 0.94921875,
                            "g": 0.76171875,
                            "b": 0.6484375,
                            "a": 1
                        }
                    }
                },
                "interests": [],
                "unclaimedName": "cryptonico",
                "hasConnectedWeb3": true,
                "muted": []
            }
        ]
    }
]
```
- `GET lambdos/nfts/wearables/{address}?page_size={size}&page_num={num}` returns
```
{
    wearables: [
        {
            "urn": "urn:decentraland:matic:collections-v2:0x08d131cfa304c3b47f9c57f95e6c4e5548d25bb4:0",
            "contractAddress": "0x4cd15dcd96362cf85e19039c3c2d661e5e43145e",
            "image": "https://peer-lb.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:0x08d131cfa304c3b47f9c57f95e6c4e5548d25bb4:0/thumbnail",
            "name": " Red Bottom Loafers + Gold Gun ",
            "description": "Red Bottom Loafers + Gold Gun by The Gold Guy ",
            "rarity": "mythic",
            "individualData": [
                {
                    "id": "0x08d131cfa304c3b47f9c57f95e6c4e5548d25bb4-6",
                    "tokenId": "2316870416708258107354196609040749511015692098812080447594841505820",
                    "transferredAt": "1643329940",
                    "price": "1000000000000000000000"
                },
                {
                    "id": "0x08d131cfa304c3b47f9c57f95e6c4e5548d25bb4-7",
                    "tokenId": "2316870416708258107354196609040749511015692098812080447594841505820",
                    "transferredAt": "1643329940",
                    "price": "2000000000000000000000"
                }
            ]
        }
    ],
    pageNum: 1,
    pageSize: 1,
    totalAmount: 1
}
```

- `GET lambdos/nfts/emotes/{address}?page_size={size}&page_num={num}` returns

```
{
    emotes: [
        {
            "urn": "urn:decentraland:matic:collections-v2:0x016a61feb6377239e34425b82e5c4b367e52457f:3",
            "id": "0x016a61feb6377239e34425b82e5c4b367e52457f-315936875005671560093754083051011296956685286201647333762932932609",
            "contractAddress": "0x4cd15dcd96362cf85e19039c3c2d661e5e43145e",
            "tokenId": "35",
            "image": "https://peer-lb.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:0x016a61feb6377239e34425b82e5c4b367e52457f:3/thumbnail",
            "createdAt": "1661362770",
            "name": "The Critic",
            "description": "Metaverse Art Week 2022 emote.",
            "rarity": "rare",
            "price": "0"
        }
    ],
    pageNum: 1,
    pageSize: 1
}
```

- `GET lambdos/nfts/lands/{address}?page_size={size}&page_num={num}` returns

```
{
    lands: [
       {
            "name": "First Estate Block",
            "contractAddress": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
            "tokenId": "3084",
            "category": "estate",
            "description": "The first estate to be ever created in the Metaverse",
            "price": "2000000000000000000000000",
            "image": "https://api.decentraland.org/v1/estates/1/map.png"
        },
        {
            "name": "HalfMoonLand",
            "contractAddress": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
            "tokenId": "207",
            "category": "parcel",
            "x": "-69",
            "y": "-21",
            "description": "",
            "price": "14512000000000000000000",
            "image": "https://api.decentraland.org/v1/parcels/-69/-21/map.png"
        }
    ],
    pageNum: 1,
    pageSize: 2
}
```

- `GET lambdos/nfts/names/{address}?page_size={size}&page_num={num}` returns

```
{
    names: [
       {
            "name": "DarthSith",
            "contractAddress": "0x2a187453064356c898cae034eaed119e1663acb8",
            "tokenId": "51902908726686475638568304069332550334313854479498974325587989671351389468210",
            "price": "62000000000000000000000"
        }
    ],
    pageNum: 1,
    pageSize: 1
}
```
