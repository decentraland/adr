# ADR-27 - port loading screen to unity

## Abstract

Currently our loading screen is part of the website. To ease cross platform development the screen will be ported and
part of `unity-renderer`.

## Need

* Centralize our loading screen to simplify cross platform development.

## Current implementation

_Website_ enables or disables the _Loading Screen_ through some flags in the global state:  `show = state.showLoadingScreen || state.waitingTutorial`.

These flags are set from multiple places within _kernel_. We can differentiate three different flows working with the _Loading Scene_.

#### SignIn
In a normal signin process, the `showLoadingScreen` flag is modified in this order:
```
1) renderer\sagas	initializeRenderer.setLoadingScreenVisible => true
2) dcl.ts		teleportObservable.setLoadingScreenVisible => true
3) dcl.ts		renderStateObservable.setLoadingScreenVisible => false
4) loading\sagas	initialSceneLoading.finish => false
```
#### SignUp
In the SignUp process, the `showLoadingScreen` flag is modified in this order.
```
1) renderer\sagas	initializeRenderer.setLoadingScreenVisible => true
2) dcl.ts		teleportObservable.setLoadingScreenVisible => true
3) session\sagas	showAvatarEditor.setLoadingScreenVisible => true
4) dcl.ts		renderStateObservable.setLoadingScreenVisible => false
5) session\sagas	showAvatarEditor.setLoadingScreenVisible => false
6) dcl.ts		renderStateObservable.setLoadingScreenVisible => false
7) session\sagas	signUp => true
8) loading\sagas	initialSceneLoading.finish => false
9) website.ts		loadWebsiteSystems.userAuthentified.ensureRendererEnabled => false
```
*The `waitingTutorial` is modified in this flow as well. It handles the _edge case_: User finishes the signup process but the world has not been loaded yet. 

#### Teleporting
When teleporting, the `showLoadingScreen` flag is modified in this order:
```
1) dcl.ts		teleportObservable.setLoadingScreenVisible => true
2) dcl.ts		renderStateObservable.setLoadingScreenVisible => false
```
Notice how most of the time the flag is changed reduntantly. In any case I haven't found any conflict in the way they are modified.

## Approach

The _Loading Screen_ will be ported to _Unity_ as a _HUD_. _kernel_ will maintain the ownership of the visibility of the screen. Now, instead of changing the `showLoadingScreen` flag, _kernel_ will send a message to _Unity_ with the relevant information (`LoadingScreen: on|off, IsTeleporting: on|off, Stage: ESTABLISHING_COMMS | COMMS_ESTABLISHED | EXPERIENCE_STARTED...`)

The _website_ _Loading Screen_ shouldn't be needed anymore. Currently we are dispatching some events listened by the _website_ about the renderer being loaded. Although _website_ is reacting properly to this, it's a never reached state since we don't show the player the `Play` or `Enter as guest` buttons until the renderer is ready.

Therefore the whole _Loading Screen_ can be removed from _website_.

The need of a preloading stage (while loading _Unity_) is out of this ADR scope. It would maintain the current implementation of a spinner hiding the `Play/Enter as guest` buttons.

The implementation in _Unity_ is pretty straight-forward. A HUD reacting to the _kernel_ message to show the screen while maintaining all the features of our current implementation (cycling tips, animated progress bar...) should suffice.

## Benefit

- Cross platform development can reuse this new loading screen flow almost entirely.

- A first step into decoupling the experience lifecycle from kernel to end up moving parts of our current `loading/sagas` responsibilities into _Unity_.

## Participants

- World Team
