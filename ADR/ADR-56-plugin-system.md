---
layout: doc
adr: 56
date: 2022-01-26
title: Plugin pattern for Renderer features
status: Living
authors:
- BrianAmadori
type: Standards Track
spdx-license: CC0-1.0
---

## Problem Statement

Right now, the Explorer features don't follow any standarized structure. `HUDController` is used as a sort of service
locator/factory mix-up. `Bridges` that correspond to specific features are scattered over the project. `DataStore`
modules that correspond to specific features are very centralized.

Some order was put with the `Environment` service locator implementation, but this class is aimed to contain the
services linked to the world runtime and is not useful for the UI features.

## **Needs**

- Put order by using a common design and guidelines over the way the features are implemented.
- Organize features in a way that feature toggling is easy as possible.
- Organize features in a way that they can be removed, added or moved to another repository with an atomic operation.
- Making easier to new collaborators to contribute to the project, and new `unity-renderer` forks. If all the features
  are toggleable and modularized, a fork may be just a new configuration of existing features with some new ones added
  on top using the same framework.
- Making easier to composite `unity-renderer` by using external upm packages to inject new features. This enables better
  scalability and opens the possibility of making the Explorer just a collection of toggleable features.

## **Approach**

A single plugin can contain:

- Bridges: The in/out implementations for kernel <> unity messages.
- DataStore: Reactive data that is on the global scope. Data Store is the chosen way when inter-feature communication is
  required.
- HUDs / UI: Any UI elements needed by the feature, commonly implemented by using MVC.
- Feature Services: Finally, the code of the feature that doesn't fit into any other categories.

The idea is to define what a plugin is and define a common plugin container. As all plugins contain Bridges, DataStore
and HUDs, we are going to leverage this knowledge and try to group these in the same container for each feature.

The proposed approach consists of leveraging our
current [PluginSystem](https://github.com/decentraland/unity-renderer/blob/e79be6fbdfa25d3ef15d8cd004943e10676dde59/unity-renderer/Assets/Scripts/MainScripts/DCL/Controllers/FeatureController/PluginSystem.cs#L13)
implementation to identify and properly encapsulate all our features.

![Untitled](resources/ADR-56/Untitled.png)

A single plugin roughly should look like this (pseudo-code):

```csharp
public interface ISomePlugin, IPlugin
{
	SomeHUD someHud { get; }
	SomeBridge someBridge { get; }
	DataStore_Some someDataStore { get; }
	SomeSubsystem subsystem { get; }
}

public class SomePlugin : ISomePlugin
{
	// Members need to be virtual to be able to mock them with Substitute.ForPartsOf()
	public virtual ISomeHUD someHud { get; set; }
	public virtual ISomeBridge someBridge { get; set; }
	public virtual ISomeSubsystem subsystem { get; set; }

	// DataStore doesn't have interfaces because it has stubs, 
	// stubs are objects with mocked data. 
	// Mocked data can be created straight away without the need of mocking.
	public DataStore_Some someDataStore { get; set; }
	private DataStore store;

	// DI and initialization is directly handled in the constructor
	public SomeFeature(DataStore store)
	{
		this.store = store;
		store.RegisterStore<DataStore_Some>();
		subsystem = new SomeSubsystem(this);
		someHud = new SomeHUD(this);
		someBridge = new SomeBridge(this);
	}

	// Enabling and disabling of feature without deallocating resources
	public void Enable() {}
	public void Disable() {}
	
	public void Update() {}
	public void LateUpdate() {}

	public void Dispose()
	{
		subsystem.Dispose();
		someHud.Dispose();
		someBridge.Dispose();
		store.UnregisterStore<DataStore_Some>();
	}
}
```

Let's look at some of the implications:

**`DataStore` is not a collection of static classes anymore**

To give the ownership of the feature to the `IPlugin` implementation, the feature's store is injected to a very simple
service locator. The data service locator is named `DataStore` .

**Bridges are now contained in the feature**

In the current state, all bridges are scattered at the root level of the project hierarchy. This makes it hard to
identify which bridge correspond to which feature, and this issue will get harder the more features are added to the
client.

To fix this design issue, feature specific bridges are contained inside of each `IPlugin` implementation. This will help
to identify which bridges correspond to which feature.

As Bridges are now `MonoBehaviour`, it would be most likely that the code would have to
be`Main.i.gameObject.AddComponent<SomeBridge>()` for the time being. However, the idea is to eventually get rid
of `MonoBehaviour` bridges.

Bridges will be the single source of truth for messages that go and come from Kernel, and will follow the pattern
already designed on
renderer-protocol ([example](https://github.com/decentraland/renderer-protocol/blob/main/src/tutorial.proto)).

**HUDs are now contained in the feature**

This basically means that `HUDController` will be dumped. `HUDs` will be created and implemented through `IPlugin`
classes. The entry points (preview, explorer, etc.) will enable different configurations of plugins instead of HUD
elements.

**Any other feature specific subsystems are contained in the feature**

Right now, a feature can be a collection of subsystems that are either scattered through the project, or unified in the
global `Environment` service locator. With this new design, the `IPlugin` will contain the relevant systems for the
feature, and adding the systems to `Environment` will not be needed anymore.

With this change, adding systems to `Environment` is not strictly needed anymore for initializing a system, as the
system will just be contained within a feature.

**`IPlugin` Instance is injected in the feature subsystems**

As `Environment` is not being used anymore for communication between same-feature systems, the service locator of the
feature scope should be the `IPlugin` implementation itself. All the feature subsystems that look to reference each
other should use the plugin instance as a hub.

> 💡 As a guideline, a `IPlugin` implementation should act as a feature container. It shouldn't have any kind of business logic. This would allow a new-comer (or future you) to easily understand which are the pieces used by the feature, and plug/unplug new pieces as needed.

### The future of `Environment`

The `Environment` class proved to be very useful for keeping a stable state between tests and access to global services,
however, its weakest point arises when we have to create new features, as we can't put all the features subsystems in
the `Environment` contexts.

With this in mind, the `Environment` class may have to be refactored to only contain cross-feature systems, like asset
management, pool management, external services interfaces and so on. All feature specific systems should be moved to
their own `IPlugin` implementations.

### Cross-feature communication

The only means of cross-feature communication is by the usage of the `DataStore` and global services.

![Untitled](resources/ADR-56/Untitled%201.png)

**General guidelines:**

- A feature *shouldn’t know* the direct reference to another feature instance. However it may need or know *types* that
  are defined as part of another plugin. **
- When a plugin needs to affect another plugin, it should be implemented by making the feature modify the other
  feature's data store.
- When a feature needs information about another feature, it should be implemented by reading the other feature's data
  store.

### Folder Structure

Each Plugin will create its own folder in the root folder DCLPlugins.

There is a template structure to follow but each plugin can have its own structure based on the needs

```jsx
PluginNameFolder
...Scripts
...Editor
...ScriptableObjects
...Resources
...Tests
...Visuals
......Prefabs
......Textures
......UI
......Animations
...
```

### Unit Testing Cases

Two scenarios have been considered, a partially mocked feature and just testing a subsystem by itself. Here are some
working examples:

**Partially mocked feature**

```csharp
[Test]
public void IntegrationTestOfFeatureWithSomeMockedParts()
{
    var dataStore = new DataStore();
    var feature = Substitute.ForPartsOf<SomeFeature>(dataStore);
    var mockedHud = Substitute.For<ISomeHUD>();

    feature.Configure().someHud.Returns(mockedHud);
    feature.Enable();

		// Act
    // ...
    // Assert
}
```

**Test single subsystem**

```csharp
[Test]
public void SubsystemTest()
{
    var dataStore = new DataStore();
    var dataStub = new DataStore_Some();
    dataStore.AddStore(dataStub);

    var feature = Substitute.For<ISomeFeature>(dataStore);
    var subsystem = new SomeSubsystem(feature);

		// Act
    // ...
    // Assert
}
```

## **Benefit**

The benefits are already addressed in the needs section, the approach would satisfy the needs.

## **Competition** (alternatives)

No other alternatives were considered.

If nothing is done, there's the risk of inconsistent codebase scaling. More unrelated systems could end up scattered in
the project, and the complexity of contribution may increase and be more costly for newcomers. This would translate to
poor quality and high cost of the improvements we make to the platform in the long term.

## Rollout Plan

- A kick-off PR will adjust the existing `PluginSystem` to the proposed design of this document.
- New contributions are going to be implemented using the current `PluginSystem` if it makes sense.
- The existing systems of the repository will be analyzed and grouped into features over time. Tech debt issues will be
  created to push this forward and they will be implemented gradually.

## **Open Questions**

Q: When I should decide to define a new system as a `IPlugin`? What is a plugin?

A: A plugin should be any system that's big enough to require a Bridge, HUD, or a mix of systems that interact with each
other. Cases of contributions that aren't worthy of being a plugin can include:

- Helper or Utility classes that can be used everywhere but don't need bridges or any complex lifecycle.
- Systems that are only used by a single plugin (hint: put the system inside the plugin).
- Small systems that are better suited as a component of a existing feature. (i.e. a debug system that shows specific
  feedback may go into a `Debug` plugin instead of being a plugin by itself).

## Participants

- Unity Team
