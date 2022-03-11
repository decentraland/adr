# Merkle proofed entities

## Context and Problem Statement

The Third Party Wearables initiative had the requirement of being able to publish collections containing a big amount of wearables.
This big amount of wearables would require multiple transactions to be sent and approved, incurring a high cost in gas and in difficult UX experience.

Taking in consideration this requirement, a new solution came up, described in the ADR-58 in where we will be able to publish collections containing a huge amount wearables with
a single transaction using a Merkle Tree that will serve as proof for the wearable's metadata and contents to be uploaded into the Catalysts.

These ADR describes a broader solution where all entities deployed to the Catalysts could be verified using a Merkle Tree.

## Proposed solution

In order to avoid changing the entity structure, the proposed solution will leverage the entities' metadata by including a new property, `merkleProof`, that will contain everything
needed to verify the entity against a Merkle Tree.

The `merkleProof` property will be an object with the following schema:

```json
{
  "type": "object",
  "properties": {
    "proof": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "index": {
      "type": "number"
    },
    "hashingKeys": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "treeHashingMethod": {
      "type": "string"
    },
    "entityHashingMethod": {
      "type": "string"
    },
    "entityHash": {
      "type": "string"
    }
  }
}
```

Where `proof` is the array of hashes of nodes needed for the verification, `index` is the index of the entity in the Merkle Tree, `hashingKeys` is the array of keys of the entity metadata that
will be used when computing the hash of the entity, and `treeHashingMethod` is the hashing method used to build the Merkle Tree.

The `hashingKeys` property exists with the sole purpose of making this solution more flexible, allowing the entity metadata to change while being strict on the required properties when validating the hash.
The property works by **whitelisting the keys at root level** that will be included in the object to be hashed.

> :warning: **Keys order**: The hashingKeys will determine the order of the keys on the object to be hashed. Changing the order will result in a different hash.

The `entityHashingMethod` will determine the algorithm the entity will be hashed with and the `entityHash` is a pre-computed hash of the entity that will be used as a previous check against the
entity hashing procedure before verifying the entity against the Merkle Tree.

Example of a Wearable entity metadata:

```typescript
{
  id: "urn:decentraland:off-chain:base-avatars:aviatorstyle",
  name: "Aviator Style",
  description: "aDescription",
  image: "image.png",
  thumbnail: "thumbnail.png",
  collectionAddress: "0x06012c8cf97bead5deae237070f9587f8e7a266d",
  rarity: "unique",
  data: {
    tags: ["male", "man", "base-wearable"],
    category: "eyewear",
    replaces: [],
    hides: [],
    representations: [
      {
        bodyShapes: ["urn:decentraland:off-chain:base-avatars:BaseMale"],
        mainFile: "M_Eyewear_AviatorStyle.glb",
        overrideReplaces: [],
        overrideHides: [],
        contents: ["M_Eyewear_AviatorStyle.glb"],
      },
    ],
  },
  i18n: [{ code: "en", text: "Aviator Style" }],
  createdAt: 1646935739,
  updatedAt: 1646935739,
  metrics: {
    triangles: 0,
    materials: 0,
    meshes: 0,
    bodies: 0,
    entities: 0,
    textures: 0,
  },
}
```

Example of a Third Party wearable entity metadata with a merkleProof:

```typescript
{
  id: "urn:decentraland:off-chain:base-avatars:aviatorstyle",
  name: "Aviator Style",
  description: "aDescription",
  image: "image.png",
  thumbnail: "thumbnail.png",
  data: {
    tags: ["male", "man", "base-wearable"],
    category: "eyewear",
    replaces: [],
    hides: [],
    representations: [
      {
        bodyShapes: ["urn:decentraland:off-chain:base-avatars:BaseMale"],
        mainFile: "M_Eyewear_AviatorStyle.glb",
        overrideReplaces: [],
        overrideHides: [],
        contents: ["M_Eyewear_AviatorStyle.glb"],
      },
    ],
  },
  i18n: [{ code: "en", text: "Aviator Style" }],
  createdAt: 1646935739,
  updatedAt: 1646935739,
  metrics: {
    triangles: 0,
    materials: 0,
    meshes: 0,
    bodies: 0,
    entities: 0,
    textures: 0,
  },
  merkleProof: {
    index: 61575,
    proof: [
      "0xc8ae2407cffddd38e3bcb6c6f021c9e7ac21fcc60be44e76e4afcb34f637d562",
      "0x16123d205a70cdeff7643de64cdc69a0517335d9c843479e083fd444ea823172",
      "0x1fbe73f1e71f11fb4e88de5404f3177673bdfc89e93d9a496849b4ed32c9b04f",
      "0xed60c527e6774dbf6750f7e28dbf93c25a22660085f709c3a0a772606768fd91",
      "0x7aff1c982d6a98544c126a0676ac98102533072b6c4506f31b413757e38f4c30",
      "0x5f5170cdf5fdd7bb25c225d08b48361e41f05477880812f7f5954e75daa6c667",
      "0x08ae25d236fa4105b2c5136938bc42f55d339f8e4d9feb776799681b8a8a48e7",
      "0xadfcc425df780be50983856c7de4d405a3ec054b74020628a9d13fdbaff35df7",
      "0xda4ee1c4148a25eefbef12a92cc6a754c6312c1ff15c059f46e049ca4e5ca43b",
      "0x98c363c32c7b1d7914332efaa19ad2bee7e110d79d7690650dbe7ce8ba1002a2",
      "0x0bd810301fbafeb4848f7b60a378c9017a452286836d19a108812682edf8a12a",
      "0x1533c6b3879f90b92fc97ec9a1db86f201623481b1e0dc0eefa387584c5d93da",
      "0x31c2c3dbf88646a964edd88edb864b536182619a02905eaac2a00b0c5a6ae207",
      "0xc2088dbbecba4f7dd06c689b7c1a1e6a822d20d4665b2f9353715fc3a5f0d588",
      "0x9e191109e34d166ac72033dce274a82c488721a274087ae97b62c9a51944e86f",
      "0x5ff2905107fe4cce21c93504414d9548f311cd27efe5696c0e03acc059d2e445",
      "0x6c764a5d8ded16bf0b04028b5754afbd216b111fa0c9b10f2126ac2e9002e2fa",
    ],
    hashingKeys: [
      "id",
      "name",
      "description",
      "image",
      "thumbnail",
      "data",
      "i18n",
      "createdAt",
      "updatedAt",
      "metrics",
    ],
    treeHashingMethod: "sha256",
    entityHashingMethod: "IPFS",
    entityHash: "bafkreifstqrxylmy6dwtw64ieyrgzv2sxrhh7awzb52bwn66utuo7327ae",
  },
}
```

### Proof generation

The following is an example on how to generate a Merkle proof for a given entity.

```typescript
function ipfsHash(metadata, keys): string {
  return hash(JSON.stringify(pick(metadata, keys)));
}

// Using the entity, the keys to be hashed and the other node hashes, build the merkle proof for the entity and return a new proofed entity.
function buildEntityMetadataWithMerkleProof(baseEntity, keys, otherNodeHashes) {
  const entityHash = ipfsHash(baseEntity, keys);
  const { proof, index } = calculateProof(entityHash, otherNodeHashes);
  return {
    ...baseEntity,
    merkleRoot: {
      index,
      proof,
      hashingKeys: keys,
      treeHashingMethod: "sha256",
      entityHashingMethod: "IPFS",
      entityHash,
    },
  };
}
```

### Verification

The following is an example on how to validate a Merkle proof for a given entity.

```typescript
function verifyHash(metadata, requiredKeys) {
  // The keys used to create the hash MUST be present if they're required.
  assert(
    requiredKeys.every((key) => metadata.merkleRoot.hashingKeys.includes(key))
  );
  const generatedCrcHash = ipfsHash(metadata, metadata.merkleRoot.hashingKeys);
  // The hash provided in the merkleProof for the entity MUST match the hash generated by the validator.
  assert(metadata.merkleRoot.entityHash === generatedCrcHash);
  // Based on the metadata.id, the merkle root is obtained from a trusted source i.e: the graph, or a smart contract directly
  const merkleRoot = getMerkleRoot(metadata.id);
  // Verify if the entity belongs to the Merkle Tree.
  asset(
    isProofValid(
      merkleRoot,
      metadata.entityHash,
      metadata.treeHashingMethod,
      metadata.merkleRoot.proof,
      metadata.merkleRoot.index
    )
  );
}
```

## Participants

- @menduz
- @guidota
- @nachomazzara
- @lpetaccio
