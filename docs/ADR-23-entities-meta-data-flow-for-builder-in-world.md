# Entities meta-data flow for builder in-world

## Context and Problem Statement

Builder in-world needs having per-entity meta-data. For now, is believed that this data stores editor specific attributes, like entity names, lock status, and so on.

This data will be replicated across the network, and will take part of the scene state. 

At the moment, the following data is needed per-entity:

- **Entity name:** Entities need a name to display on the builder in-world editor outline and info panel.
- **Lock state:** Entities need a lock state that determines if the entity can be moved around or not.
- **Floor trait:** The floor trait is used to handle floor special cases. i.e.: when a floor is replaced, all the entities that have the floor trait have to be replaced.
- **Smart item data:** Each smart item will need its config data to work properly.

The options have been discussed on the following needs: 
- **Legibility:** The data format has to be legible. We want users to read/write on it.
- **Maintenance cost:** The data has to be friendly with our existing systems to minimize maintenance efforts.
- **Flexibility:** We want to be able to modify the data specifications without invalidating existing scenes.
- **Scalability:** How our entire stack will behave considering we don't have an upper bound on this data size. New data can be added with each builder in-world feature. 
- **Performance:** Network replication and data encoding/decoding shouldn't incur new bottlenecks for the editor use cases. We already agreed that performance shouldn't be an issue because the data update frequency will be low for most use cases, so this is not covered in the discussion. 

## Considered Options

### Option 1: Use many ECS components to deliver the data

With this solution, a new ECS component will be created for each unit of data.

```
{
  entities: [
    {
      id: 'Entity 1',
      components: [
        {
          type: "name",
          value: "Mi nombre"
        },
        {
          type: "floor",
          value: true
        },
        ...
      ]
    }
  ]
```

The following concerns were raised against this approach:
- **Scalability:** The current pipeline for ECS components is prepared for use cases that require a memory footprint and processing that may be too big for a component that's supposed to hold a single field of data. When an component is created from Unity side, a coroutine queue is instantiated (`ComponentUpdateHandler`) and extra hoops are made from our messaging manager. If here we are looking at 50+ components with the sole purpose of holding data this may be too much.


- **Maintenance:** There's a significant maintenance overhead that wouldn't scale very well when talking about 50+ data holding components.

### Option 2: Use a single ECS component with all the needed attributes

To deal with the Option 1 scalability issues, we discussed to just put all the attributes into a single component.

``` 
{
  entities: [
    {
      id: 'Entity 1',
      components: [
        {
          type: "EditMode",
          value: {
            name: "Mi nombre",
            floor: true,
            visible: true  
        }
      ]
    },
  ]
}
```

This enables us to solve Option #1 scalability and maintenance issues.

However, it raised the following concerns:

* **Maintenance costs:** This component model will grow highly over time, and we can't rely on sending the entire payload with each update. This is leading us to devise a mechanism for partial updates, and we will have to implement some kind of sub-component system inside this component.


* **Legibility:** The model will be hard to understand if it grows too much.

### Option 3: Decouple the data model from ECS, send the data through a custom pipeline

We can ignore the component pipeline and have the editor meta-data as a raw dictionary in the stateful scene model.

```
{
  entities: [ ... ]
  editInfo: [
    {
      entity: 'Entity1',
      value: {
        name: "Mi nombre",
        floor: true,
        visible: true
      }
    }
  ]
}
```

* At first glance, we gain **legibility** but we have to know on advance if the data is only to be used by the builder in-world, as this may not be the case. If this is not the case we will have a data-domain mismatch, and this may make **legibility** even worse. 


* Like in option #2, the model will be hard to understand if it grows too much


* How this data is going to travel the pipeline is still yet to be defined, but we could have the same **maintenance cost** issues as option #2, or maybe bigger because we'd need to implement a specific data pipeline for this option.

### Option 4: Use many ECS components but deliver the data on a separate set

To counter the data translation issues posed by the option #3, we can keep the data separated from the rest of the "runtime" components but as ECS components.

```
{
  entities: [
    {
      id: 'Entity 1',
      components: [ ... ],
      non-runtime-components: [
        {
          type: "name",
          value: "Mi nombre"
        },
        {
          type: "floor",
          value: true
        }
      ]
    },
  ]
}
```

Very similar to option #3, but now we use components as option #1. We still have the **scalability** issues of option #1 and the danger of data-domain mismatch of option #3.


## Decision Outcome

- Options #3 and #4 are reliant on having a clear distinction between having an editor mode and runtime mode, and after realizing that the future plans involve having a blurry line between editor and runtime (i.e. users are going to stumble upon globally editable scenes) the options were discarded.


- The benefits behind #2 are linked to implementation details that can be ironed out instead of design benefits, so this option was ultimately discarded as well.


- This leaves us again with the #1 option. After discussing, we agreed that some of the data can be grouped in a way logical to its domain. This grouping would mitigate the data scaling issues while preserving all the benefits. So, the outcome is to choose this option but put more effort on the components design. If we do this right, down the road we could cluster all the data in a few mid-sized components.

### Criteria for components:

Looking at the data based on its use cases and future plans for builder in-world, we can group them like this:

- **Entity name:** This data is used for organizing and visual purposes. Most likely, there will be the need of having *creator*, *creation date*, *description*, et cetera. A single component can hold all this information. 


- **Lock state:** There have been talks about having whitelists or user specific lock status. Right now, the **lock** component will have only a single field, but as this feature gets more complex, all the related data can go into a single component.


- **Floor trait:** The floor trait is used to handle floor special cases. i.e.: when a floor is replaced, all the entities that have the floor trait have to be replaced. At first glance this looks like can belong into a **traits** component. As this data is too specific, we are going to let it be as a single component and try to improve the design if we need more traits or a behaviour pattern emerges.


- **Smart item data:** Each smart item will need its config data to work properly. We already agreed on having the smart items have their own component regardless of the option chosen.


## Participants

- Nico Chamo
- Adrian
- Marcos
- Brian
