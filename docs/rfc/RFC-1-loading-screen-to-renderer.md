# Move loading screen logic from kernel to renderer

Author Name(s): @menduz  
Author Date: 2022-08-17  
Due Date: 2022-08-24  
Status: `Draft`  

## Abstract

<!--
Insert here a brief paragraph summarizing the RFC in its current state.
This section shall provide an overview of whether this is a settled
decision, alternatives explored and a short summary of relevant
background information and key insights.
-->

The renderer<>kernel communication has been going through a transformation due to the separation of repositories during the past two years. That included moving some parts from React to Unity like the Loading Screen. As of today the Loading Screen is still being controlled by Kernel but most of the information comes from Renderer. Creating unnecessary feedback loops. This RFC proposes to grant the control of the loading screen entirely to the renderer.

## Need

<!--
Why is this RFC needed?  Briefly describe the need motivating this
proposed artifact to be created or work be done.  What problem does it
solve? Include an estimate of actual or perceived effort/gain.
-->

To reduce the complexity of messages and control-code, this RFC proposes granting the control of the loading screen back to the Renderer component. The logic in kernel mostly uses information of the renderer to show the loading screen.

## Approach

<!--
How do you intend on addressing the need?  Describe what you plan on
doing and the rationale behind the decisions you propose.  Then lay out
the plan of execution, in rough order of how the execution should take
place.  Include the rollout plan as well. (This is usually the longest
section of the RFC) Hint: don’t be afraid of posting illustrations! The
level of detail here has to be enough to give the reader  a clear
understanding of the solution - it is up to the writer to decide.
Further detail can be addressed to satisfy comments and increase clarity.
-->

The amount of messages and coupling can be drastically reduced if kernel sends the required information to decide about the loading screen to the Renderer.

The complete loading business logic can be expressed as the functions attached below. Two things are considered: RendererVisible and LoadingVisible.

RendererVisible is used to both show and hide the entire renderer to make room for the wallet selector, landing and guest login options. It becomes useless after a successful login.

RendererVisible has a different lifecycle, it depends on several conditions including state of the login, state of the renderingVisible ( reported from renderer) and world loading status (amount of pending parcels, also reported by the renderer in addition to runtime information).


```ts

export const getFatalError = (state: RootLoadingState) => state.loading.error
export const getLoadingState = (state: RootLoadingState) => state.loading
export const isInitialLoading = (state: RootLoadingState) => state.loading.initialLoad

export function hasPendingScenes(state: RootLoadingState) {
  return state.loading.pendingScenes !== 0
}

export function isLoadingScreenVisible(state: RootLoadingState & RootSessionState & RootRendererState) {
  const { session, renderer } = state

  // in the case of signup, we show the avatars editor instead of the loading screen
  // that is so, to enable the user to customize the avatar while loading the world
  if (session.isSignUp && session.loginState === LoginState.WAITING_PROFILE) {
    return false
  }

  // if parcel loading is not yet started, the loading screen should be visible
  if (!renderer.parcelLoadingStarted) {
    return true
  }

  // if it is the initial load
  if (state.loading.initialLoad) {
    // if it has pending scenes in the initial load, then the loading
    // screen should be visible
    if (hasPendingScenes(state)) {
      return true
    }

    if (state.loading.totalScenes === 0) {
      // this may happen if we are loading for the first time and this saga
      // gets executed _before_ the initial load of scenes
      return true
    }
  }

  // if the camera is offline, it definitely means we are loading.
  // This logic should be handled by Unity
  // Teleporting is also handled by this function. Since rendering is
  // deactivated on Position.unsettled events
  return !state.loading.renderingActivated
}

// the strategy with this function is to fail fast with "false" and then
// cascade until find a "true"
export function isRendererVisible(state: RootState) {
  // of course, if the renderer is not initialized, it is not visible
  if (!state.renderer.initialized) {
    return false
  }

  // some login stages requires the renderer to be turned off
  const { loginState } = state.session
  if (loginState === LoginState.WAITING_PROFILE && getIsSignUp(state)) {
    return true
  }

  // if it is not yet loading scenes, renderer should not be visible either
  if (!state.renderer.parcelLoadingStarted) {
    return false
  }

  if (
    loginState === LoginState.SIGNATURE_FAILED ||
    loginState === LoginState.SIGNATURE_PENDING ||
    loginState === LoginState.WAITING_PROVIDER
  ) {
    return false
  }

  return state.loading.renderingActivated || isLoadingScreenVisible(state)
}

```

The proposed approach is:

1. Add a feature flag to change the control of the loading screen from kernel to renderer `explorer-renderer-loading-screen`
2. Add a new method to the new RPC to inform the renderer about the status of some subsystems. It will include information about the amount of pending scenes, total scenes and account status.
3. Implement in renderer & kernel the handling of that message
4. Implement business logic for login screen tied to that feature flag and remove as well the code from kernel
5. Upon releases, remove feature flag and set default logic to the new data flow

## Benefit

<!--
What are the benefits / merits of this approach?  Tie the benefit
directly back into the satisfaction of the need.  How does this benefit
the client / user? How does the unique approach yield unique customer benefits?
-->

It would reduce the coupling between components and enable better loading UX in the renderers.

## Competition

<!--
What other options were considered? Give an honest treatment of why
these alternatives were not satisfactory. Identify the competition and
demonstrate that the competition is clearly understood. Include the
“what if we do nothing” alternative.
-->

Do nothing: keep the logic in Kernel