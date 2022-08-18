# Ropsten To Goerli Migration

## Context and Problem Statement

[Based on the upcoming deprecation of Ropsten testnet](https://blog.ethereum.org/2022/05/30/ropsten-merge-announcement/), we started moving our smart contracts to **Goerli** testnet which is the official Ethereum Foundation testnet.

Every dApps, catalyst, server, and the Explorer must need to use **Goerli** as the primary testnet for `.io`/`.zone` sites. The RPC calls must be changed from `rpc.decentraland.org/ropsten` to `rpc.decentraland.org/goerli`

## Action Plan

### Smart Contracts To Migrate (Ropsten)

The following Smart contracts will be deployed to Goerli:

- MANA: `0x2a8fd99c19271f4f04b1b7b9c4f7cf264b626edb`
- LAND: `0x7a73483784ab79257bb11b96fd62a2c3ae4fb75b`
- ESTATE: `0x124bf28a423b2ca80b3846c3aa0eb944fe7ebb95`
- Marketplace: `0x5424912699dabaa5f2998750c1c66e73d67ad219`
- Bid: `0x250fa138c0a994799c7a49df3097dc71e37b3d6f`
- Dummy Mask Collection: `0x30ae57840b0e9b8ea55334083d53d80b2cfe80e0`
- DCL Name Registrar: `0xeb6f5d94d79f0750781cc962908b161b95192f53`
- DCL Name Controller: `0xd4e92f6ea18412dbae8b2d2b69e498a2d1064fa2`
- NameDenyList: `0x20c6f1e86eba703a14414a0cbc1b55c89dba7a0f`
- Catalyst: `0xadd085f2318e9678bbb18b3e0711328f902b374b`
- POIAllowlist: `0x5DC4a5C214f2161F0D5595a6dDd9352409aE3Ab4`

### Migrated Contracts (Goerli)

- MANA: `0xe7fDae84ACaba2A5Ba817B6E6D8A2d415DBFEdbe`
- LAND: `0x25b6B4bac4aDB582a0ABd475439dA6730777Fbf7`
- ESTATE: `0xC9A46712E6913c24d15b46fF12221a79c4e251DC`
- Marketplace: `0x5d01fbD3E22892be40F69bdAE7Ad921C8cdA2085`
- Bid: `0xd7dC1C183B8fFaED6b7f30fFC616Ff81B66812e5`
- Dummy Mask Collection: `0x1f0880E0b4514DC58e68B9BE91693bFA8C067ac1`
- DCL Name Registrar: `0x6b8da2752827cf926215b43bb8E46Fd7b9dDac35`
- DCL Name Controller: `0x6fF05B6271BBEd8F16a46e6073d27aD94224E0Ac`
- NameDenyList: `0x71c84760Df0537f7Db286274817462Dc2E6C1366`
- Catalyst: `0x380e46851c47B73B6aA9Bea50Cf3B50E2Cf637Cf`
- POIAllowlist: `0xb8c7a7AFd42675ab61F0a3732F8D0491825A933b`

### Subgraph To Migrate (Ropsten)

The following subgraphs will be deprecated soon in favor of the Goerli pair:

- [https://thegraph.com/explorer/subgraph/decentraland/collections-ethereum-ropsten](https://thegraph.com/explorer/subgraph/decentraland/collections-ethereum-ropsten)
- [https://thegraph.com/hosted-service/subgraph/decentraland/marketplace-ropsten](https://thegraph.com/hosted-service/subgraph/decentraland/marketplace-ropsten)
- [https://thegraph.com/explorer/subgraph/decentraland/mana-ethereum-ropsten](https://thegraph.com/explorer/subgraph/decentraland/mana-ethereum-ropsten?selected=logs)
- [https://thegraph.com/hosted-service/subgraph/decentraland/decentraland-lists-ethereum-ropsten](https://thegraph.com/hosted-service/subgraph/decentraland/decentraland-lists-ethereum-ropsten)
- [https://thegraph.com/hosted-service/subgraph/decentraland/blocks-ethereum-ropsten](https://thegraph.com/hosted-service/subgraph/decentraland/blocks-ethereum-ropsten)
- [https://thegraph.com/hosted-service/subgraph/decentraland/land-manager-ropsten](https://thegraph.com/hosted-service/subgraph/decentraland/land-manager-ropsten)

### Migrated Subgraphs (Goerli)

- [https://thegraph.com/hosted-service/subgraph/decentraland/collections-ethereum-goerli](https://thegraph.com/hosted-service/subgraph/decentraland/collections-ethereum-goerli)
- [https://thegraph.com/hosted-service/subgraph/decentraland/marketplace-goerli](https://thegraph.com/hosted-service/subgraph/decentraland/marketplace-goerli)
- [https://thegraph.com/explorer/subgraph/decentraland/mana-ethereum-goerli](https://thegraph.com/hosted-service/subgraph/decentraland/mana-ethereum-goerli)
- [https://thegraph.com/hosted-service/subgraph/decentraland/decentraland-lists-ethereum-goerli](https://thegraph.com/hosted-service/subgraph/decentraland/decentraland-lists-ethereum-goerli) ([Catalysts](https://www.notion.so/Migrated-Catalysts-List-5aa652f7683c4cf5be8c54b82358ac68)) ([POIs](https://www.notion.so/Migrated-POIs-9cb4e930950c473d9408e9d1df3328c7))
- [https://thegraph.com/hosted-service/subgraph/decentraland/blocks-ethereum-goerli](https://thegraph.com/hosted-service/subgraph/decentraland/blocks-ethereum-goerli)
- [https://thegraph.com/hosted-service/subgraph/decentraland/land-manager-goerli](https://thegraph.com/hosted-service/subgraph/decentraland/land-manager-goerli)

Also, the servers, the catalyst, and the exlporer have been using the new subgraph and supporting Goerli.

#### PRS

## Dapps

PRs to start using Goerli in the different dapps:

1. Builder (Requires 2 & 3)
   1. https://github.com/decentraland/builder/pull/2195
   2. https://github.com/decentraland/builder/pull/2237
2. Builder Server - https://github.com/decentraland/builder-server/pull/570
3. Atlas Server - https://github.com/decentraland/atlas-server/pull/63
4. Definitions - https://github.com/decentraland/definitions/pull/65
5. Marketplace (Requires 6 & 3) - https://github.com/decentraland/marketplace/pull/759
6. NFT Server (Requires 4) - https://github.com/decentraland/nft-server/pull/121
7. Explorer-Website - https://github.com/decentraland/explorer-website/pull/260
   1. Requires https://github.com/decentraland/kernel/pull/382
   2. Requires https://github.com/decentraland/unity-renderer/pull/2451

## Catalysts

- [x] catalyst
- [x] catalyst-api-specs (no changes required)
- [x] @dcl/catalyst-contracts
- [x] @dcl/content-validator
- [x] @dcl/crypto
- [x] @dcl/hashing (no changes required)
- [x] @dcl/schemas
- [x] @dcl/snapshots-fetcher
- [x] @dcl/urn-resolver
- [x] eth-connect (no changes required)
- [x] @dcl/content-hash-tree (no changes required)
- [x] @dcl/catalyst-storage (no changes required)
- [x] lighthouse (not worth doing the changes)
- [x] explorer-bff
- [x] catalyst-owner
- [x] catalyst-monitor
- [x] catalyst-client

PRs for adding support for Goerli:

`@dcl/catalyst-contracts` https://github.com/decentraland/catalyst-contracts/pull/5 [MERGED]

`@dcl/explorer-bff` https://github.com/decentraland/explorer-bff/pull/129 [MERGED]

`@dcl/urn-resolver` https://github.com/decentraland/urn-resolver/pull/155 [MERGED]

`@dcl/common-schemas` https://github.com/decentraland/common-schemas/pull/110 [MERGED]

`@dcl/catalyst-api-specs` https://github.com/decentraland/catalyst-api-specs/pull/47 [CLOSED]

`@dcl/content-validator` https://github.com/decentraland/content-validator/pull/105 [CLOSED]

`catalyst` https://github.com/decentraland/catalyst/pull/1203 [MERGED]

`lighthouse` https://github.com/decentraland/lighthouse/pull/33 [CLOSED]

`catalyst-owner` https://github.com/decentraland/catalyst-owner/pull/157 [MERGED]

`catalyst-monitor` https://github.com/decentraland/catalyst-monitor/pull/27 [MERGED]

`catalyst-client` https://github.com/decentraland/catalyst-client/pull/258 [MERGED]

[Catalyst network migration](https://www.notion.so/Catalyst-network-migration-75f74a63f064438db6e5ebfece9252f4)

The following PRs will remove Ropsten support:

`@dcl/common-schemas` https://github.com/decentraland/common-schemas/pull/120 [MERGED]

`@dcl/catalyst-contracts` https://github.com/decentraland/catalyst-contracts/pull/8 [MERGED]

`@dcl/catalyst-client` https://github.com/decentraland/catalyst-client/pull/265 [MERGED]

`@dcl/urn-resolver` https://github.com/decentraland/urn-resolver/pull/159 [MERGED]

`@dcl/catalyst-contracts` https://github.com/decentraland/catalyst-contracts/pull/8 [MERGED]

`@dcl/catalyst-api-specs` https://github.com/decentraland/catalyst-api-specs/pull/55 [MERGED]

`@dcl/content-validator` https://github.com/decentraland/content-validator/pull/114 [MERGED]

`catalyst` https://github.com/decentraland/catalyst/pull/1232 [MERGED]

`catalyst-client` https://github.com/decentraland/catalyst-client/pull/265 [MERGED]

## Kernel

- https://github.com/decentraland/kernel/pull/382
-

## SDK

CLI & Linker Dapp

[https://github.com/decentraland/cli/pull/772](https://github.com/decentraland/cli/pull/772)

[https://github.com/decentraland/linker-dapp/pull/11/files](https://github.com/decentraland/linker-dapp/pull/11/files) [MERGED]

## Explorer

- https://github.com/decentraland/unity-renderer
  - [https://github.com/decentraland/unity-renderer/search?q=ropsten](https://github.com/decentraland/unity-renderer/search?q=ropsten)
    - Modify network selector and drop ropsten ✅
    - Update subgraphs URLs ✅
    - https://github.com/decentraland/unity-renderer/pull/2451
  - We have important test-scenes deployed in ropsten
    - We use them for testing several client features manually before every release we publish in production
    - Before finishing the migration let’s make sure we can keep accessing those scenes, from `NETWORK=goerli`
    - Coords of every important test scene deployed in ropsten to be migrated
      - 64, -65 ✅
      - 66,-64 ✅
      - 67, -65 ✅
      - 65, -60 ✅
      - 63, -69 ✅
      - 61, -69 ✅
      - 61, -67 ✅
      - 61, -68 ✅
      - 59, -67 ✅
      - 59, -69 ✅
      - 60, -71 ✅
      - 58, -71 ✅
      - 58, -70 ✅
      - 56, -71 ✅
      - 55, -71 ✅
      - 55, -70 ✅
      - 54, -71 ✅
      - 53, -71 ✅
      - 53, -70 ✅
      - 55, -69 ✅
      - 55, -68 ✅

## Deadline

    ADR76_DEADLINE: 2022-10-05T00:00:00Z
    Unix Timestamp: 1664928000

## Status

Final

## Consequences

Scenes deployed to ropsten has been migrated to Goerli and no data/scenes has been lost. The new testnet is Goerli.

## Participants

- @nando
- @aga
- @matipentreath
- @marianogoldman
- @gon
- @mendez
- @ajimenez
- @nacho
