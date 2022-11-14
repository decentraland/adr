---
adr: 123
title: Schema and serialization of SDK components
date: 2022-05-09
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - leanmendoza
  - menduz
---

## Abstract

This document presents the definition and serialization of SDK components for the Decentraland protocol. The schema and serialization to be used are Protocol Buffers and the source of truth for the components live in the [decentraland/protocol](https://github.com/decentraland/protocol) repository. This standard is valid from SDK7 onwards, the former `DecentralandInterface`-based serialization is deprecated with a sunset date TBD.

## Context, Reach & Prioritization

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->

As of SDK6 components are serialized using JSON and JSON envelopes (JSON serialized inside JSON strings). That worked well for a small scale with few entities and simple scenes. But the performance limitations of using JSON play against the potential of the platform.

The general approach was to use JSON, now there are some components that are known for sure that need a special serialization to optimize speed: Transform is a clear example. Since transform can be mapped 1-1 with a memory struct of floats, it makes sense that the serialization of the component is only a copy of the memory of the struct.

That may not be the case for components with complex structures, like Material, which has strings on it and other resources (or sub structs) like textures. The memory mapping is non viable.

For this problem, there are some options that need to be considered and evaluated:

- Not all components may have the same serialization mechanism, it will enable some components to have their optimizations like the Transform component.
- If we open the door to custom serialization mechanisms, then the implementation may become too complex and susceptible to segmentation in implementations, which may be a risk in the long run, considering maintenance costs.
- Scene creators may define their own components. That assumption may lead us to a schema-based serialization and versioning, backwards compatibility MUST be a decision factor.
- flat/protocol buffers may be used as a schema-based serialization, but it incurs in operative costs and external tooling.
- Implementation of serializers/deserializers MUST take into consideration performance constraints in C# and TS (speed and memory allocations)

## Solution Space Exploration

This pair, definitions and serialization, can live together from a parent definition, for example, a schema that auto generates both, the serialization and its type.
A point to be remembered is each component can have its own serialization, even a JSON one.

The proposal option are:

- Custom runtime schema-based serialization
- Protocol Buffer https://developers.google.com/protocol-buffers
- Flat Buffer https://google.github.io/flatbuffers/

### Custom runtime schema-based serialization

Using a JSON schema that generate a versionable append only component

#### Primitive types

Its representation is a standard and the CPU understands it.

- Int8 signed (big or little-endian)
- Int16 signed (big or little-endian)
- Int32 signed (big or little-endian)
- Int64 signed (big or little-endian)
- Float32 (IEEE-754 single-precision floating-point)
- Float64 (IEEE-754 double-precision floating point)

#### Compound only from primitives and fixed types

Here we can introduce the recursive condition, all primitives types are fixed in their lengths, but if we have a struct with all fixed length fields, the struct is also a fixed length one.

- Fixed struct (by total length)
- Fixed length array (by total elements \* element length)
  - The type of item can be any type, even an array

#### Other supported types (non-fixed-length)

- Non-fixed-length arrays: they write the count of items
  - The type of item can be any type, even an array
- String with UTF8 encode

**If a component is a fixed-length struct, it can be mapped 1-1 in memory.**

#### Approach and examples

##### Directory tree

The components are placed in a directory `components` and each component has its own directory named in pascal case e.g.`BoxShape`. In the component directory, there will be the version of the component:

```
components
├── Transform
│   └── v1.json
└── BoxShape
    ├── v1.json
    └── v2.json
```

##### Maintenance (strict similar)

The only maintenance rule is each future version has to contain the previous one. We could add a field at the end of the root struct, but we can not remove one. If we wish to support optional fields, we can create a new type that stores the state of existence of the mentioned field. Optional types break the fixed-length and non-fixed-length components cannot be optimally copied to the struct in the language that be able to do it.

We neither can modify a child struct.

> _What about if a fixed-length struct in `v1.json` mutates to a non-fixed length in `v2.json`?_
> Well, the first part of `v2.json` is `v1.json` and we append fields at the end. With this rule, the first part of `v2.json` is a fixed-length one.

**Example:**

1. We have a flag in a BoxShape called `isTriggered` that indicates if a BoxShape was clicked.
2. This flag was introduced in `components/BoxShape/v1.json`, at the begging of its life ECS 7.0.0.
3. In ECS 7.3.0 we want to add the feature that indicates with what button was clicked.
4. It sounds seductive to change the `isTriggered` from a `boolean` to a `struct` that has the flag and the button field. This MUST NOT be allowed.
5. Instead, we add a field at the end with `isTriggeredV2` or a `triggeredButton`. In this case, we'll create `isTriggeredV2` as a struct with two fields: `flag: boolean` and `button: int32`.

So far if the Renderer sends a BoxShapeV2 to a scene, the scene will be able to read it, no matter if the scene was compiled with ECS 7.0.0 or ECS 7.3.0. The same occurs on the opposite side if the renderer has the implementation of BoxShapeV2 as the last updated version also can get a BoxShapeV1 from the ECS 7.0.0 scene.

##### Code generation

Transform component:

```json
{
  "schema": {
    "type": "struct",
    "fields": {
      "position": {
        "type": "struct",
        "fields": {
          "x": { "type": "float32" },
          "y": { "type": "float32" },
          "z": { "type": "float32" }
        }
      },
      "rotation": {
        "type": "struct",
        "fields": {
          "x": { "type": "float32" },
          "y": { "type": "float32" },
          "z": { "type": "float32" },
          "w": { "type": "float32" }
        }
      },
      "scale": {
        "type": "struct",
        "fields": {
          "x": { "type": "float32" },
          "y": { "type": "float32" },
          "z": { "type": "float32" }
        }
      }
    }
  },
  "metadata": {
    "componentId": 1
  }
}
```

## Research of existing solutions

To give a real comparison of these approaches, they were tested two recurrent components: Material and Transform. Material is a full optional field component and Transform is a component that probably never changes and it'll be sent a lot.

The scenario was:

- Test were running in their typescript version (it'll be where the code of scene is executed)
- The number chosen was arbitrary and bigger enough for the test.
- The based code is https://github.com/decentraland/ecs/tree/1c4bb4c9fbacf9b673790ed3dcaa5b9d66a25fe1

## Results

https://docs.google.com/spreadsheets/d/1RGFkudVUMlOkNaQZFYAr0qEvVlrULmWp_F1fGBw0pwM/edit?usp=sharing

<table>
  <thead>
    <tr><th></th><th>Serialization of 12,000 full filled materials</th><th>Serialization of 12,000 empty materials</th></tr>
  </thead>
  <tbody>
    <tr><td>Type of serialization</td><td>Time [ms]</td><td>Size [KB]</td></tr>
    <tr><td>EcsType</td><td>54.63</td><td>2784</td></tr>
    <tr><td>EcsType with optional</td><td>92.17</td><td>2592</td></tr>
    <tr><td>FlatBuffer</td><td>88.44</td><td>12288</td></tr>
    <tr><td>Protocol Buffer</td><td>55.23</td><td>2988</td></tr>
  </tbody>
</table>
<table>
  <thead>
    <tr><th></th><th>Deserialization of 12,000 full-filled materials</th></tr>
  </thead>
  <tbody>
    <tr><td>Type of serialization</td><td>Time [ms]</td></tr>
    <tr><td>EcsType</td><td>150.26</td></tr>
    <tr><td>EcsType with optional</td><td>134.78</td></tr>
    <tr><td>FlatBuffer</td><td>185.66</td></tr>
    <tr><td>Protocol Buffer</td><td>65.14</td></tr>
  </tbody>
</table>
<table>
  <thead>
    <tr><th></th><th>Serialization of 12,000  Transforms</th></tr>
  </thead>
  <tbody>
    <tr><td>Type of serialization</td><td>Time [ms]</td></tr>
    <tr><td>EcsType (raw)</td><td>5.57</td></tr>
    <tr><td>FlatBuffer</td><td>8552.9</td></tr>
    <tr><td>Protocol Buffer</td><td>99.52</td></tr>
    <tr><td></td><td></td></tr>
    <tr><td></td><td>Deserialization of 12,000  Transform</td></tr>
    <tr><td>Type of serialization</td><td>Time [ms]</td></tr>
    <tr><td>EcsType (raw)</td><td>14.6</td></tr>
    <tr><td>FlatBuffer</td><td>37.45</td></tr>
    <tr><td>Protocol Buffer</td><td>16.49</td></tr>
  </tbody>
</table>

<figure>
<img alt="Serialization of materials" src="resources/ADR-123/chart1.png"/>
</figure>
<figure>
<img alt="Serialization of transforms" src="resources/ADR-123/chart2.png"/>
</figure>
<figure>
<img alt="Serialization size of materials" src="resources/ADR-123/chart3.png"/>
</figure>

## Short analysis

Flatbuffer will be discarded in this analysis because it seems to be not compatible with having an external byte builder buffer, its optimization is more oriented to a C++ implementation and an ecosystem with all Flattbuffer. Another inconvenience is its code-generator for typescript, it uses classes and these would introduce extra retyping work, ECS 7.0.0 is a strictly data-oriented paradigm.

Protobuffer demonstrated a powerful performance in complex types, and raw [EcsType](https://github.com/decentraland/ecs/blob/1c4bb4c9fbacf9b673790ed3dcaa5b9d66a25fe1/src/built-in-types/EcsType.ts) is in the same level, but for the Transform case, raw is around 20x faster for serialization.

For the maintenance, Protobuffer has a clear advantage. Since all their fields are naturally optional, the messages can be changed completely. EcsType approach doesn't have, and for each version it'd be necessary to send the previous data.

## Conclusion

- For fast serialization and immutable & fixed-length types, the best option is to serialize directly in memory (like the Transform component).
- For the rest of the components, Protocol Buffer seems to be the best option.

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## External links

- https://github.com/decentraland/sdk/issues/241 initial research
- https://github.com/decentraland/sdk/issues/254 discussion
