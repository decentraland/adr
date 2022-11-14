---
adr: 112
date: 2022-10-05
title: Onboarding experience as Portable Experience
authors:
  - menduz
status: Draft
type: Standards Track
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-12
---

# Abstract

This document presents a cross-platform, cross-renderer alternative to the Onboarding experience using regular scenes and the SDK instead of the hard-coded experience currently embedded in the renderer (unity).

## Introduction

During the years of Decentraland there was many experiments about the onboarding experience. It was always relatively easy to use Unity to tweak the experience. As the time passes, the complexity of the Renderer increases rendering changes in the onboarding experience too expensive to test due to the QA flow and release checks.

Also, the SDK gets more and more mature, supporting not only new features for the scenes but also new ways to run scenes like via Portable experiences.

This document will describe all the technical changes required to decouple the Onboarding experience from the renderer in the pursuit of:
- Reducing the overall size of the renderer
- Decoupling the development of the renderer from the onboarding
- Enabling different tutorials for different platforms
- Dogfooding the SDK to create the onboarding experience
- Re-use the onboarding experience in multiple (renderer) platforms
- Specializing onboarings for VR, Mobile with their own characteristics
- Enable A/B testing on the onboarding experiences with the same Renderer binary
- Decoupling releases of the Renderer from changes in the onboarding to gain speed

# Hosting of the scene

Since the onboarding is not a LAND, a Preview server will be used to host the scene. This server will also allow multiple parallel versions of the onboarding to co-exist to redirect the first time user experience to a specific cohort of A/B test or to a specialized tutorial for each platform i.e. VR may have a different tutorial because it has a different input method.

The preview server is specified in [RFC-11](/rfc/RFC-11). The configuration of the onboarding experience will be served by the `/about` endpoint specified in [RFC-10](/rfc/RFC-10)

Some UX Considerations that need to be accounted for are:
- Since the onboarding is not a LAND in the genesis city, the minimap MAY be shut down during this experience to prevent confusions.
- At any moment, the users may want to have an "easy exit" from the onboarding. To do that, pressing the M to open the Map/Explore and the `/goto` commands should work.
- The onboarding creators MUST ensure that there is always a shortcut in the UI to exit the tutorial at all times. This will use the "teleport" function of the SDK. Like the `/goto`, it will take the users to a DAO realm by default, then unload the experience and load the Genesis City
- The empty parcels won't be loaded for this preview experience. Thus the green blockers may be present. Those should be removed for a seamless experience.
- The onboarding experience may benefit from specific lighting. There will be an option to override the user setting while this scene runs. The user settings will be honored for the Genesis City

# Communications server

At first, the onboarding experience will be a offline experience.

# Starting the onboarding experience

To all practical means, thanks to the `/about` endpoint of [RFC-10](/rfc/RFC-10), every onboarding experience will be its own Realm. And like the rest of the realms, the selection is controlled by Kernel.

Many conditions should be taken into account before deciding which realm is going to be used every time the Explorer starts (PENDING RFC). To those conditions, we will add the following.

```diff
defaultRealm =
  1. If CATALYST queryParam is set -> use `$CATALYST/about`
  2. If PREVIEW_MODE               -> use `$hostname/about`
  3. Else                          -> pickFromDaoRegistry()

RealmSelection =
+ 1. If eligibleForOnboarding() -> pickOnboardingRealm(thenGoTo: defaultRealm)
  2. Else                       -> defaultRealm
```

The `eligibleForOnboarding` conditions will use the following algorithm

```
eligibleForOnboarding =
  1. true if guestAccount  AND isNewGuest(guestAccount, localStorage)
  2. true if walletAccount AND NOT presentInCatalyst(walletAccount, defaultRealm)
  3. false
```

The `pickOnboardingRealm` function is used to select the proper onboarding tutorial for each user and platform. It selects the variant from the feature flags pointing to the right deployment URL.