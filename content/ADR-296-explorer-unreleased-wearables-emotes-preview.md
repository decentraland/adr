---
adr: 296
date: 2026-03-26
title: Explorer unreleased wearables and emotes preview
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - aixaCode
---

## Abstract

This ADR describes the Builder preview feature in the Decentraland Explorer (decentraland/unity-explorer), which enables content creators to test unreleased wearables and emotes before publishing them to the blockchain. This replaces the test collections mechanism described in [ADR-53](/adr/ADR-53) (now deprecated), which relied on query parameters in the old unity-renderer client.

## Context, Reach & Prioritization

The old approach (ADR-53) used query parameters (`WITH_COLLECTIONS`, `BUILDER_SERVER_URL`) to load test collections in the unity-renderer client. Since unity-renderer has been deprecated, a new mechanism was needed for the unity-explorer client.

Unpublished items lack on-chain records, so they cannot be fetched through standard catalog endpoints. The new explorer uses CLI flags and authenticated Builder API requests to resolve these items.

## Specification

### Activation

The feature is activated via CLI flags:

- **`--self-preview-builder-collections`**: Accepts comma-separated Builder collection UUIDs. Fetches both unreleased wearables and emotes from the Builder API using signed requests for authentication.
- **`--self-preview-wearables`**: Accepts comma-separated URNs of published wearables. Fetches from standard Lambda/Catalog endpoints without signing.
- **`--self-preview-emotes`**: Accepts comma-separated URNs of published emotes. Fetches from standard Lambda/Catalog endpoints without signing.

### Authentication

The Builder API requires signed requests. The signing process uses Unix timestamps as temporal nonces. The Explorer combines this timestamp with wallet identity data into a `WebRequestSignInfo` structure, injected as Authorization headers. The Builder API validates signature recency and identity match before returning item metadata.

The URN-based flags (`--self-preview-wearables`, `--self-preview-emotes`) bypass the Builder API entirely and pull from standard Lambda/Catalog endpoints, so no signing is required.

### Wearables Flow

1. The ECS wearables provider is wrapped with `ApplicationParametersWearablesProvider`, which detects the `--self-preview-builder-collections` flag and resolves collection URLs
2. `LoadTrimmedWearablesByParamSystem` performs signed fetches to the Builder API and parses responses as `BuilderLambdaResponse`
3. Assets are treated as raw GLTF files rather than asset bundles
4. `FinalizeRawWearableLoadingSystem` handles finalization of loaded wearables

### Emotes Flow

The emotes flow follows an identical pattern using emote-specific types:

1. `ResolveBuilderEmotePromisesSystem` creates GLTF and audio promises from Builder content
2. Promises are resolved into streamable results for playback

### Testing

To test unreleased items:

1. Upload test assets to Builder collections (wearables and emotes can be in separate collections)
2. Copy the collection UUID(s) from the Builder URL
3. Launch the Explorer with `--self-preview-builder-collections <uuid1>,<uuid2>`
4. Verify items appear in the Backpack, can be equipped/unequipped, and play correctly
5. Confirm items do not persist after relaunching without the flag

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
