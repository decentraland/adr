# ADR-31 - Signin/signup Kernel<>Website

# Communication kernel<>website in the signin/signup flow

## Key Files
- Kernel
  -`session/sagas.ts`
- Website
    - `src/components/auth/LoginContainer.tsx`
    - `src/components/auth/EthLogin.tsx`
    - `src/components/auth/wallet/WalletSelector.tsx`

## Kernel <> Website
Disclaimer: The whole document describes the environment after  this [PR](https://github.com/decentraland/explorer/pull/2453)

The current implementation is based on events and data in the global store. Take this into account when reading the diagrams.
An arrow from `kernel` to `websites` doesn't actually means a direct connection between the 2 projects.

The following diagrams represents a high-level view of the system.
# Sign-in
  ![resources/ADR-28-signin-signup-kernel-website/signin.svg](resources/ADR-28-signin-signup-kernel-website/signin.svg)

# Sign-up
  ![resources/ADR-28-signin-signup-kernel-website/signup.svg](resources/ADR-28-signin-signup-kernel-website/signup.svg)

## Implementation Details
The trickiest parts about the whole flow are the Race Conditions. To prevent them and their issues we are ensuring Unity initialization before starting other subsystems.

In our previous implementation we enforced this through website by not allowing the users to do anything before engine was ready (`engineReady = state.renderer.initialized && state.renderer.engineStarted`). That was the waiting spinner before showing the `Play` and `Enter as guest` buttons.

Now we allow users to allow the signin process by selecting their provider (`null` for guest) but ensuring Unity is ready before doing anything with that data.

You can find a good example of this in `session/sagas.ts`: `startSignUp` yields a wait for unity interface to avoid asking the renderer to show the AvatarEditor before it's ready.