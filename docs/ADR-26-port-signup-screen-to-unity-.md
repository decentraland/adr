# ADR-26 - port signup screen to unity

## Abstract

Currently our signup screen is part of the website. To ease cross platform development the screen will be ported and a
part of `unity-renderer`.

## Need

* Centralize our signup workflow to simplify cross platform development.

## Current implementation

When a new user starts Decentraland (even as a guest). Our signup workflow get's started.

1) _Kernel_ requests _Avatar Editor_ in _Unity_.
2) User creates an avatar and press `Done`.
3) _Unity_ sends the avatar info upwards.
4) _Kernel_ dispatches events regarding the change of the signup stage and deactivate Unity's rendering.
5) _Website_ reacts to the stage change and displays the _passport_ and _ToS_ screen.

   5a. User presses `Back`. Events are dispatched with a `[SIGNUP_COME_BACK_TO_AVATAR_EDITOR]` event, _kernel_ reacts to it and requests _Unity_ to show the _Avatar Editor_ again coming back to step _1_.
6) _Website_ dispatches an event with the passport info (_name_ and _email_).
7) _Kernel_ finishes the signup with the passport info and converges to the normal signin workflow.

## Approach

The _passport_ and _ToS_ screens will be ported into Unity. For _kernel_ the workflow will be almost identical while all the related code for _website_ will be removed.

The new flow should go as this:

1) _Kernel_ requests _Avatar Editor_ in _Unity_.
2) User creates an avatar and press `Done`.
3) _Unity_ sends the avatar info upwards.
4) _Unity_ shows the _passport_ and _ToS_ screen.
5) _Unity_ sends the _name_ and _email_ upwards.
6) _Kernel's_ endpoint for unity generates the same events previously dispatches by _website_. The session _saga_ reacts to them and the flow goes as the current implementation.

## Benefit

- Cross platform development can reuse this new signup workflow almost entirely.

- The signup flow is drastically simplified as a side effect. The current implementation is hard to follow (mostly due to the lack of documentation) with all the events going up and down between _kernel_ and _website_.

## Participants

- World Team
