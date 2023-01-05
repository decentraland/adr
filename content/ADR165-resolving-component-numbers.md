---
layout: adr
adr: 165 # replace this number for the PR or ISSUE number
title: Resolving component numbers for the scripting of the SDK
date: 2023-01-04
status: Idea
type: RFC # pick one of these
spdx-license: CC0-1.0
authors:
  - menduz
---

## Abstract

This RFC describes the non-functional problems to solve in relation to the component numbers of the SDK. It presents synchronization, usability and ergonomic problems behind the technical requirements for the performance. It presents alternatives as a jurney, to add context on the decisions. The document is still not conclusive.

## Context, Reach & Prioritization

Assuming a deterministic and compiled file (`game.js`) and a set of well-known ECS components for rendering (Transform, Gltf, Material, MeshRenderer). It is easy to think about synchronizing either two instances of the `game.js#1` and `game.js#2` or to broadcast visual updates back-and-forth with a renderer. In this case, all components between all actors share a stable numeric identifier (component number) allowing ultra fast synchronization and CRDT semantics, which were hard technical requirements at the design stage.

But there is more than that, beyond the technical requirements, storing the state in a human readable way  is a fundamental use case of the whole product. In a way that can be shared with artists an developers to leverage their collaboration towards a beautiful and polished final experience. And a key element of iterating an experience (whether they use a text or WYSIWYG editor) is evolution of the assets, and that includes the data stored in the components of the entities.

As of the moment of writing this essay, components are identified by a user-defined number pointing to a schema. And that works perfectly for the use cases described in the first paragraph, and from a technical perspective. But it is very short sighted for the big non-functional requirements like enabling evolution, collaboration and reusability/DRY:
- Component numbers are defined by developers, in code
- Third party providers (like physics libraries) may use the same component numbers, generating a conflict
- There is no way to name components for a human-readable or diffable format, i.e. reading `188:[1,1,1],189:[1,1,1]` is not as good as `position:{x:1,y:1,z:1},scale:{x:1,y:1,z:1}`

And due to the imperative nature of the code, defining components (and their schemas) makes it difficult to statically analyze the environment to extract information from it to create better tools. It would be highly beneficial to "analyze" a project to assess its components rather than "run" the code to extract its information.

## Solution space exploration

The solution space exploration will evaluate three big problems, **defining the component number**, **coding ergonomics** and **static reflection**.

By **defining the component number**, the stability and speed of the internal protocols will be the key factor. Among with using third party libraries without component collisions.

With **coding ergonomics**, how the developers _define_ and _use_ the components will be evaluated.

And lastly, **static reflection** contemplates the ability of the approach to extract information from the raw assets of the project (and its libraries) to enable better creation tools and static representations of the scenes and composites.

### Ideal solution

The ideal solution is a _nominal_ collection of components, in which _names_ of components are used to identify the schemas.

Characteristics:
- Developers will never see the component number under normal circumstances.
- The fully qualified name (FQN), defined as `package-name/route/to/component/Component` is used to derivate the deterministic component number.
- Component numbers have no collisions, a Hash algorithm without collisions may be used to reduce the domain of the `Hash(FQN) -> integer`.
- Components are imported from the files that defined them, using native TypeScript imports.
- The tooling is able to traverse and analyze all the component definitions, extract their FQN and schema, in order to produce static information to render the editor UI and text (de)serializers.

#### Calculating the component namber

For the rest of the document, we can assume that the component number will be derived using a hash of the FQN. The caveat is that the image of the function will be limited to `int32`, and that greatly increases the chances of collisions. This will mostly cover the **defining the component number** dimension, focusing the domain of the problem to how to define the FQN.

For the sake of simplicity in implementation and distribution of hashes, a regular CRC32 will be used to calculate the component number using a function like this:

```ts
// components with fixed numbers, used for the rendering for performance
// reasons
const MAX_RESERVED_COMPONENT_NUMBER = 2048
// NOTE: this function will always return uint32
function computeComponentNumber(fullyQualifiedName: string): number {
  return (unsignedCRC32(fullyQualifiedName) + 2048) & 0xFFFF_FFFF
}
```

### Alternative 1

Using a convention over configuration approach, components are defined in a well-known folder, using a constrained type to prevent imperative code and race conditions to happen.

All the components will be stored in the root folder "components", one per file. The FQN will be derived from the `packageName::FileName`, and the name of the component will be only defined by its filename.

Each file exports an `export default declareComponent(schema)` value, in order to be statically analyzed by simply importing the file with any JS runtime. The tooling also detects other side effects of importing the file to help/prevent the developers from tinting the component files with unrelated code.

The resolution of FQN of the current experience and its dependencies is deterministic by traversing the dependencies and detecting the convention, then importing each component.

In order for developers to use the components, the tooling generates a source file materializing all the components and adding a name to them. The generated code looks like this:

```ts
// components.generated.ts
//! THIS FILE IS AUTOGENERATED, DO NOT EDIT
import { engine } from '@dcl/ecs'

// third party components
import RotatorComponentDeclaration from 'rotator-library/components/Velocity'

// own components
import VelocityComponentDeclaration from './components/Velocity'
import AccelerationComponentDeclaration from './components/Acceleration'

export const Rotator =
  engine.addComponent(RotatorComponentDeclaration)
export const Velocity =
  engine.addComponent(VelocityComponentDeclaration)
export const Acceleration =
  engine.addComponent(AccelerationComponentDeclaration)
```

This approach has many limitations and problems.
- Repeated component names are not possible, besides having non-repeated FQN. A `./components/Velocity` would collide with `physics-lib/Velocity`.
- Generating code adds an extra step to the development flow, playing against the ergonomics of the static analyzers and tools like github's "go to reference", always requiring some external tool to fully interpret the code.
- Adding convention over configuration reduces the flexibility of the code and limits emerging (and maybe better) implicit conventions between teams.

### Alternative 2

Evolving the idea from the previous alternative, now all components are nominal, referenced by their name/symbol in typescript and exported as consts in a single file `./components.ts`. Enabling the tooling to only analyze one file like before, but removing entirely the code generation stage.

```ts
// components.ts
export { Velocity } from './components/Velocity'
export { Acceleration } from './components/random-file'
```

Third party components are imported directly from their libraries in the file that they are going to be used. `import { Rotator } from 'rotator-library/components'`.

In this approach, no automatic convention is available to resolve their number or FQN, and thus the definition of the components themselves would need a manual FQN.

```ts
// components/Velocity.ts
export const Velocity = declareComponent("my-scene::Velocity", {
  x: Schemas.Float,
  y: Schemas.Float,
  z: Schemas.Float
})
```

This approach will also enable the tooling to load and run a variety of files to "as statically as possible" know their exposed components. Enabling components for internal usage being hidden from the editor or other tools.

A naive component loader would look like this:

```ts
export function loadAllComponents(workDir: string) {
  const { dependencies } = readPackageJson(workDir)

// load dependencies with components
  const componentFilesToLoad =
    dependencies.filter(dep => resolveFile(dep, '/components.js'))

  // load current project
  componentFilesToLoad.push(resolveFile(workDir, , '/components.js'))

  // reduce results
  const loadedComponents: ComponentDefinition[] = []
  for (const file of loadedComponents) {
    loadedComponents.push(Object.values(require(file)))
  }
  // validate
  validateComponents(loadedComponents)
  return loadedComponents
}
```

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
