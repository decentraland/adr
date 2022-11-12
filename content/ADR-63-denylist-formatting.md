---
adr: 63
date: 2022-03-16
title: Denylist format
status: Living
authors:
  - agusaldasoro
  - jmoguilevsky
  - menduz
type: Standards Track
spdx-license: CC0-1.0
---

## Context and Problem Statement

In the context of making sure that platform services don't serve unwanted content (i.e. copyright, illegal, etc.) a good solution is to implement a denylist of entities, content and addresses. Moreover, taking into account this [proposal](https://governance.decentraland.org/proposal/?id=f68cd110-3e8c-11ec-be0c-afec86cba5e5) from the DAO, there should be a mechanism for the community to have lists of denylisted items in world.

## Proposed solution

The proposed solution for having a denylist is to have a single with the list of denylisted items. The format of that files consists of having one line per denylisted item. If a line starts with a hashtag consider it a comment.
i.e.

```
...
QmQwJMfhJFeb3LL4NFHXe2Kwam4gUGaCRo9u2sJcRvufWS (entity id)
QmSQm39orj9dpDnK9PheVQX8wWqUB1PSfZaKzfD4X1FfhS (entity id)
QmV6cDFsTmSUFhiZMFNuoiMW9iX5fg9ww1mveGDJrs9evB (entity id)
# a comment
0x89890aF02328Ab6Af9d3D8F0d27A97bb7E10E566 (address)
0xFFDF0bE2aF26B12A4Cb3B7a62a55CeB244C87520 (address)
...
```

### Catalyst Denylist implementation

If catalysts implement the denylist will impact the following way in the catalysts:

- Catalysts that implement a denylists won't serve any denylisted content or entity.
- Deployments by denylisted addresses or containing denylisted content won't be accepted
- Catalysts should expose a way to know if a item is denylisted

Each catalyst will be able to have their own denylist file locally only accessible by the owner of the server. The current existing endpoints for modifying the denylist will be deleted as they will have no more usage anymore. To add an item to the denylist, the catalyst owner will have to edit the file and add the item as a line in the file.

The file name and location will be configurable by the catalyst owner modifying the environment, the corresponding property will be available in the env template.
