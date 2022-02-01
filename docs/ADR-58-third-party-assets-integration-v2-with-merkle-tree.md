# Third Party Collections Registry V2 (Merkle Tree)

## Statement of the problem

The way we thought the [item submission and curation](./ADR-42-third-party-assets-integration.md#third-party-collection-smart-contract-registry) by third party managers and curators respectively does not scale. Managers need to submit all the items with their metadata to the blockchain, and curators need to approve them. Based on Polygon's gas block limit, items can be submitted/curated in batches of ~50. For a collection with 100k items that means that 2k transactions must be done. The process as designed is completely time and money-consuming. By leveraging on the Decentraland catalyst status quo the number of transactions can be reduced to 1.

## Proposed solution

In order to make the whole process scale while keeping decentralization a set of changes to the current proposed solution is needed.

### Third Party Collection Smart Contract Registry updates

#### Contract Implementation

Third party's managers won't need to submit items to the blockchain, that means that it doesn't matter the size of the collection because no transactions is needed. The only action needed from the third party managers perspective is to sign a message with the third party urn, the amount of items slots to be consumed and a random salt of 32 bytes every time they want publish new items. From the curation part, items will be reviewed by curators by just submitting a [merkle tree root](./ADR-55-third-party-curation-with-merkle-tree.md#item-curation) at the third party level to the blockchain along with the messages signed by the third party managers mentioned before.

- Updated methods:

  - _`addThirdParties`_: when a third party is added, it can start with item slots.
  - _`updateThirdParties`_: item slots can be increased if the method is called by a third party aggregator. It must revert if the caller is not allowed.
  - _`buyItemSlots`_: items slots are going to be bought by unit using an [USD/MANA oracle](./ADR-54-oracle-for-mana-pricing.md).

- New methods:

  - _`consumeSlots`_: Single method to process items consuption.
  - _`reviewThirdPartyWithRoot`_: Curators review the third party by submitting a merkle tree root generated with the items' urn and content hash to be reviewed. Optional, this method can receive item slots consumption signatures to review + consume items in one transaction for curators.
  - _`setRules`_: Curators can add rules in order to reject third party collections/items like: `{third-party-urn}:{collection-id}:*` -> reject all the collection's items. **This method is not going to be exposed UI for the time being as third party item rejection granularity has not been defined yet**.

#### Roles

The TPR smart contract supports different roles:

- **Owner**: the address that updates core parts of the smart contract like the accepted token (MANA), the committee smart contract address, the fee collector address, the price in USD for each item _`itemSlotPrice`_), the oracle address, and the initial values for the third parties and their items (approved or rejected).
- **Third party aggregator**: along with the third parties addition. They are going to be able to add item slots to third parties. Useful in case the DAO decides to assign more items to a third party out of charge. For the time being this address will be the Polygon DAO committee multisig.
- **Committee Members (curators)**: the committee members are going to be validated by querying the committee smart contract directly. Committee members can approve/reject third parties and their items. They can also review third parties items with one simple transaction by submitting a merkle tree root and process items consumption signatures from third parties managers.
- **Third Party Managers**: the third party managers are a set of addresses that can add items to the third party record, previously added by someone on the committee, and update the third party and items metadata. Also, they sign messages to consume items. The message and the signature must be submitted by a member of the committee after checking if it is genuine.

#### Third Party Record

```solidity
struct ThirdParty {
        bool isApproved;
        bytes32 root; // new
        uint256 maxItems;
        uint256 consumedSlots; // new
        uint256 registered;
        string metadata;
        string resolver;
        string[] itemIds;
        mapping(bytes32 => uint256) receipts; // new
        mapping(address => bool) managers;
        mapping(string => Item) items;
        mapping(string => bool) rules; // new
    }
```

- _`isApproved`_: whether a third party is approved or not.
- _`root`_: current merkle tree root. This root is going to be used by the Decentraland catalyst to check if an item deployment is valid or not.
- _`maxItems`_: represents the maximum number of items that a third party can have. We call them _item slots_. Item slots can be bought by everyone at any time, on multiple occasions, by using MANA. So, it is not necessary to be a third party manager to buy item slots. Item slots are going to be bought by unit. The price is set in USD dollar defined in the _`itemSlotPrice`_ variable.
- _`consumedSlots`_: the number of items consumed by a third party.
- _`registered`_: simple boolean that helps to check whether a third party has been added or not.
- _`metadata`_: string with the following shape: `type:version:name:description`. i.e: `tp:1:third party 1:the third party 1 description`. We may include collections metadata by changing the metadata version.
- _`resolver`_: string with the third party API resolver. This API will be used for services to get which Decentraland asset should be mapped to which NFT token. _We call Decentraland asset to every asset that is submitted to the Decentraland catalyst_. i.e: `https://api.thirdparty1.com/v1/get-owned-nfts/:owner`
- _`itemIds`_: in order to allow looping through the items added without the need of indexing historic events, we need to keep track of their ids. **IMPORTANT**: Items reviewed by using a merkle tree root, are not going to be submitted to the blockchain.
- _`receipts`_: mapping of item consumptions messages hash. We will use this in order to prevent double-spending them.
- _`managers`_: third party managers.
- _`items`_: third party's items. **IMPORTANT**: Items reviewed by using a merkle tree root, are not going to be submitted to the blockchain.
- _`rules`_: third party's rules. **IMPORTANT**: Rules are not going to be used for the time being. The rejection of third parties and their items are still a pending topic.

A third party record can't be removed but approved/rejected by a committee member.

Third parties can be looped off-chain without the need of indexing historic events.

### Items

Items are encourage to not be submitted to the blockchain in order to reduce the number of transactions. We will keep the old way of submitting them but we may remove it in a near future. The only way available to loop throught the third parties' items is by using the Decentraland catalysts:

```bash
@GET https://peer-lb.decentraland.org/content/entities/currently-pointed/{urnPrefix}

# Fetch
https://peer-lb.decentraland.org/content/entities/currently-pointed/urn:decentraland:polygon:collections-thirdparty:cryptohats

# Response: Item pointers
[
  {
    "pointer": "urn:decentraland:polygon:collections-thirdparty:cryptohats:0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd",
    "entityId": "QmeA8RpAtqU6gCebNaWRXtM9nQs3ugzzbeQm3L7uKrP4Jp"
  },
  {
    "pointer": "urn:decentraland:polygon:collections-thirdparty:cryptohats:0xabcdefghijk",
    "entityId": "QmdajbrYt4pdkkW2R2PcZ8iLz55uzgGceo4hJMCirHEpPK"
  },
  {
    "pointer": "urn:decentraland:polygon:collections-thirdparty:cryptohats:0xlmnopqrst",
    "entityId": "QmXokfUunNwLY9hw7U9x2Q3NJ7VFXt65rVDRGzFzPzEXvX"
  }
]

### Item submission process

#### Builder

// @TODO: How we are going to keep things in the UI, How are we going to store things in the server. Locking collection/items urns. How we are going to use the catalysts to check item statuses. List further improvements

### Item curation process

#### Builder

// @TODO: How are we going to manage curations, limitations (one curation at a time per third party). Usage of the (https://github.com/decentraland/content-hash-tree) to generate the tree. List further improvements

#### Catalyst acceptance criteria

The Decentraland catalysts will use the [merkle-tree-content-hash](https://github.com/decentraland/content-hash-tree) lib in order to validate whether an item deployment is valid or not. Each third party wearable entity deployment must have along with the current data, an `index` and a `proof`:

```typescript
{
    "index": 61575,
    "proof": [
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
        "0x6c764a5d8ded16bf0b04028b5754afbd216b111fa0c9b10f2126ac2e9002e2fa"
    ]
}
```

With the item's index, proof, urn, and content hash, the catalyst can check whether the item is part of the merkle tree submitted to the blockchain. To do that, the catalyst will need to fetch the current third party's root and call the `verifyProof` method as follows:

```typescript
// check whether a deployment is part of the root or not.
const isPartOfTheTree = verifyProof(index, urn, contentHash, proof, root)
```

Check that in order to guaranteed syncing with other catalysts and to validate item deployments, the third party's root needs to be fetched in the block where the deployment happened.

```GraphQL
{
  thirdParties(block:{number : {blockNumber}}) {
    root
  }
}
```

#### Curation tracking

Extending the curation section explaning [here](./ADR-55-third-party-curation-with-merkle-tree.md#item-curation)

Whenever a third party manager wants to publish new items, they need to sign a message with the items' consumption receipt. Every time a curator reviews new items (not applicable for item updates), the receipts are going to be submitted to the blockchain emitting a _`ItemSlotsConsumed`_ event. We will use that event in the third party subgraph in order to track the number of items reviewed by curators. For algorithm-generated collections, we will still submit the original number of items consumed but as the curator will review just a portion of the items, we will need to use a fixed number of items to compute how much we need to pay for that review to the curator. That number must be defined by the DAO.

E.g: If the DAO defines 50 as the number of items to be paid for algorithm-generated collections, the curator will receive a payment of 50 items even if the collection has 100k items' consumptions.

Example of a query

```GraphQL
{
  curations(where:{curator:{address}}) {
   	thirdPartyId
    qty
    receipts {
      qty
    }
  }
}
```

## Participants

- @Mati P.
- @Agus A.
- @Guido
- @Lautaro
- @Nico S.
- @Fernando
- @Nacho
