---
adr: 237
date: 2023-05-23
title: SDK 7 Custom UI Components
status: Review
authors:
  - gonpombo8
type: Standards Track
spdx-license: CC0-1.0
---

## Context

In the current SDK7 library for Decentraland, we have implemented a custom react-reconciler library, where components are defined in a JSX format. This approach allows for the creation of reusable, composable components that can be imported into any scene.

However, an issue has arisen with an external library that defines components as game objects using classes. These class-based components do not return JSX.Elements, which is inconsistent with the rest of our codebase and limits the composability.

## Decision

We have decided to enforce a rule that all components, whether internal or external, must return JSX.Elements. This decision is based on the following reasons:

1. **Consistency**: All components in our codebase should follow the same pattern. This makes the code easier to understand and maintain.

2. **Composability**: Components that return JSX.Elements can be composed together to create complex UIs. This is a key feature of React and should be leveraged in our library.

3. **Interoperability**: Components that return JSX.Elements can be used seamlessly with other React components. This increases the utility of our library and makes it easier for developers to integrate it into their projects.

## Implications

This decision will have the following implications:

1. **Refactoring**: The external library will need to be refactored to comply with this rule. This will involve some effort, but it is a necessary step to ensure consistency and composability across our codebase.

2. **Documentation**: Our documentation will need to be updated to clearly state that all components must return JSX.Elements and to explain the theme system. This will provide clarity to developers on our design decisions and how to use our library correctly.

3. **Guidance**: We may need to provide guidance or resources to developers who are not familiar with this pattern. This could include examples, tutorials, or other educational resources.

4. **Validation**: We will need to implement a mechanism to validate that all components return JSX.Elements. This could be done through static type checking, unit tests, or other methods.

## Links

- [React UI ADR](https://adr.decentraland.org/adr/ADR-124)
- [React docs](https://react.dev)
- [React State changes](https://react.dev/learn/reacting-to-input-with-state)

## Theme System Implementation

Here's how we propose to implement a light and dark theme system:

First, create a `ThemeContext`:

```tsx
import ReactEcs from '@dcl/sdk/react-ecs'
import React from 'react'

export type Theme = 'light' | 'dark'
export type ThemeContextProps = {
  theme: Theme
  toggleTheme: () => void
}

export const ThemeContext = React.createContext<ThemeContextProps | undefined>(undefined)
```

Next, create a `ThemeProvider` component that will provide the theme to its children:

```tsx
import ReactEcs from '@dcl/sdk/react-ecs'
import React from 'react'
import { Theme, ThemeContext } from './ThemeContext'

export function ThemeProvider({ children }: React.PropsWithChildren<{}>) {
  const [theme, setTheme] = React.useState<Theme>('light')

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const value = { theme: theme, toggleTheme: toggleTheme }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
```

Now, you can use the `useContext` hook in any functional component to access the current theme and the `toggleTheme` function:

```tsx
import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import React from 'react'
import { Color4 } from '@dcl/sdk/math'

import { ThemeContext } from './ThemeContext'

const Button = () => {
  const { theme, toggleTheme } = React.useContext(ThemeContext) || {}

  if (!theme || !toggleTheme) {
    throw new Error("Button must be used within a ThemeProvider")
  }
  const buttonStylesDependOnTheme = {
    light: {
      color: '#ffffffff',
      otherProps: {},
    },
    dark: {
      color: '#000000ff',
      otherprops: {}
    }
  }[theme]

  const uiTransform = { height: 100, width: 100 }
  const uiBackground = { color: Color4.fromHexString(buttonStylesDependOnTheme.color) }
  const uiText = { value: theme }
  return (
    <UiEntity
      uiTransform={uiTransform}
      uiBackground={uiBackground}
      onMouseDown={toggleTheme}
      uiText={uiText}
    />
  )
}

export default Button
```

Finally, wrap your app with the `ThemeProvider` component:

```tsx
import ReactEcs from '@dcl/sdk/react-ecs'
import { ThemeProvider } from './ThemeProvider'
import Button from './Button'

const uiComponent = () => {
  return (
    <ThemeProvider>
      <Button />
    </ThemeProvider>
  );
};

export default uiComponent;
```