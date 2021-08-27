# DCL UI dependencies upgrades

## Context and Problem Statement

The organization has several UI apps and libraries and of them have different React versions, causing issues whenever we want to consume them. To remove these problems, and to keep every app updated, we need to move to React 17 in every UI app and lib, specially in the UI repository that contains most of our shared UI components.

Updating the UI repository to the latest version of React implies updating `react-semantic-ui` to its latest version, ending up in [a major change that removed the `Responsive` component](https://github.com/Semantic-Org/Semantic-UI-React/pull/4008), a widely used component dedicated to conditionally rendering different components based on their display. Removing this component will cause a breaking change in our current [UI library](https://github.com/decentraland/ui) and will imply everyone to get on board of this breaking change, but a different strategy can be chosen by keeping the `Responsive` component by copying it from the library until everyone gets on board with an alternative.

We need to provide, alongside this update, an alternative library to the `Responsive` component, providing a similar or a better API for rendering components according to device sizes.

## Considered options

### Options on how to proceed with the breaking change

1. Do a breaking change, updating `react-semantic-ui` in our [UI library](https://github.com/decentraland/ui), removing the `Responsive` component and forcing everyone that wants to use our [UI library](https://github.com/decentraland/ui) to change their code.
2. Keep an exact copy of the `Responsive` component in our [UI library](https://github.com/decentraland/ui), without forcing a breaking change and provide an alternative to migrate the components easily.

#### Advantages

- Removing `Responsive` in a breaking change can ensure a non-prolonged onboarding of the alternative.

#### Disadvantages

- The breaking change might cause a blocker if there are repositories that want to be onboarded on the new version of DCL UI but don't have the time to make the full upgrade.

### Options on how to replace the Responsive component

1. The recommended by `react-semantic-ui`, `[@artsy/fresnel](https://github.com/artsy/fresnel)` library.
2. An alternative (but widely used) library like `[react-responsive](https://github.com/contra/react-responsive)`.

#### First alternative (@artsy/fresnel)

##### Advantages

- Support for SSR.

##### Disadvantages

- The `@artsy/fresnel` works by using a ContextProvider component that wraps the whole application, coupling the media query solution to this library.
- Doesn't have hooks support.

#### Second alternative (react-semantic-ui)

##### Advantages

- The libary doesn't require a provider or something previously set in an application to use it (non-coupling dependency).
- Provides hooks and component solutions for rendering components with different media queries, providing a versatile that allows us to render different components or part of the components by using the hooks.

##### Disadvantages

- Bad SSR support.

## Decision

The option to keep the an exact copy of the `Responsive` component (from the old `react-semantic-ui` lib version) was chosen in order to have a frictionless upgrade of the library.

The procedure in which we'll be handling the upgrade is the following:

1. A non breaking change upgrade will be provided to our [UI library](https://github.com/decentraland/ui), keeping the `Responsive` component as a deprecated component and an alternative (describe below) will be provided to replace it.
2. A breaking change upgrade will be applied to our [UI library](https://github.com/decentraland/ui), whenever all of our dependencies are updated, removing the `Responsive` component.

We’ll be providing, alongside the `Responsive` component a set of components and hooks to replace it, using the `react-responsive`, library. This library was chosen in favor of the recommended `@artsy/fresnel` mainly because of its versatility. The need of having to set a provider at the application's root level, (coupling the users of this dependency to `@artsy/fresnel`) to have better SSR support that we don't currently need, made us decide not to go with it.

The components built with the `react-responsive` and exposed to the consumers of our [UI library](https://github.com/decentraland/ui) will be the following:

- **Desktop** (for devices with `min width: 992`)
- **Tablet** (for devices with `min width: 768 and max width: 991`)
- **TabletAndBelow** (for devices with `max width: 991`, that is taking into consideration tablets and mobile devices)
- **Mobile** (for devices with `max width: 767`)
- **NotMobile** (for devices that don't comply with the requirements specified in Mobile)

These components describe a conditional rendering based on the media the page in being rendered.

Where we had:

```tsx
<Responsive
  as={Menu}
  secondary
  stackable
  minWidth={Responsive.onlyTablet.minWidth}
>
  <a className="dcl navbar-logo" href="https://decentraland.org">
    <Logo />
  </a>
  {this.renderLeftMenu()}
</Responsive>
<Responsive
  {...Responsive.onlyMobile}
  className="dcl navbar-mobile-menu"
>
  <a className="dcl navbar-logo" href="https://decentraland.org">
    <Logo />
  </a>
  <Header
    size="small"
    className={`dcl active-page ${
      this.state.toggle ? 'caret-up' : 'caret-down'
    }`}
    onClick={this.handleToggle}
  >
    {activePage}
  </Header>
</Responsive>
```

We now have:

```tsx
<NotMobile>
  <Menu secondary stackable>
    <a className="dcl navbar-logo" href="https://decentraland.org">
      <Logo />
    </a>
    {this.renderLeftMenu()}
  </Menu>
</NotMobile>
<Mobile>
  <div className="dcl navbar-mobile-menu">
    <a className="dcl navbar-logo" href="https://decentraland.org">
      <Logo />
    </a>
    <Header
      size="small"
      className={`dcl active-page ${
        this.state.toggle ? 'caret-up' : 'caret-down'
      }`}
      onClick={this.handleToggle}
    >
      {activePage}
    </Header>
  </div>
</Mobile>
```

And, alongside these components, as explained before, we're exposing the following set of hooks:

- **useDesktopMediaQuery**
- **useTabletMediaQuery**
- **useTabletAndBelowMediaQuery**
- **useMobileMediaQuery**
- **useNotMobileMediaQuery**

Which return true if the device is the one defined as the name of the hook.

These types of hooks will provide us with newer functionality, being able to customize small portions of our code instead of forking our components into two.

As an example, we can apply certain styles by simply:

```tsx
const isMobile = useMobileMediaQuery()
const classes = isMobile ? "dcl mobile" : "dcl"
<div className={classes}>
...
</div>
```

## Participants

Date: 2021-08-27

- @LautaroPetaccio
- @nachomazzara
