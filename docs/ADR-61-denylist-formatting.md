# Denylist format

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


### Denylist implementation

If catalysts implement the denylist should impact the following way in the catalysts:

- Catalysts that implement a denylists won't serve any denylisted content or entity. 
- Deployments by denylisted addresses or containing denylisted content won't be accepted
- Catalysts should expose a way to know if a item is denylisted

There might also be a common denylist file saved in the blockchain that every catalyst in the DAO will be forced to implement, each denylisted item in this file should need to be added via a DAO Poll. 

## Participants

@jmoguilevsky
@agusaldasoro
@menduz
