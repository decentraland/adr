---
layout: adr
adr: 0
title: Badges Service
date: 2026-10-13
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - braianj
---

## Abstract

This ADR defines the Badges Service: the badge catalog moves from compiled source code to PostgreSQL, and badges become data that can be created, validated, published and administered through an API instead of a code change and a deploy per badge. Definitions, revisions and tiers are stored in `badge_definitions`, `badge_revisions` and `badge_tiers`, next to the existing `user_progress` table, which keeps its identities and rows unchanged. A startup selector, `BADGE_CATALOG_SOURCE` (`static`, `shadow`, `database`), moves the API and the processor from the compiled catalog to the database catalog behind a parity check, without a silent fallback. Awards keep flowing from SNS events through SQS into the processor; their reliability guarantees (deduplication, transactional awards, recoverable notifications) are a prerequisite for new automatic mechanisms. Scene badges stay a separate, owner-defined feature with their own tables, merged into user reads. Administrative identity, promotion transport and asset limits are open decisions recorded at the end of this document.

## Context, Reach & Prioritization

Badges reward players for activity in Decentraland: visiting, collecting, creating, socializing, building and attending events. Today every badge is part of the service's source code:

- Identifiers live in the `BadgeId` enum and categories in `BadgeCategory` (`common/src/types/badge-definitions.ts`). Definitions, descriptions, tiers and thresholds live in `common/src/types/badges.ts`; tier names are fixed types in `tiers.ts`.
- `badge-storage` builds an in-memory map from that code at startup. The API and the processor's observers capture the map, or single definitions, when they are constructed.
- Progress is stored in PostgreSQL, table `user_progress`, primary key `(user_address, badge_id)`, including achieved tiers and completion dates.
- Automatic awards come from platform events published to SNS and consumed from SQS by the processor, which dispatches them to twenty observers registered explicitly in code. Granted badges are announced through SNS for notifications.
- Historical and participant imports use `POST /badges/:id/backfill`, with mergers chosen by a switch over badge identifiers and authorized by one shared `API_ADMIN_TOKEN`.
- Textures (one 2D image and three 3D maps per badge or tier) are uploaded to S3 by an interactive CLI that renames files but does not validate format, dimensions or size.
- The public contract (`docs/openapi.yaml`) exposes six fixed tier names: Starter, Bronze, Silver, Gold, Platinum and Diamond.

As a consequence, shipping a badge that reuses an existing mechanism still requires editing an enum, a switch and the catalog, deploying the service and uploading textures with AWS credentials. Event badges also need a dedicated warehouse query, export configuration and scheduled job per badge. Only engineers can create or correct a badge, nothing validates the assets, and there is no way to promote a badge tested in Zone to production together with its exact images. Event and marketing calendars make this the bottleneck for every seasonal badge.

Moving only `badges.ts` into a table is not enough. Identifier validation, backfill routing, observer construction, cached definitions at startup, metrics and the public schemas all depend on the compiled catalog and must change with it.

**Reach.** The `badges` API and processor; Internal Tools as the administrative interface; Data, whose scheduled jobs evaluate event attendance; Platform, which owns deployment, runtime flags, S3/IAM and queues in `definitions` (including the `engagement-workers` runtime that can replace the standalone services); and every client of the public badges API, whose responses must stay compatible.

**Vocabulary:**

- **Badge definition:** the stable identity of a badge (`id`), independent of its texts and rules.
- **Revision:** an immutable, numbered version of a definition's content (name, category, description, progress kind, rule, availability, recurrence, tiers and assets). At most one revision is published per badge.
- **Tier:** one level of a tiered badge, with a stable identifier, an ordered position and a threshold.
- **Catalog source:** where a running service reads the catalog from, selected by `BADGE_CATALOG_SOURCE`.
- **Adapter / evaluator:** tested code that turns a source of evidence (an event type, a warehouse dataset) into progress for every badge that selects it. Administrators choose and parameterize adapters; they never submit code or SQL.
- **Scene badge:** a badge created by the owner of a NAME or LAND and awarded by that owner's authoritative scene server.

## Solution Space Exploration

### Where the catalog lives

**Keep the catalog in code (status quo). Not chosen.** Every new badge keeps requiring an engineering change and a deploy.

**A versioned file (repository or S3). Not chosen.** It removes the enum but not the deploy or the review cycle, has no transactional link with progress, and cannot express drafts, publication or concurrent edits.

**PostgreSQL in the existing badges database. CHOSEN.** It is the database that already holds `user_progress`, so definitions and progress share constraints and transactions. Relational constraints enforce invariants (a published revision belongs to its own badge, tier positions are unique) that a file cannot.

### How services switch to the database catalog

**Switch reads in one deploy. Not chosen.** A mismatch between the seeded rows and the compiled catalog would surface directly to players, and rollback would require a code revert.

**A startup selector with a shadow mode. CHOSEN.** `static` keeps today's behavior, `shadow` compares both catalogs and reports differences while still serving the compiled one, and `database` serves the database catalog. Each environment advances only after parity is observed, and rollback is a configuration change plus a restart. An incompatible database catalog stops the service instead of silently falling back, so a partial switch can never go unnoticed.

### Who administers badges

**An agent-driven workflow (a chat assistant skill). Not chosen.** It does not provide verifiable human identity, per-environment permissions or audit, and it would bypass server-side validation.

**Internal Tools on top of an administrative Badges API. CHOSEN.** The API owns validation, publication, permissions and audit; the interface only calls it. Bypassing the interface never bypasses the rules.

### Who owns badge assets

**A dedicated Lambda that validates and uploads assets. Not chosen.** It splits ownership of a badge revision across two systems and duplicates authorization.

**The Badges service. CHOSEN.** The service authorizes uploads, validates them asynchronously and publishes them to S3 together with the revision that references them.

### How event attendance is evaluated

**One warehouse query and scheduled job per badge (status quo). Not chosen.** Each event badge needs a new data pipeline change.

**Typed attendance rules stored with each revision, evaluated by a generic process. CHOSEN.** A generic scheduled evaluator in the data warehouse reads published rules and submits results through the Badges API. A streaming (SQS) evaluator may follow later with the same rule semantics.

### How scene badges relate to the catalog

**Store scene badges as catalog definitions. Not chosen.** Scene badges are created by land and name owners, use server-assigned identifiers, a different authorization model (signed requests and scene authority) and their own moderation. Mixing them would put untrusted, high-volume owner content into the platform catalog and its validation rules.

**Separate tables, merged at read time. CHOSEN.** Scene badges keep their own `scene_badge_*` tables and are merged into user reads with category `Scene`. The two features share the service, the database and the public read endpoints, but not their write paths.

## Specification

### Data model

The catalog adds three tables to the `badges` PostgreSQL database. `user_progress` and its key `(user_address, badge_id)` are unchanged: no progress row is rewritten, and existing badge and tier identifiers are preserved literally so stored achievements keep resolving.

| Table | Columns and constraints |
| --- | --- |
| `badge_definitions` | `id` primary key, display `position` (unique, positive), nullable `published_revision_id`, nullable `archived_at`, `created_at`. A composite foreign key `(id, published_revision_id)` references `badge_revisions (badge_id, id)`, so a published pointer MUST belong to the same badge. |
| `badge_revisions` | UUID `id`, `badge_id` foreign key, `revision` (positive, unique per badge), `lock_version` for optimistic concurrency, `schema_version`, `state` in `draft`, `published`, `superseded`, name, `category` in Explorer, Collector, Creator, Socializer, Builder, description, `progress_kind` in `single`, `tiered`, JSONB `criteria`, `rule`, `availability` and `recurrence`, `asset_mode`, `asset_base_path`, `created_at`. |
| `badge_tiers` | `revision_id` foreign key, stable `tier_id`, `position` (positive, unique per revision), name, description, JSONB `criteria`, `asset_slot`. Primary key `(revision_id, tier_id)`. |

Timestamps are epoch milliseconds, as in `user_progress`. A revision MUST NOT be published before all of its tier rows exist.

Later deliveries add, at least: an asset manifest per revision and environment; administrative operations with idempotency keys; an append-only audit log; and, for reliable automatic awards, event receipts, award records and an outbox. These are specified in the sections below and are not part of the initial schema.

### Migrations and seed

- Migration sources live in `processor/src/migrations`. The API build copies them, so both services carry the same set. Both run pending migrations at startup, serialized by the advisory lock of `@dcl/pg-component`. A single pre-deployment migration runner is a possible later improvement, not a requirement.
- The initial catalog migration seeds every existing badge from a frozen, deterministic snapshot with `recurrence: none`, `asset_mode: legacy` and the existing asset paths. Seed data MUST NOT be imported from mutable source modules at migration time.
- Applied migrations MUST NOT be edited. While the compiled catalog is still authoritative, a badge added to code also needs a forward migration that adds it to the database catalog, plus an update of the parity fixture.
- Migrations run whenever a service starts, regardless of the selected catalog source. Deploying the schema therefore requires the migration history and DDL permissions of each environment to be verified first.

### Catalog source selector

| `BADGE_CATALOG_SOURCE` | Behavior |
| --- | --- |
| unset or `static` | Serve the compiled catalog. Default. |
| `shadow` | Load and validate the database catalog at startup, log every difference against the compiled catalog, and keep serving the compiled catalog. |
| `database` | Serve the published database catalog. If it is missing or invalid, the service MUST fail to start. There is no fallback to the compiled catalog. |

Any other value MUST fail startup. The catalog is read once per process start; there is no hot reload in this phase.

Validation of the database catalog rejects empty or incomplete snapshots and any published badge whose identifier is not in the compiled catalog. It requires each badge to stay compatible with its evaluator and with stored progress: the same progress kind, criteria, tier identifiers and order, thresholds, evaluator binding and asset paths. Presentation fields (name, description, category and tier descriptions) MAY differ.

Startup order is: database connection and migrations, catalog load and validation, then (in the processor) observer construction and registration, and only then queue consumption. A service whose catalog fails to load MUST NOT consume or delete queue messages. The HTTP server MAY start earlier, but readiness MUST stay false until the catalog is loaded. Components MUST read the catalog through the storage when they need it, not capture it when they are constructed.

The API's backfill route and its validation MUST use the same table of evaluator bindings, so a badge cannot be accepted by one and routed differently by the other.

### Awarding

Automatic awards keep this flow: platform services publish events to SNS, the processor consumes them from SQS, the matching observers compute progress in `user_progress`, and each newly granted badge is published to SNS for notifications. `POST /badges/:id/backfill` remains for historical and participant imports, keeps its current payloads and credentials, and does not send notifications by default.

Known gaps are not solved by the catalog migration and MUST be closed before any new automatic mechanism claims duplicate-safe awards:

- Event addresses MUST be normalized before progress lookups, receipts and idempotency keys, not only when persisted.
- Processing MUST claim an event receipt, update progress, record awards and enqueue notifications in one transaction. An outbox publisher delivers notifications with stable keys and retries independently of progress.
- Each newly earned tier MUST produce its own notification with its own tier name and image. Notification consumers MUST be told before this changes.
- Failed messages MUST NOT be deleted as successes. A dead-letter queue, redrive policy, visibility timeout and alarms MUST be configured before acknowledgement behavior changes, and retries MUST NOT be enabled for additive handlers without deduplication.

Delivery is at least once with deduplication, not exactly once.

### Administrative API

The administrative API is specified here as a contract and is not yet implemented. Each API instance administers only its own environment (`dev` or `prd`). Unknown environment values MUST be rejected, never mapped to production.

Every administrative route MUST verify a human actor's identity and authorize the action for the environment on the server. The shared backfill token MAY remain for machine backfills but MUST NOT authorize administrative routes.

| Area | Contract |
| --- | --- |
| Capabilities | List the supported adapters and their parameters, categories, tier restrictions, attendance options and asset policy. Internal Tools disables anything not listed. |
| Catalog | Paginated list and detail, including drafts, revision history, asset status and archived badges. |
| Drafts | Create a badge identity with its first draft; open a new draft from an existing revision; update a draft with an `If-Match` lock version, rejecting stale edits with `412`. |
| Validation and publication | Validate an exact revision and return field errors as `{path, code, message}`. Publishing revalidates that revision, checks the expected active revision and activates it idempotently. |
| Archive and audit | Archive stops new objectives and awards while existing achievements stay resolvable. Audit history is paginated and append-only. Long operations return `202` with an operation identifier. |

Creation, publication, archive and promotion accept an `Idempotency-Key`: the same payload returns the same result and a different payload returns `409`. Responses never include stack traces.

Rules for definitions:

- New badge identifiers match `^[a-z][a-z0-9_]{0,63}$` and tier identifiers `^[a-z][a-z0-9_-]{0,127}$`. Legacy identifiers are preserved as they are.
- Badge and tier identifiers are immutable after the first publication. Rules, thresholds and tier structure are also fixed after publication; changing them requires a new badge identifier or an explicit progress migration. Presentation changes are allowed in later revisions. Publishing never awards past activity on its own.
- Drafts are never public and never award progress.
- Until the public contract and its clients are updated, publication MUST require the six existing tier names.
- Category `Scene` and scene badge identifiers are reserved for scene badges and MUST be rejected for catalog badges.

Before an editor is enabled, the runtime MUST accept identifiers that are not in the `BadgeId` enum, select backfill mergers by adapter instead of by badge identifier, and refresh the catalog without a restart (proposed target: under 30 seconds). Publication, archive and progress writes MUST share a concurrency boundary, so an award cannot commit against a badge archived in the same instant.

### Assets

Textures stay in S3, owned by the Badges service. The proposed initial policy, to be confirmed with the teams that produce the assets:

| Control | Proposed value |
| --- | --- |
| Files per badge or tier | `2d/normal.png`, `3d/basecolor.png`, `3d/normal.png`, `3d/hrm.png` |
| Format | Decodable, non-animated PNG |
| Dimensions | 2D 256x256; 3D maps 1024x1024 |
| Maximum size | 8 MiB per PNG; 50 MiB per ZIP; 256 MiB extracted; 256 entries; 8 folder levels |

Flow: the API issues a presigned, size-limited upload to private staging for one draft; a worker validates the pinned object asynchronously and records a manifest with hashes, sizes, dimensions and slots; the administrator previews and corrects associations; publication activates the revision together with its exact, immutable assets. Content is validated by decoding it, never by trusting file names, extensions or declared sizes. Ambiguous associations are reported, never resolved silently. An incomplete upload MUST NOT enable a badge. Existing badges keep their current asset paths. Once the service manages a badge's assets, direct writes that skip validation MUST be retired for that badge.

### Promotion between environments

A badge can be published directly in Zone or in production, or promoted from Zone to production. Promotion carries the definition, tiers, rule and the exact verified asset bytes. It MUST revalidate under production policy, require production authorization, preserve identifiers, be idempotent, detect conflicts and be audited. User progress, awards and credentials are never promoted.

### Attendance rules

Attendance requirements are stored as a typed, versioned rule in each revision: a location selector (place, scene, parcel set, event or subevent) with an explicit subevent policy; a UTC time window with an inclusive start and exclusive end; entry only or a minimum duration with defined continuity; client, realm and world constraints; the evidence source and evaluator version; and a deterministic achievement timestamp. Nothing defaults to a particular location, client or realm.

The API validates and publishes rules and exposes them to authorized workers. A generic scheduled evaluator in the data warehouse evaluates them and submits idempotent results with provenance and per-record failures. Warehouse scans MUST NOT run inside browser-facing requests. A preview returns matched counts without granting anything. If a streaming evaluator is added later, the same evidence MUST NOT be counted twice across both paths.

### Integration with scene badges

Scene badges are owned by NAME or LAND holders and awarded by authoritative scene servers. They use server-assigned identifiers prefixed `bdg_`, their own `scene_badge_*` tables and their own routes, and they are merged into `GET /users/:address/badges` and its preview as single-step badges with category `Scene`.

- The two schemas are independent; no foreign key crosses them.
- Migration timestamps from both features may interleave. Migration ordering checks are not enabled, so a lower timestamp applied later still runs, but tests that revert the latest migrations MUST be checked against the combined set.
- Shared read paths MUST read the catalog lazily, so scene badge merging does not reintroduce a catalog captured at construction.
- The administrative route namespace MUST NOT collide. Scene badge moderation already uses `DELETE /admin/badges/:badgeId` and `POST /admin/badges/:badgeId/restore`, so catalog administration needs a distinct namespace or an agreed dispatch rule.

### Public compatibility

Catalog, detail, tier, user badge and preview responses keep their shapes. Archived badges remain resolvable for players who earned them. Custom tier names or counts require updating `docs/openapi.yaml` and verifying its clients first.

### Rollout

1. Platform records, per environment, the runtime flags (`engagementWorkersCutover`, canary), the service and image serving the badges API, the real queue consumer, the migration history, DDL permissions and S3/IAM resources. If `engagement-workers` serves badges, its vendored copy needs its own update and release.
2. Deploy the schema and the selector with `BADGE_CATALOG_SOURCE` unset in every service.
3. In Zone, enable `shadow` only on services that run the full integration and require zero differences on every instance; then enable `database` and compare catalog, categories, tiers and user responses (empty, partial, complete, multi-tier). Rollback is `static` plus a restart, never dropping tables or running down migrations in shared environments.
4. Enable production as a separate operational decision.
5. Deliver the administrative API, dynamic runtime, assets, Internal Tools and promotion, then reliable awarding before enabling new automatic mechanisms.

Once badges with identifiers outside the compiled catalog exist, a build that knows only the compiled catalog is no longer a safe rollback.

### Open decisions

| Decision | Owner |
| --- | --- |
| Runtime evidence per environment (flags, active service, queue consumer, migrations, DDL, S3/IAM) | Platform |
| Administrative identity: signed fetch (ADR-44) with a server-side allowlist, or an authenticated proxy | Badges service owners with Platform |
| Per-environment administrative permissions and who holds them | Badges service owners |
| Promotion transport: service-to-service copy, or an exported bundle with verifiable provenance | Badges service owners with Platform |
| Asset limits and dimensions | Teams that produce badge assets |
| Asset worker deployment and S3/IAM resources | Platform |
| Attendance evidence sources, event/subevent mapping, duration telemetry and evaluator ownership | Data |
| Administrative route namespace shared with scene badges | Badges service owners with scene badges owners |
| Notification changes for multi-tier awards | Badges service owners with notification consumers |
| Recurrence semantics (resetting periods, editions or tiers) | Product |
| Custom tier names and counts | Product with Explorer client owners |

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
