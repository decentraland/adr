---
adr: 167
title: CRDT protocol v1
date: 2022-05-09
status: Living
type: Standards Track
spdx-license: CC0-1.0
authors:
  - leanmendoza
  - menduz
---

## Abstract
This ADR intents to modify ADR-117 serialization, while the ADR-166 intents to modify the ADR-117 CRDT specification.

## Context, Reach & Prioritization

<!--
Discuss and go into detail about the subject in question. Make sure you cover:
- Why is this decision important
- The urgency of the decision
- Datapoints and related background information
- Vocabulary and key terms
-->
After the entity aproach beside the ADR-166, the current serialization and a new operation has been changed.  


## Definition and serialization
The protocol keeps planed, for fast serialization. In this way, the `c++` struct has to be understood as contiguos:

```cpp
enum class CrdtMessageType: uint32_t {
  PUT_COMPONENT = 1,
  DELETE_COMPONENT = 2,
  DELETE_ENTITY = 3
};


struct CrdtMessageHeader {
  uint32_t length;
  CrdtMessageType type;
};

union Entity {
  uint32_t id;
  struct {
    uint16_t version;
    uint16_t number;
  } d;
}

struct PutComponentMessageBody {
  // key
  Entity entity;
  uint32_t componentId;
  // timestamp
  uint32_t lamport_timestamp;

  uint32_t data_length;

  // ... bytes[] with data_length size
};

struct DeleteComponentMessageBody {
  // key
  Entity entity;
  uint32_t componentId;
  // timestamp
  uint32_t lamport_timestamp;
};

struct DeleteEntityMessageBody {
  Entity entity;
};
```

The changes are: 
- `entity` is now an union, but still 32bit number. 
- `timestamp` is now 32bit number instead of 64bit
-  `data_length` is not longer in the `DeleteComponentMessage`

### Entity
Dividing the 32 bit number into two 16 bit numbers: one for `entity-number` and one for `entity-version`. The `entity-version` will be the higher part, so the `entity-number` the lower part:

`[31..16][15..0] = [entity-version][entity-number]`

The functions to compound or uncompound (in typescript):
```ts
const MAX_U16 = 0xffff
const MASK_UPPER_16_ON_32 = 0xff00

function fromEntityId(entityId: number) {
  return {
    number: (entity & MAX_U16) >>> 0,
    version: (((entity & MASK_UPPER_16_ON_32) >> 16) & MAX_U16) >>> 0
  }
}

function toEntityId(
  entityNumber: number,
  entityVersion: number
): Entity {
  return ((entityNumber & MAX_U16) | ((entityVersion & MAX_U16) << 16)) >>> 0
}
```

The limits are imposed by the range of the numbers. Each entity can have up to 65536 versions, and each scene can have up to 65536 simultaneously entities.


## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

## External links

