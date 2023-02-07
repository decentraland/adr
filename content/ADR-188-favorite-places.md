---
layout: adr
adr: 188
title: Favorite Places
date: 2023-02-07
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - davidejensen
---

## Abstract

This document describes an approach on how to integrate the new Favorite Places functionality in Decentraland.

## Glossary

- **Place** A specific parcel or set of parcels identified by a [place UUID](/adr/ADR-186)
- **Places** The structure of database and endpoints used in the places website

## Problem

To enhance the discoverability of the different Decentraland places, there is the need of adding a favorite mechanism. This will allow user to store and retrieve easily a set of their best loved places.
To integrate this changes at multiple levels are required, from the visual representation in the explorer, to the backend structure that will allow the saving and retrieving of a user favorites.

Following a list of the expected functionalities:

- Users can add a place to their favorite from the explore menu
- Users can navigate to a new tab listing all the places they added to favorites
In a future iteration it will be possible to favorite places from the minimap HUD and also from the map parcel info pop-up, currently not possible due to technical limitations of the renderer map handling and Places API restriction to curated places.
More in the limitations section.

## Solution

### Data storing

After an initial discussion about whether to store favorites in the user profile or in Places, we are more incline to store everything in Places, more informations about the decision journey at the end.

### Favorite retrieval

The Places API will provide the required informations through:

- An endpoint to obtain the (paginated if we decide for a big maximum amount) list of favorites.
- An endpoint to add a new favorite for the current user
- An endpoint to remove a favorite for the current user
In additon a change will be required in the current places data structure in order to show the favorite information in the explore places list with a boolean.

### Data structure

To facilitate the addition of the feature when handling favorites we should use the same data structure currently used for Places, with the boolean addition previously mentioned:

```
public class Realm
{
	public string serverName;
	public string layer;
	public int usersCount;
	public int maxUsers;
	public Vector2Int[] userParcels;
}

public string id;
public string name;
public string creator;
public string description;
public string thumbnail;
public Vector2Int baseCoords;
public Vector2Int[] parcels;
public int usersTotalCount;
public bool isPOI;
public Realm[] realms;
public bool isFavorite;
```

## Current limitations

With the current functionalities provided by the Places website it is not possible to favorite all the Decentraland areas due to a restriction that allows only curated Places to be displayed. This together with a legacy code integration of the map in the unity renderer will allow the favorite functionality to be applied only in the places section in the explore menu.

## Decision Journey

In the initial iteration it has been discussed where to store the favorite list, the two options were storing them in the user profile or storing them in Places, the following PROs and CONs made us lean towards the Places option:

Storing favorite in the user profile:
  - PROs
    * Easily readable in unity renderer
    * Simple to obtain favorites of other players
    * Decentralised approach
    * Favorites can be imported in places without user interaction
  - CONs
    * requires updates on the profile schema
    * requires to implement the profile update on web
    * requires to track every catalyst update to calculate stats and trends
    * explorer can’t suggest places based on the favorites of your friends
    * scenes can read it but not update it
    * an update request from different apps can erase a favorites accidentally
    * limited by the max size of a profile
    * not paginated
Storing favorites in places
  - PROs
    * no limit on the amount of favorites
    * api already paginated
    * can be accessed and updated with code in the scene
    * can calculate stats just looking at the database (place with the most favorites, last favorites, favorites trends)
    * can suggest favorites places of your friends
    * can eventually move all favorites from one position to other in case the scene move to another parcel
  - CONs
    * is a single point of failure
    * requires a new integration in the unity side to request this data (it just a signed fetch)
    * favorites can’t be imported into the profile, it requires user interaction to do it

In addition, because currently unity-renderer doesn't communicate directly with the Places API, it has been thought that the missing endpoints will be contacted with the old kernel request system, in order to avoid blocking the development of this new functionality until the authentication system and request handling is transferred to the unity renderer.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
