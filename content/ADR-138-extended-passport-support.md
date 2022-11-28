---
adr: 138
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
Use the "description" field from profiles to use in the "Intro" section or create a new one if it is different from the "description".

2. Block/Unblock users:
Use the "blocked" field from profiles to see/report blocked users.

3. Equipped wearables:
Take the information from the profile. There are the equipped wearables, emotes and the current name.

4. Items: wearables/emotes/names/lands:
For the wearables and emotes there are two available endpoints `/wearables-by-owner` and `/emotes-by-owner` that can be used for that. It will be necessary to create `/names-by-owner` and `/lands-by-owner` endpoints with similar behavior.

5. Guest: Passport for guest users will show only name and description, there is nothing to do for guests from the Catalyst end.

## Performance
To load a passport, first, there will be made 5 requests to a Catalyst (lambdas):

- `/profiles`
- `/wearables-by-owner`
- `/emotes-by-owner`
- `/lands-by-owner`
- `/names-by-owner`

Once this information is obtained, to display wearables and emotes it will be needed a couple of requests per each emote/wearable to download its image/thumbnail to be shown. This does not scale because some users have more than 1k NFTs. So the explorer should implement a lazy loading mechanism (for image/thumbnail) as the user browses the collectibles.

All except /profiles are expensive requests. Internally, from 2 to 5 they make queries to The Graph to check owned NFTs urns and then to the content server to get the definitions. Currently, 2 and 3 are not paginated, so making a query for a user that owns more than 1k wearables would be considerably heavy. Also, sometimes queries to The Graph are slow. So to improve this situation the endpoints from 2 to 5 could be paginated.

## Endpoints details



## Estimate

### MVP
The requirements are not blocking to start the client-side development.

Implement `/lands-by-owner` and `/names-by-owner` 

### Performance Improvements

- Add pagination to the existing endpoints
- `/lands-by-owner` and `/names-by-owner` can be cached.
- Push kernel/explorer to do thumbnails lazy loading

<!-- ## Suggestions

Due to the complexity of those calls being executed from kernel/renderer we could take a different path for all new development: One request to rule them all. A `/passport/:address` method that returns all the needed information, that endpoint can be called from the Renderer directly, removing dependencies and coupling with Kernel and also providing enough isolation of concerns to evolve independently from other endpoints

Unify all the calls into a single `/passport/:address` would reduce a ton of complexity on the renderer/kernel side of things and only perform one call

We can also leverage the BFF and implement the mentioned endpoint using a WebSocket to communicate the client and the server and thus avoid having a public contract and backward compatibility challenges as the feature evolves. -->

