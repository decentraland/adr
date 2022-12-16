---
adr: 142
date: 2022-11-25
title: Technical Assessment for the Extended Passport
authors:
  - manumena
status: Draft
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-1
---

## Need

A New Passport view is being developed by the Explorer Team.

This view requires storing some information in the profile entity and retrieving other data (such as collectibles) to be displayed. It also allows blocking users, adding a user as a friend or initiating a chat.

## Requirements
The applicable requirements from the Catalyst point of view:

1. Intro of a user:
Use the "description" field from profiles to use in the "Intro" section.

1. Block/Unblock users:
Use the "blocked" field from profiles to see/report blocked users.

1. Equipped wearables:
Take the information from the profile. There are the equipped wearables, emotes and the current name.

1. Items: wearables/emotes/names/lands: New endpoints will be created in [lambdos](https://github.com/decentraland/lambdos) for every type of item.

1. Guest: Passport for guest users will show only name and description, there is nothing to do for guests from the Catalyst end.

2. Social network links: This information is not currently available. It will be displayed in the profile under `socialLinks`.

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

- `pageSize: number`
- `pageNum: number`

**Pagination will be optional**: if any of this parameters is not present, the response won't be paginated. 

Items displayed in each page will be ordered descending by the `transferredAt` field of the `NFT` entity (representing the date in which the NFT was received, currently in development: https://github.com/decentraland/marketplace/issues/1092), tie-breaking by `id`.

### Wearables

The wearables are searched in 2 different collections: **ethereum** and **matic**. That involves doing 2 different queries to TheGraph.

To be able to return a paginated and ordered response, both queries are made (both for `pageSize` items), the results are merged, sorted, and `pageSize` items are returned.

When the next page is requested, the method needs a way to know how many wearables from each collection need to be skipped. One solution could be storing those wearables ids in memory for each different passport that is being requested, which is unfeasable.

The final solution is to return a token in the response which the client will provide in the next request. It will contain the last `transferredAt` returned and also the last `urn` (to catch a corner case when all the wearables have the same `transferredAt` date).

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
            "urn": "urn:decentraland:ethereum:collections-v1:exclusive_masks:asian_fox",
            "amount": 1
        },
        {
            "urn": "urn:decentraland:matic:collections-v2:0x127f8dc3d7dd91c66dc96958df1f0edb14511f84:0",
            "amount": 1
        }
    ],
    pageNum: 1,
    pageSize: 2
}
```

- `GET lambdos/nfts/emotes/{address}?page_size={size}&page_num={num}` returns

```
{
    emotes: [
        {
            "urn": "urn:decentraland:matic:collections-v2:0x875146d1d26e91c80f25f5966a84b098d3db1fc8:1",
            "amount": 1
        },
        {
            "urn": "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7",
            "amount": 1
        }
    ],
    pageNum: 1,
    pageSize: 2
}
```

- `GET lambdos/nfts/lands/{address}?page_size={size}&page_num={num}` returns

```
{
    lands: [
        (66,66),
        (66,67)
    ],
    pageNum: 1,
    pageSize: 2
}
```

- `GET lambdos/nfts/names/{address}?page_size={size}&page_num={num}` returns

```
{
    names: [
        "name1",
        "name2"
    ],
    pageNum: 1,
    pageSize: 2
}
```
