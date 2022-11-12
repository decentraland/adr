---
adr: 43
date: 2021-11-09
title: Catalyst API and Protocol refinement
status: Withdrawn
authors:
  - pentreathm
  - agusaldasoro
type: Standards Track
spdx-license: CC0-1.0
---

## Context

The [Catalyst API](https://decentraland.github.io/catalyst-api-specs/) has been evolving and adding different functionalities, endpoints and parameters as needed by the evolving platform requirements. Because of this needs, some changes while good decissions at the moment to unblock features, were not thought hollistically or now they may be causing too much unneded Data Transfer cost or have room for perfomance improvement for the Catalysts core processes like Bootstrapping and Synchronization.

## Decision

After reviewing the Catalyst API we defined a set of changes to clean up and close a first version of the Catalyst Protocol. The changes that will be described below will enable us to:

- Reduce Data Transfer cost by only narrow down the response bodies to only return the needed information
- Reduce public API complexity by hiding endpoints that are only inteended for troubleshooting, this will also reduce hits to endpoints that should not be used externally
- Improve the Catalyst bootstrapping and synchronization time by reducing the amount of request and information recieved for the synchronization
- Do a more efficient use of the DB
- Open the door to create new Catalyst implementation based on this protocol definition

List of API changes:

Deprecated endpoints won't be part of the Catalyst Protocol definition but we may keep some of them as internal troubleshooting tools, these endpoints will require a key in order to be used.
Those endpoints that will be removed from the Protocol but remain available for internal use, have the `SECURE` tag in the change description.

Endpoints not mentioned in the following list will not suffer any change.

| Endpoint                                                         | Deprecate YES/NO | Change Description                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/content/deployments`                                           | YES              | `SECURE`: This endpoint consumes DB resources inefficiently as it's equivalent to a SELECT ALL. This endpoint also has a complex UX with the application of many filters and a lot of parameters. We are going to tag this as TROUBLESHOOTING and add 2 new endpoints: one to retrieve the list of all pointers and another to retrieve the history of a given list of pointers. Catalyst synchronization will be done using `/snapshots` and `/pointer-changes`. |
| `/content/pointers/{entityType}`                                 | New endpoint     | Given an entity type (scene, wearables) this endpoint returns the list of all the pointers paginated                                                                                                                                                                                                                                                                                                                                                              |
| `/content/pointers/{entityType}/history?pointer=0,0&pointer=1,1` | New endpoint     | Given a list of pointers of the specified entity type, returns the history of deployments                                                                                                                                                                                                                                                                                                                                                                         |
| `/contents/{hashId}/active-entities`                             | NO               | `SECURE`: Change resource to `/entities` and include a parameter to expand it's functionality in order to be able to retrieve inactive entities                                                                                                                                                                                                                                                                                                                   |
| `/content/failed-deployments`                                    | YES              | `SECURE`: This endpoint should be removed from the public API, and only be used with a key for the Catalyst Monitor and for troubleshooting or the auto-fix deployments functionality                                                                                                                                                                                                                                                                             |
| `/lambdas/health`                                                | NO               | We need to add more information like the Unhealthy message. Currently you get an unhealthy state and no information about why the service is unhealthy                                                                                                                                                                                                                                                                                                            |
| `/lambdas/contentv2/scenes`                                      | YES              | Do we need the v2? this endpoint should be generic to retrieve the list of scenes of a given coordinates                                                                                                                                                                                                                                                                                                                                                          |
| `/lambdas/contentv2/parcel_info`                                 | YES              | The information provided by this endpoint is presnet in `/content/entities/{entityType}?id={cid}`. We are going to add some filters to the existing endpoint to help you select which part of the entity you want to retrieve, e.g. content, metadata                                                                                                                                                                                                             |
| `/lambdas/contentv2/contents/{cid}`                              | YES              | There are old entities v2 that are still requested and may still be valid. We need to see if we can update these entities and deprecate this endpoint                                                                                                                                                                                                                                                                                                             |
| `/lambdas/crypto/validate-signature`                             | YES              | `SECURE`: This should be done with a library in the client side. Add a new lambda to return the Graph URL that we are using or add this information to the `/lambdas/contracts/servers` endpoint                                                                                                                                                                                                                                                                  |
| `/comms/islands`                                                 | YES              | `SECURE`: Remove from the public API and add a key to use this information for troubleshooting                                                                                                                                                                                                                                                                                                                                                                    |
| `/comms/islands/{islandId}`                                      | YES              | `SECURE`: Remove from the public API and add a key to use this information for troubleshooting                                                                                                                                                                                                                                                                                                                                                                    |
| `/comms/peers`                                                   | YES              | `SECURE`: Remove from the public API and add a key to use this information for troubleshooting                                                                                                                                                                                                                                                                                                                                                                    |

# Status

Rejected by DAO

# Consequences

`/deployments`: We are not aware if this endpoint is being used for anything else besides the Catalyst synchronization and bootstrapping processes.

The `fetchAllDeployments` method from the [Catalyst Client](https://github.com/decentraland/catalyst-client) will only be available to be used by the Catalyst Servers in order to sync all the Content Service history.

The rest of the changes should not cause any impact on the Catalyst clients
