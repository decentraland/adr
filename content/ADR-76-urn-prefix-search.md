---
adr: 76
date: 2022-04-04
title: Enable searching entities by URN Third Party Collections
status: Living
authors:
- agusaldasoro
- nachomazzara
- menduz
- pedrotambo
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

The Third Party Project requires the ability to display all items in a collection. The proposed solution addresses this requirement by providing a way to list all entities in Content Server that have pointers that belong to the Third Party Collection.

## Considered options

- Expose the filter in Lambdas Server
- Expose the filter in Content Server

The decision is to solve this at Content Server Level as the approach of the filter can be done directly at database level.

## Decision

The creation of a [new endpoint in the Content Server](https://github.com/decentraland/catalyst-api-specs/pull/21):

#### REQUEST

`GET /content/entities/active/collections/{collectionUrn}`

#### RESPONSE

```json
[
  {
    "entityId": "bafkreidtudd3elgkwojklsfr7w4rrrnswcsnwexpchy4raqnvfwiid52mm",
    "pointer": "urn:decentraland:matic:collections-thirdparty:woodies:0x134460d32fc66a6d84487c20dcd9fdcf92316017:0"
  },
  {
    "entityId": "bafkreiendurkhozosr2np6vswta745jjnbvym65oiow5yqss4eed2oanuy",
    "pointer": "urn:decentraland:matic:collections-thirdparty:woodies:0x134460d32fc66a6d84487c20dcd9fdcf92316017:1"
  }
]
```

That returns a list with all active `entityId`s whose urn are part of the `collectionUrn` given as a path param in the request.

The `collectionUrn` format must follow the one defined in [URN Repository](https://github.com/decentraland/urn-resolver#:~:text=supported%20on%20polygon-,decentraland%3A%7Bprotocol%7D%3Acollections%2Dthirdparty%3A%7BthirdPartyName%7D%3A%7BcollectionId%7D,-%3A%20Resolves%20the%20ethereum) which is: `decentraland:{protocol}:collections-thirdparty:{thirdPartyName}:{collectionId}:{itemId}`.

This filter can be used at thirdPartyName, collectionId or itemId level. All of them will work returning all wearables in the content server for the third party, all wearables in the given collection and the wearable with the item ID respectively.

No other format or filter will be allowed in this endpoint as that could lead to a performance degradation of the Content Server Database.

Issue: [@catalyst#878](https://github.com/decentraland/catalyst/issues/878)


### Content Server Technical Solution
Created a new table `active_pointers` to store the information of the active entities per pointer (instead of using the pointers field in the database). This new table has as a key the pointer and the other column is the entityId.
Modified the deployments of entities to update the row of the modified pointer to store the latest version. Also, removes the row of the table when a deleter deployment is done.

## Status

Done

## Consequences

### Don't accept wearables deployments with more than one pointer (URN)

Catalyst Issue: [@catalyst#884](https://github.com/decentraland/catalyst/issues/884)

To support the sync of Base and L1 wearables the check of resolving to the same URN was added, that's okay for those, but it's not accurate for L2 (Polygon) wearables. So, for new wearable deployments exactly one pointer is allowed.

As the filter for urn prefix matches exactly a string, and doesn't have any semantic logic to know if two urn prefixes solve to the same urn or not, as is not responsability of the urn prefix search, no new deployment should be done with more than one pointer.

PR: [@content-validator#42](https://github.com/decentraland/content-validator/pull/42)


### Delete old invalid scene deployments

In the context of the content server, pointers are unique. This means that it's impossible to have the same pointer (urn) for two entity types. Anyway, there wasn't a check for that which resulted in some scene and profile deployments sharing the pointer (`default1`, `default2`, `default3`, etc). 

In [this PR](https://github.com/decentraland/catalyst/pull/969), there is a migration that deletes from the database scene deployments that don't correspond to a valid Parcel the entity IDs are:
```
(  'Qma8DraR8JPfMfa9v9Eeh1fFkJpJ8iXYLTWPMg9xcRHW61',
  'QmWWtbpt632GkuUjX3yzdYB1FrNCYAU2fU2thFtEJPWi36',
  'QmfFpN49XtjmcsCFchqmjyXXNX4t3d8URE2i9QA9NuzULE',
  'QmTtjevvkarvaww3v7a9QXuSxkuc8YJyiX9VKW3Tmcg1qz',
  'QmSdgEPNT1CdEacagdTjqPgPGFnQXXVpgVmVeYQNC8JYDz',
  'QmS4m3BPZKAbdpuqCPy9ag1oeSvTXgL1CNNnjq7Gj8hAjb',
  'QmXe1AFCEeTdR4HispiiW9Dkx7QcSyFBVA4AyvJuVnVswV',
  'QmZWDaegoUhr4oMuB4Vd8FwPrAahjkqPB3RrtPJGmZCvMX',
  'QmfNVq56ucaCcgXg7fBLacrm9M6Td5rP7HkTt27SK2wGic',
  'QmbxtmCNzCtAwPt6sg9XGgkcuf4Ugoa7NYf1Bqb2FZxYnQ',
  'QmdxZnvwdrpN5T7k7qQDeKBoaSnckB8moMAgQJUtaXh8D3',
  'QmT6EVGKs4xGQWp3XXioZJCThf8ebFopdhRCpbGG7P3iz9',
  'QmPjVyfo4euciWPt4H6ABVVaFfmadb5fTQt92GfZBwFVH1',
  'QmasZ5WL4TvtRfoWB4CJ9BHo75G7uFh2bGTpphFi8WcHao',
  'QmYgsjNDKzoCLtmhGfWnoXHbKtpJ3hjsqSktKwSN14NGRt',
  'Qmex6oPwGLQTPuLERuMzx3uBsz3T6kieSV2foxVH3HRQ3N',
  'QmSrstKVzaYA4NFPCcRxwgnsmqbr7Z9D7qWiMmCZz8mCb8',
  'QmTN4VzJYnabWAafkgqScnvqeQ3VD3hj9W7jnxBN6e2gdJ',
  'QmecbenQT8VJHHg86pLvr6khHrEFaCwK6T2jMHFg85eLAR',
  'QmR9SXZHvUVTYLnRsnTyHaovRBq4cTtoudYapKtErhmaB3',
  'QmfBQHZUaGmcGtpy8bbq9gFK4iXdWdpikWt61VcgA25kW3',
  'QmZDsE3zwmhin3p4DP5niQDGHxXBXJ4YZsDehj8K751JHi',
  'QmbPu37FBPQVWWmKoCUZf11HrzDvuaKXYJ3dXeK8SzhvfZ',
  'QmXGmrqWiicDGxgJgonfzfpvegeACYxdqauc5NFykC9JRi',
  'QmX5HsazaYxox9NmCYHMKwRwMRiXDC7qWsrySXMid5gdTH',
  'Qmd2nKrPjSZB4FWsXEWSwkRJJ37iEEVr7NoGnqkdcacVNe',
  'QmVtZMLjqh5NarHno6dua9mbLWC6ZzFuTJLHvp1hXmYD39',
  'QmfVr3wwfqiKqVbA8yW4buMqD215kPRdQrAFhhoQ8RENtY',
  'QmUN62XUhMuZb5GeviCZ3v9H3H1ZE3cbYJASqH4Fdh1hSP',
  'QmRJhrvSRWYx2WD9yWcwNekCgRSaoSMfWcubDS4pSi1tJR',
  'Qmccax3RmwcBMyzUiAGDXLiNJ11BgJke2RZEBqTxjrNDfu',
  'QmQJJA5rVujKKqvYdCfxUJUUYJ1AckW2AQCEhM7ARUynME',
  'QmQnYCXDfwhRGzbSbBGZe74cbq9J6EqHGSicfDQQeDwSNk',
  'Qmf37Pxcb8eARo8g95ewmZfaWcRvTXSPoTfYsQ9cYfXVhD',
  'Qmcv1XgwxXJLdL446zJ47fLxejtZD4YBBRBn3xoc8y91nG',
  'QmRSZm14GtxRA2zTdRVVJfty636SWEGXtmnn1TvxXBKH5f',
  'QmfYK2ahm6G3vaddsQJx1u3hGJPPjAe2F2fQdhuCLM5xej',
  'Qmf1KgiErAcEEMAxCpGYjn2rm2aLcqCHrax2ex2HykWj3W',
  'QmfYt8cDcNHqrdLYSNPZCCeQF9sj2n9qPTxQhSY16Srow5',
  'QmSCR66NTA79DrjojcHf1sRHjHqH4RLWPK1jSrnxrYufqa')
```
