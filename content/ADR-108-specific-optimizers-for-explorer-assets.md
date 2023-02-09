---
adr: 108
date: 2022-09-21
title: Specific optimizers for explorer assets
authors:
  - menduz
status: Living 
type: RFC
spdx-license: CC0-1.0
redirect_from:
  - /rfc/RFC-8
---

# Abstract

The different Decentraland Explorer implementations MAY leverage pre-process of deployed assets to optimize loading time or size. Those assets could be stored separately in different CDNs and not necessarily on the catalyst network. It is mandatory that there are fallbacks to the original assets for compatibility and protocol reasons.

# Introduction

This document illustrates the process of generating Unity Asset bundles based on entity deployments. This specific optimization exists in real life and makes possible loading models and geometries way much more faster than importing the GLTF/GLB and textures from scratch every time.

The process is rather simple, details about the state management and job queue management will be omitted for clarity.

The algorithm works like this:

1. Listen for all deployments and send those to SQS ([decentraland/deployments-to-sqs](https://github.com/decentraland/deployments-to-sqs/))
2. Each element of the queue spawns a AssetBundleConversor job
3. The AssetBundleConversor downloads the whole content of the scene as specified in [ADR-79](/adr/ADR-79)
4. All the downloaded assets are converted, in the case of the AssetBundleConversor GLTF,GLB and Textures are converted
5. Optionally validate conversion with automated visual tests
6. Upload all the assets to a CDN
7. Use the assets from the explorer

Now we are going to double click on some steps of the algorithm

### Listening to deployments

The [decentraland/deployments-to-sqs](https://github.com/decentraland/deployments-to-sqs/) project is used to abstract all the complexity of querying the catalyst nodes. It sends each deployment to SNS/SQS to decouple many conversors(queues) using a single source of deployments (SNS).

### Conversion job & download of the assets

The main responsibilities of the conversion jobs are to download and convert the assets. The recommended result of the conversion is a 1-to-1 map of the source files to the new format files keeping the filenames. The converted assets should be available through a public CDN in the same content CID as the original ones:

Example:
Taking the file `Floor_Grass01.png` mapped to `bafkreid2fuffvxm6w2uimphn4tyxyox3eewt3r67zbrewbdonkjb7bqzx4` from the final URL:

    OriginalUrl (PNG): https://peer.decentraland.org/content/contents/bafkreid2fuffvxm6w2uimphn4tyxyox3eewt3r67zbrewbdonkjb7bqzx4
    ConvertedUrl (Asset bundle): https://converted-asset-bundles.com/bafkreid2fuffvxm6w2uimphn4tyxyox3eewt3r67zbrewbdonkjb7bqzx4

To download the assets of an entity only the entity ID (IPFSv2 CID) and a content server URL are needed. Both provided in the SQS message. The algorithm and endpoints used to download everything are specified in [ADR-79](/adr/ADR-79).

### Using the converted assets from the Explorers

The explorers COULD be configured with a set of optimized asset URLs. The asset resolvers MAY resolve optimized assets and download those versions for performance. If the downloaded assets are not present in the optimized server, the explorers MUST fall back to the original asset in the catalysts' content servers.

It is recommended that the servers can also include a manifesto of all the optimized assets per scene to signal the explorer about eligibility and converted files. This is so to prevent many 404 requests in cases where the scene is not yet converted or not all assets are eligible.

The recommended way to handle this scenario is through a special file including the entity ID of the scene like this: `https://converted-asset-bundles.com/{entityId}.manifest`.

It is also possible and recommended to version the converted assets. That could be given by the configuration URL of the server prepending a `v1` or `v2` to the whole address ([ADR-11](/adr/ADR-11)). Or via not caching the manifest and using it to resolve the final cache friendly URL of the assets.

### Examples of possible optimization scenarios

- Compressing textures to GPU-compressed formats
- Converting models to Unity Asset Bundles
- Automate different level of detail compressions in-server
- Create mip-maps for textures
