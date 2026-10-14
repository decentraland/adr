---
layout: adr
adr: 326
title: Badges Service
date: 2026-10-13
status: Draft
type: Standards Track
spdx-license: CC0-1.0
authors:
  - braianj
---

## Abstract

This ADR defines the Badges Service: the badge catalog moves from compiled source code to PostgreSQL, and badges become data that can be created, validated, published and administered through an API instead of a code change and a deploy per badge. Each badge is one row in `badge_definitions` with its tiers in `badge_tiers`, next to the existing `user_progress` table, which keeps its identities and rows unchanged. The database is the only catalog source: the API and the processor migrate, seed and load the catalog from PostgreSQL at startup, and refuse to start if it is missing or invalid. Parity with the former compiled catalog is proven by tests against a frozen snapshot, not by a runtime switch. Awards keep flowing from SNS events through SQS into the processor; their reliability guarantees (deduplication, transactional awards, recoverable notifications) are a prerequisite for new automatic mechanisms. Scene badges stay a separate, owner-defined feature with their own tables, merged into user reads. Administrative identity, promotion transport and asset limits are open decisions recorded at the end of this document.

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

- **Badge definition:** one badge with its stable identity (`id`) and its current content: name, category, description, progress kind, criteria, evaluator binding and asset path. There are no stored versions of a definition.
- **Draft / published / archived:** a definition is a draft until `published_at` is set, and archived once `archived_at` is set.
- **Tier:** one level of a tiered badge, with a stable identifier, an ordered position and a threshold.
- **Evaluator binding (`rule`):** the record of which existing code computes a badge's progress (its observer events and its backfill merger). It describes code, it is never executed.
- **Adapter / evaluator:** tested code that turns a source of evidence (an event type, a warehouse dataset) into progress for every badge that selects it. Administrators choose and parameterize adapters; they never submit code or SQL.
- **Scene badge:** a badge created by the owner of a NAME or LAND and awarded by that owner's authoritative scene server.

## Solution Space Exploration

### Where the catalog lives

**Keep the catalog in code (status quo). Not chosen.** Every new badge keeps requiring an engineering change and a deploy.

**A versioned file (repository or S3). Not chosen.** It removes the enum but not the deploy or the review cycle, has no transactional link with progress, and cannot express drafts, publication or archiving.

**PostgreSQL in the existing badges database. CHOSEN.** It is the database that already holds `user_progress`, so definitions and progress share constraints and transactions. Relational constraints enforce invariants (tiers belong to an existing badge, positions are unique) that a file cannot.

### How services switch to the database catalog

**A startup selector with a shadow mode (`static`, `shadow`, `database`). Not chosen.** It keeps a second, compiled catalog path alive in every service, adds a per-environment setting that Platform has to manage, and only postpones its own removal. The case it protects against, a database without the catalog, cannot happen: the catalog migration creates and seeds the tables in the same deploy, before the catalog is loaded.

**Read the catalog from the database only, in one deploy. CHOSEN.** The seed is a frozen, deterministic snapshot of the compiled catalog, and tests prove that the catalog built from the seeded rows equals that snapshot before anything is deployed. A missing or invalid catalog stops the service instead of falling back. Rollback is redeploying the previous image: the migration is additive, so a previous build keeps working and ignores the new tables.

### Who administers badges

**An agent-driven workflow (a chat assistant skill). Not chosen.** It does not provide verifiable human identity, per-environment permissions or audit, and it would bypass server-side validation.

**Internal Tools on top of an administrative Badges API. CHOSEN.** The API owns validation, publication, permissions and audit; the interface only calls it. Bypassing the interface never bypasses the rules.

### Who owns badge assets

**A dedicated Lambda that validates and uploads assets. Not chosen.** It splits ownership of a badge across two systems and duplicates authorization.

**The Badges service. CHOSEN.** The service authorizes uploads, validates them asynchronously and publishes them to S3 together with the badge that references them.

### How event attendance is evaluated

**One warehouse query and scheduled job per badge (status quo). Not chosen.** Each event badge needs a new data pipeline change.

**Typed attendance rules stored with each badge, evaluated by a generic process. CHOSEN.** A generic scheduled evaluator in the data warehouse reads published rules and submits results through the Badges API. A streaming (SQS) evaluator may follow later with the same rule semantics.

### How scene badges relate to the catalog

**Store scene badges as catalog definitions. Not chosen.** Scene badges are created by land and name owners, use server-assigned identifiers, a different authorization model (signed requests and scene authority) and their own moderation. Mixing them would put untrusted, high-volume owner content into the platform catalog and its validation rules.

**Separate tables, merged at read time. CHOSEN.** Scene badges keep their own `scene_badge_*` tables and are merged into user reads with category `Scene`. The two features share the service, the database and the public read endpoints, but not their write paths.

## Specification

### Data model

The catalog adds two tables to the `badges` PostgreSQL database. `user_progress` and its key `(user_address, badge_id)` are unchanged: no progress row is rewritten, and existing badge and tier identifiers are preserved literally so stored achievements keep resolving.

| Table | Columns and constraints |
| --- | --- |
| `badge_definitions` | `id` primary key, display `position` (unique, positive), name, `category` in Explorer, Collector, Creator, Socializer, Builder, description, `progress_kind` in `single`, `tiered`, nullable JSONB `criteria`, JSONB `rule` (`{observer, backfill}`), `asset_base_path`, nullable `published_at` and `archived_at`, `created_at`, `updated_at`. |
| `badge_tiers` | `badge_id` foreign key, stable `tier_id`, `position` (positive, unique per badge), name, description, JSONB `criteria`, `asset_slot`. Primary key `(badge_id, tier_id)`. |

Timestamps are `timestamptz`. A badge is visible when `published_at` is set and `archived_at` is not. A badge MUST NOT be published before all of its tier rows exist, and `progress_kind` MUST match whether the badge has tiers.

Editing a published badge changes it in place: there is no stored history of its content. Fields that would invalidate stored progress are therefore fixed after publication (see the rules for definitions below).

Columns are added when a feature uses them, each through its own forward migration, not reserved in advance. Time windows, recurrence, asset modes and optimistic locking for the editor follow this rule. When a second kind of evaluator exists (attendance rules), `rule` gains a `kind` discriminator in the same change, with a forward migration that sets it on existing rows.

Later deliveries add, at least: an asset manifest per badge and environment; administrative operations with idempotency keys; an append-only audit log; and, for reliable automatic awards, event receipts, award records and an outbox. These are specified in the sections below and are not part of the initial schema.

### Migrations and seed

- Migration sources live in `processor/src/migrations`. The API build copies them, so both services carry the same set. Both run pending migrations at startup, serialized by the advisory lock of `@dcl/pg-component`. A single pre-deployment migration runner is a possible later improvement, not a requirement.
- The initial catalog migration seeds every existing badge, published, from a frozen, deterministic snapshot with the existing asset paths. Seed data MUST NOT be imported from mutable source modules at migration time.
- Applied migrations MUST NOT be edited. Until the administrative API exists, a new badge is added with a forward migration; there is no compiled catalog to update.
- Migrations run whenever a service starts, before the catalog is loaded, so a running service never sees the schema without its seed. Deploying the schema requires the migration history and DDL permissions of each environment to be verified first.

### Catalog loading

The database is the only catalog source. There is no setting to choose another source and no compiled catalog to fall back to. If the published catalog is missing or invalid, the service MUST fail to start. The catalog is read once per process start; there is no hot reload in this phase.

Validation of the database catalog rejects empty or incomplete snapshots. Until the runtime prerequisites for the editor (see Administrative API) are delivered, it also rejects any published badge whose identifier is not in the `BadgeId` enum, because observers and backfill mergers are still selected by that enum; that delivery replaces this rule with binding by evaluator. An archived badge is not part of the published catalog and does not make it incomplete. Validation also requires each badge to be structurally consistent (progress kind against tiers, tier identifiers and order, thresholds, asset paths) and its evaluator binding to match the observers and backfill mergers that exist in code.

Parity with the former compiled catalog is a test, not a runtime mode: a frozen fixture records the compiled catalog as it was served, and tests build the catalog from the seeded rows and require it to equal the fixture. The fixture is never regenerated; once the compiled definitions are removed it is the only record of them.

Startup order is: database connection and migrations, catalog load and validation, then (in the processor) observer construction and registration, and only then queue consumption. A service whose catalog fails to load MUST NOT consume or delete queue messages. The HTTP server MAY start earlier, but readiness MUST stay false until the catalog is loaded. Components MUST read the catalog through the storage when they need it, not capture it when they are constructed.

The API's backfill route and its validation MUST use the same table of evaluator bindings, so a badge cannot be accepted by one and routed differently by the other.

### Awarding

Automatic awards keep this flow: platform services publish events to SNS, the processor consumes them from SQS, the matching observers compute progress in `user_progress`, and each newly granted badge is published to SNS for notifications. `POST /badges/:id/backfill` remains for historical and participant imports, keeps its current payloads and credentials, and does not send notifications.

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
| Catalog | Paginated list and detail, including drafts, asset status and archived badges. |
| Drafts and edits | Create a badge as a draft; update a draft or the editable fields of a published badge. Concurrent edits are rejected rather than overwritten. |
| Validation and publication | Validate a badge and return field errors as `{path, code, message}`. Publishing revalidates the badge, sets `published_at` and is idempotent. |
| Archive and audit | Archive stops new objectives and awards while existing achievements stay resolvable. Audit history is paginated and append-only. Long operations return `202` with an operation identifier. |

Creation, publication, archive and promotion accept an `Idempotency-Key`: the same payload returns the same result and a different payload returns `409`. Responses never include stack traces.

Rules for definitions:

- New badge identifiers match `^[a-z][a-z0-9_]{0,63}$` and tier identifiers `^[a-z][a-z0-9_-]{0,127}$`. Legacy identifiers are preserved as they are.
- Badge and tier identifiers are immutable after the first publication. Rules, thresholds and tier structure are also fixed after publication; changing them requires a new badge identifier or an explicit progress migration. Presentation fields (name, description, category, tier descriptions and assets) MAY be edited after publication and apply in place. Publishing never awards past activity on its own.
- Drafts are never public and never award progress.
- Until the public contract and its clients are updated, publication MUST require the six existing tier names.
- Category `Scene` and scene badge identifiers are reserved for scene badges and MUST be rejected for catalog badges.

Before an editor is enabled, the runtime MUST accept identifiers that are not in the `BadgeId` enum, select backfill mergers by adapter instead of by badge identifier, and refresh the catalog without a restart (proposed target: under 30 seconds). Publication, archive and progress writes MUST share a concurrency boundary, so an award cannot commit against a badge archived in the same instant.

### Assets

Textures stay in S3, owned by the Badges service. The proposed initial policy, to be confirmed with the teams that produce the assets:

| Control | Proposed value |
| --- | --- |
| Files per badge or tier | `2d/normal.png`; optionally all of `3d/basecolor.png`, `3d/normal.png`, `3d/hrm.png` |
| Format | Decodable, non-animated PNG |
| Dimensions | 2D 256x256; 3D maps 1024x1024 |
| Maximum size | 8 MiB per PNG; 50 MiB per ZIP; 256 MiB extracted; 256 entries; 8 folder levels |

Every badge or tier MUST have the 2D image. The 3D set is optional and all or nothing: if present it MUST contain `normal`, `hrm` and `basecolor`; if absent, responses MUST NOT contain 3D URLs.

Every existing catalog badge has the 3D set, and the public API serves it today; the database catalog MUST keep serving it unchanged. The 3D maps are not stored as separate paths: they are derived from `asset_base_path` and the tier `asset_slot` by the existing convention (`2d/normal.png`, `3d/{normal,hrm,basecolor}.png`), so a partial set cannot be represented. The first delivery that allows a catalog badge without 3D adds a non-null `has_3d` flag to `badge_definitions` through a forward migration, set to true for existing rows; the flag applies to the badge and all its tiers.

Flow: the API issues a presigned, size-limited upload to private staging for one badge; a worker validates the pinned object asynchronously and records a manifest with hashes, sizes, dimensions and slots; the administrator previews and corrects associations; publication activates the badge together with its exact, immutable assets. Content is validated by decoding it, never by trusting file names, extensions or declared sizes. Ambiguous associations are reported, never resolved silently. An incomplete upload MUST NOT enable a badge. Existing badges keep their current asset paths. Once the service manages a badge's assets, direct writes that skip validation MUST be retired for that badge.

### Promotion between environments

A badge can be published directly in Zone or in production, or promoted from Zone to production. Promotion exports the complete definition (badge row, tiers and rule) and the exact verified asset bytes, and production upserts it by badge identifier. It MUST revalidate under production policy, require production authorization, preserve identifiers, be idempotent by a hash of the exported content, detect conflicts with fields that are fixed after publication, and be audited. User progress, awards and credentials are never promoted.

### Attendance rules

Attendance requirements are stored as a typed rule in each badge: a location selector (place, scene, parcel set, event or subevent) with an explicit subevent policy; a UTC time window with an inclusive start and exclusive end; entry only or a minimum duration with defined continuity; client, realm and world constraints; the evidence source and evaluator version; and a deterministic achievement timestamp. Nothing defaults to a particular location, client or realm.

The API validates and publishes rules and exposes them to authorized workers. A generic scheduled evaluator in the data warehouse evaluates them and submits idempotent results with provenance and per-record failures. Warehouse scans MUST NOT run inside browser-facing requests. A preview returns matched counts without granting anything. If a streaming evaluator is added later, the same evidence MUST NOT be counted twice across both paths.

### Integration with scene badges

Scene badges are in progress in separate pull requests and are not yet on the main branch. They are owned by NAME or LAND holders and awarded by authoritative scene servers. They use server-assigned identifiers prefixed `bdg_`, their own `scene_badge_*` tables and their own routes, and they are merged into `GET /users/:address/badges` and its preview as single-step badges with category `Scene`.

- The two schemas are independent; no foreign key crosses them.
- Migration timestamps MUST follow the order in which migrations reach shared environments. The services do not check migration order at startup, but the `migrate` command does, so the scene badges migration is numbered after the catalog migration and the two features can merge in either order.
- Scene badges serve only their 2D image in their first phase; 3D assets for scene badges follow in a later phase under the same all-or-nothing rule. A badge without 3D MUST be represented the same way by catalog and scene badge responses.
- Shared read paths MUST read the catalog lazily, so scene badge merging does not reintroduce a catalog captured at construction.
- Route namespaces MUST NOT collide. Scene badges add owner routes (`POST /badges`, `PUT /badges/:badgeId`, `DELETE /badges/:badgeId`) and moderation routes (`DELETE /admin/badges/:badgeId`, `POST /admin/badges/:badgeId/restore`), so catalog administration needs a distinct namespace or an agreed dispatch rule. The ban on the shared backfill token for administrative routes applies to scene badge moderation too.

### Public compatibility

Catalog, detail, tier, user badge and preview responses keep their shapes. Archived badges remain resolvable for players who earned them. Custom tier names or counts require updating `docs/openapi.yaml` and verifying its clients first.

### Rollout

1. Platform records, per environment, the runtime flags (`engagementWorkersCutover`, canary), the service and image serving the badges API, the real queue consumer, the migration history, DDL permissions and S3/IAM resources. If `engagement-workers` serves badges, its vendored copy needs its own update and release.
2. Merge only after the parity tests pass against the frozen fixture.
3. Deploy to Zone and compare catalog, categories, tiers and user responses (empty, partial, complete, multi-tier) with the previous release. Rollback is redeploying the previous image, never dropping tables or running down migrations in shared environments.
4. Deploy to production as a separate operational decision, with the same comparison.
5. Deliver the administrative API, dynamic runtime, assets, Internal Tools and promotion, then reliable awarding before enabling new automatic mechanisms.

Once badges with identifiers outside the compiled catalog exist, a build that knows only the compiled catalog is no longer a safe rollback.

### Open decisions

| Decision | Owner |
| --- | --- |
| Runtime evidence per environment (flags, active service, queue consumer, migrations, DDL, S3/IAM) | Platform |
| Administrative identity: signed fetch ([ADR-44](/adr/ADR-44)) with a server-side allowlist, or an authenticated proxy | Badges service owners with Platform |
| Per-environment administrative permissions and who holds them | Badges service owners |
| Promotion transport: service-to-service copy, or an exported bundle with verifiable provenance | Badges service owners with Platform |
| Asset limits and dimensions | Teams that produce badge assets |
| Asset worker deployment and S3/IAM resources | Platform |
| Attendance evidence sources, event/subevent mapping, duration telemetry and evaluator ownership | Data |
| Administrative route namespace shared with scene badges | Badges service owners with scene badges owners |
| Notification changes for multi-tier awards | Badges service owners with notification consumers |
| Recurrence semantics (resetting periods, editions or tiers) | Product |
| Custom tier names and counts | Product with Explorer client owners |
| Response shape for a badge without 3D (`"3d": null` or the field omitted) | Badges service owners with scene badges owners and Explorer client owners |

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
