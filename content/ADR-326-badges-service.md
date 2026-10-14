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

This ADR defines the Badges Service: the badge catalog moves from compiled source code to the service's database, so badges become data that can be created, validated, published and administered through an API instead of a code change and a deploy per badge. Each badge is stored once, with its tiers, next to the existing player progress, which keeps its identities and records unchanged. The database is the only catalog source: services load it at startup and refuse to start if it is missing or invalid. Parity with the former compiled catalog is proven by tests, not by a runtime switch. Every badge has a 2D image; the 3D set becomes optional and is all or nothing. Awards keep flowing from platform events through a queue into the processor, and their reliability guarantees are a prerequisite for new automatic mechanisms. Scene badges stay a separate, owner-defined feature merged into player reads. Administrative identity, promotion transport and asset limits are open decisions listed at the end.

## Context, Reach & Prioritization

Badges reward players for activity in Decentraland: visiting, collecting, creating, socializing, building and attending events. Today every badge is part of the service's source code:

- Badge identifiers, categories, definitions, descriptions, tiers and thresholds are compiled into the service. Tier names are a fixed set of six.
- The API and the processor build an in-memory catalog from that code at startup, and some components keep a copy captured when they are constructed.
- Player progress is stored in the service's database, keyed by player address and badge, including achieved tiers and completion dates.
- Automatic awards come from platform events published to a topic and consumed from a queue by the processor, which dispatches them to observers registered in code. Granted badges are announced for notifications.
- Historical and participant imports use a backfill endpoint whose import logic is chosen per badge identifier and authorized by a single shared token.
- Textures (a 2D image and three 3D maps per badge or tier) are uploaded to storage by an interactive tool that renames files but does not validate format, dimensions or size. Every badge has had the full 3D set so far.
- The public contract exposes the six fixed tier names, and the 3D set as always present.

As a consequence, shipping a badge that reuses an existing mechanism still requires code changes, a deploy and a manual texture upload with cloud credentials. Event badges also need a dedicated warehouse query and scheduled job per badge. Only engineers can create or correct a badge, nothing validates the assets, and there is no way to promote a badge tested in Zone to production together with its exact images. Event and marketing calendars make this the bottleneck for every seasonal badge.

Moving only the definitions into the database is not enough. Identifier validation, backfill routing, observer construction, catalogs captured at startup, metrics and the public schemas all depend on the compiled catalog and must change with it.

**Reach.** The badges API and processor; Internal Tools as the administrative interface; Data, whose scheduled jobs evaluate event attendance; Platform, which owns deployment, runtime flags, storage permissions and queues (including the shared workers runtime that can replace the standalone services); and every client of the public badges API, whose responses must stay compatible.

**Vocabulary:**

- **Badge definition:** one badge, with its stable identity and its current content: name, category, description, progress kind, criteria, evaluator binding and assets. There are no stored versions of a definition.
- **Draft / published / archived:** a definition is a draft until it is published, and archived once it is retired. Archived badges stay resolvable for players who earned them.
- **Tier:** one level of a tiered badge, with a stable identifier, an ordered position and a threshold.
- **Evaluator binding:** the record of which existing code computes a badge's progress (the events it observes and its backfill import). It describes code; it is never executed.
- **Adapter / evaluator:** tested code that turns a source of evidence (an event type, a warehouse dataset) into progress for every badge that selects it. Administrators choose and parameterize adapters; they never submit code or queries.
- **3D set:** the three texture maps (normal, height/roughness/metallic and base color) used to render a badge in world.
- **Scene badge:** a badge created by the owner of a NAME or LAND and awarded by that owner's authoritative scene server.

## Solution Space Exploration

### Where the catalog lives

**Keep the catalog in code (status quo). Not chosen.** Every new badge keeps requiring an engineering change and a deploy.

**A versioned file (repository or object storage). Not chosen.** It removes the code change but not the deploy or the review cycle, has no transactional link with progress, and cannot express drafts, publication or archiving.

**The service's existing relational database. CHOSEN.** It already holds player progress, so definitions and progress share constraints and transactions. Relational constraints enforce invariants (tiers belong to an existing badge, positions are unique) that a file cannot.

### Whether badge content is versioned

**Immutable revisions, with drafts of published badges and a pointer to the active one. Not chosen.** Nothing asked for revision history, and it adds storage, a lifecycle and concurrency rules to every read and every promotion.

**One current definition per badge, edited in place. CHOSEN.** A badge is a draft until it is first published; after that, edits apply directly. The accepted cost is no history and no rollback to an earlier version of a badge. Fields that would invalidate stored progress are fixed after publication, which keeps in-place edits safe. If history is needed later, an append-only audit log is added without changing the model.

### How services switch to the database catalog

**A startup selector with a shadow mode (compiled, shadow, database). Not chosen.** It keeps a second, compiled catalog path alive in every service, adds a per-environment setting that Platform has to manage, and only postpones its own removal. The case it protects against, a database without the catalog, cannot happen: the catalog migration creates and seeds the catalog in the same deploy, before the catalog is loaded.

**Read the catalog from the database only, in one deploy. CHOSEN.** The seed is a frozen, deterministic snapshot of the compiled catalog, and tests prove that the catalog built from the seeded data equals that snapshot before anything is deployed. A missing or invalid catalog stops the service instead of falling back. Rollback is redeploying a previous release: catalog migrations stay readable by the release before them, so it keeps working and ignores data it does not use (see Migrations and seed for the rules that keep this true). The accepted cost is losing a gradual, configuration-only rollout and rollback.

### Who administers badges

**An agent-driven workflow (a chat assistant skill). Not chosen.** It does not provide verifiable human identity, per-environment permissions or audit, and it would bypass server-side validation.

**Internal Tools on top of an administrative Badges API. CHOSEN.** The API owns validation, publication, permissions and audit; the interface only calls it. Bypassing the interface never bypasses the rules.

### Who owns badge assets

**A dedicated function that validates and uploads assets. Not chosen.** It splits ownership of a badge across two systems and duplicates authorization.

**The Badges service. CHOSEN.** The service authorizes uploads, validates them asynchronously and publishes them together with the badge that references them.

### Whether the 3D set is required

**Keep the 3D set required for every badge. Not chosen.** It blocks badges whose 3D art is not ready, including the first phase of scene badges, which ships with 2D images only.

**2D required, 3D optional and all or nothing. CHOSEN.** Every badge and tier has its 2D image. A badge either has the complete 3D set for itself and all its tiers, or none of it; a partial set is invalid. Existing badges keep their asset locations and their 3D set, and keep serving them unchanged; making 3D optional does not allow removing it from an existing badge. The accepted cost is that clients must handle a badge without 3D.

### How event attendance is evaluated

**One warehouse query and scheduled job per badge (status quo). Not chosen.** Each event badge needs a new data pipeline change.

**Typed attendance rules stored with each badge, evaluated by a generic process. CHOSEN.** A generic scheduled evaluator in the data warehouse reads published rules and submits results through the Badges API. A streaming evaluator may follow later with the same rule semantics.

### How scene badges relate to the catalog

**Store scene badges as catalog definitions. Not chosen.** Scene badges are created by land and name owners, use server-assigned identifiers, a different authorization model (signed requests and scene authority) and their own moderation. Mixing them would put untrusted, high-volume owner content into the platform catalog and its validation rules.

**Separate storage, merged at read time. CHOSEN.** Scene badges keep their own storage and are merged into player reads under their own category. The two features share the service, the database and the public read endpoints, but not their write paths.

## Specification

### Data model

- Each badge is stored once, with its identity, display position, presentation fields, progress kind, criteria, evaluator binding, asset location, whether it has the 3D set, and its publication and archive state. Its tiers are stored with it, each with a stable identifier and a position unique within the badge.
- Player progress is unchanged: no progress record is rewritten, and existing badge and tier identifiers are preserved literally so stored achievements keep resolving.
- A badge is visible when it is published and not archived. It MUST NOT be published before all of its tiers exist, and its progress kind MUST match whether it has tiers.
- Asset file locations are derived from the badge's asset location and each tier's slot by one fixed convention; they are not stored file by file. Whether the 3D set exists is recorded once per badge and applies to all its tiers. Together, these make a partial 3D set impossible to represent.
- Fields are added when a feature uses them, each through its own forward migration, never reserved in advance. Time windows, recurrence, alternative asset layouts and optimistic locking for the editor follow this rule. When a second kind of evaluator exists (attendance rules), the evaluator binding gains an explicit kind in the same change. Existing badges are not rewritten: a binding without a kind means the existing one, so the previous release can still read every existing badge.
- Later deliveries add, at least: an asset manifest per badge and environment, administrative operations with idempotency keys, an append-only audit log, per-badge promotion state (the hash of the last promoted content and of the last local edit, which the promotion conflict rule needs) and, for reliable automatic awards, event receipts, award records and an outbox.

### Migrations and seed

- The API and the processor carry the same migrations and run pending ones at startup, serialized by a database lock, before the catalog is loaded. A running service therefore never sees the schema without its seed. A separate pre-deployment migration step is a possible later improvement, not a requirement.
- The initial catalog migration seeds every existing badge, published and with its current asset locations and its 3D set, from a frozen, deterministic snapshot. Seed data MUST NOT be read from mutable source code at migration time.
- Applied migrations MUST NOT be edited.
- Until the editor's runtime prerequisites (see Administrative API) are delivered, a new catalog badge needs its identifier and any evaluator code added to the service in the same release as the forward migration that inserts it. A migration MUST NOT publish a badge that the release carrying it does not know: migrations commit before the catalog is validated, so such a badge would stop both services from starting, and redeploying the previous release would not remove it.
- For the same reason, a new badge is added in two steps. The release that adds its code inserts it as a draft; a migration in a later release publishes it, and full validation applies at that point. Rollback to the release before the first step is safe only if that release already tolerates draft badges it does not know (see Catalog loading); this tolerance MUST ship in a release before any badge is added this way, and is not assumed to exist otherwise.
- Rolling back past the release that published a badge is not supported. The way back is a forward migration that archives the badge, which keeps it resolvable for players who earned it. Returning a published badge to draft is allowed only while no player has progress on it.
- A catalog migration MUST stay readable by the release before it: it adds data or fields and never rewrites existing rows in a way that release's validation would reject. A migration that cannot meet this is a rollback exception and MUST say so in its review.
- A migration MUST be numbered after every migration already merged. Services do not check migration order at startup, but the command-line migration tool does. When two features developed in parallel (such as the catalog and scene badges) both add migrations, the one that merges second renumbers its migrations after the other's before it is deployed.
- Deploying the schema requires the migration history and DDL permissions of each environment to be verified first.

### Catalog loading

- The database is the only catalog source. There is no setting to choose another source and no compiled catalog to fall back to. If the published catalog is missing or invalid, the service MUST fail to start. The catalog is read once per process start; there is no hot reload in this phase.
- Loading separates three concerns:
  - **Stored completeness.** Every identifier known to the code MUST exist as a stored badge, whether draft, published or archived. A missing one stops startup.
  - **Active catalog validation.** The active catalog is the set of published, non-archived badges. It MUST NOT be empty, and each of its badges MUST be structurally consistent (progress kind against tiers, tier order and thresholds, asset locations) and have an evaluator binding that matches the observers and backfill imports that exist in code. Until the editor's runtime prerequisites (see Administrative API) are delivered, an active badge whose identifier is not known to the code also stops startup, because observers and imports are still selected by identifier; that delivery replaces this rule with binding by evaluator.
  - **Award eligibility.** Only active badges are public, receive progress or can be awarded.
- Draft badges, including drafts whose identifier the release does not know, do not stop startup and are not part of the active catalog. Being a draft never bypasses active validation: a badge is fully validated when it is published. Archived badges are not part of the active catalog either, and stay resolvable for players who earned them.
- Parity with the former compiled catalog is a test, not a runtime mode: a frozen fixture records what the compiled catalog served, and the parity test applies migrations only up to and including the initial catalog migration and requires that catalog to equal the fixture. Later catalog migrations carry their own tests. The fixture is never regenerated; once the compiled definitions are removed it is their only record.
- Startup order is: database connection and migrations, catalog load and validation, then (in the processor) observer registration, and only then queue consumption. Observers are registered, and events dispatched, only for active badges; an observer whose code exists for a draft or archived badge is not registered. A service whose catalog fails to load MUST NOT consume or delete queue messages. Readiness MUST stay false until the catalog is loaded. Components MUST read the catalog when they need it, not capture it when they are constructed.
- The backfill endpoint and its validation MUST use the same evaluator bindings, so a badge cannot be accepted by one and routed differently by the other.

### Awarding

Automatic awards keep this flow: platform services publish events, the processor consumes them from a queue, the matching observers compute progress, and each newly granted badge is announced for notifications. The backfill endpoint remains for historical and participant imports, keeps its current payloads and does not send notifications. It MUST reject draft and archived badges. Before backfill imports are selected by adapter instead of by badge identifier (which would let its credential award any published badge), backfill MUST use a credential separate per environment and write each import to the audit log.

Known gaps are not solved by the catalog migration and MUST be closed before any new automatic mechanism claims duplicate-safe awards:

- Event addresses MUST be normalized before progress lookups, receipts and idempotency keys, not only when stored.
- Processing MUST claim an event receipt, update progress, record awards and enqueue notifications in one transaction. An outbox publisher delivers notifications with stable keys and retries independently of progress.
- Each newly earned tier MUST produce its own notification with its own tier name and image. Notification consumers MUST be told before this changes.
- Failed messages MUST NOT be deleted as successes. A dead-letter queue, redrive policy, visibility timeout and alarms MUST be configured before acknowledgement behavior changes, and retries MUST NOT be enabled for additive handlers without deduplication.

Delivery is at least once with deduplication, not exactly once.

### Administrative API

The administrative API is specified here as a contract and is not yet implemented. Each API instance administers only its own environment (Zone or production), taken from its deployment configuration and never from a request. Any environment stated in a request MUST equal the instance's own, and authorization is always checked against the server-side value.

Every administrative route MUST verify a human actor's identity and authorize the action for the environment on the server. The shared backfill token MAY remain for machine backfills but MUST NOT authorize administrative routes.

| Area | Contract |
| --- | --- |
| Capabilities | List the supported adapters and their parameters, categories, tier restrictions, attendance options and asset policy. Internal Tools disables anything not listed. |
| Catalog | Paginated list and detail, including drafts, asset status and archived badges. |
| Drafts and edits | Create a badge as a draft; update a draft or the editable fields of a published badge. Concurrent edits are rejected rather than overwritten. |
| Validation and publication | Validate a badge and return field errors with a path, a code and a message. Publishing revalidates the badge and is idempotent. |
| Archive and audit | Archive stops new objectives and awards while existing achievements stay resolvable. Audit history is paginated and append-only. Long operations return an operation identifier to poll. |

Creation, publication, archive and promotion accept an idempotency key, scoped to the actor, the environment, the operation and the target badge. The current actor is authorized before a stored result is looked up or returned. The same payload returns the same result and a different payload is rejected as a conflict. Responses never include stack traces.

Every administrative change writes its audit entry in the same transaction as the change, recording the verified actor, the environment and the before and after values. The service can only append to and read the audit log, never change or delete entries, and reading it requires administrative authorization for that environment.

Rules for definitions:

- New badge and tier identifiers follow a restricted lowercase format. Legacy identifiers are preserved as they are. Catalog identifiers MUST NOT use the prefix reserved for scene badge identifiers.
- Badge and tier identifiers are immutable after the first publication. Progress kind, rules, thresholds and tier structure are also fixed after publication; changing them requires a new badge or an explicit progress migration. Presentation fields (name, description, category and tier descriptions) MAY be edited after publication and apply in place. Assets MAY be replaced after publication only through the validated replacement described in Assets. Publishing never awards past activity on its own.
- Drafts are never public and never award progress.
- Until the public contract and its clients are updated, a tiered badge MUST have exactly the six existing tiers, with their existing names, in their existing order. A single badge has no tiers. Tier names are fixed after publication; tier descriptions are presentation.
- The scene badge category is reserved for scene badges and MUST be rejected for catalog badges.
- Criteria, evaluator parameters and attendance rules MUST match a closed schema per adapter that rejects unknown fields and uses strict formats for identifiers. Evaluators pass rule values only as query parameters, never as query text. Promotion runs the same validation again.
- A badge's asset location is generated by the server inside the badges asset root, never taken from administrator input. Legacy locations are fixed by the seed and change only through the validated replacement described in Assets.

Before an editor is enabled, the runtime MUST accept identifiers unknown to the code, select backfill imports by adapter instead of by badge identifier, and refresh the catalog without a restart (proposed target: under 30 seconds). Publication, archive and progress writes MUST share a concurrency boundary, so an award cannot commit against a badge archived in the same instant.

### Assets

Textures stay in object storage, owned by the Badges service.

- Every badge, and every tier of a tiered badge, MUST have its 2D image.
- The 3D set is optional and all or nothing. A badge with 3D MUST have all three maps for itself and every tier; a badge without 3D has none. A partial set MUST be rejected at upload and validation, and MUST NOT be representable in the catalog.
- The catalog migration preserves the asset locations and the 3D set of every existing badge, and the public API keeps serving them unchanged. A published asset location is immutable: its objects are never overwritten. The only way to change a badge's assets is a validated replacement that activates a new location. A replacement for a badge that has the 3D set MUST include it; 3D is not removed from existing badges.
- The public API MUST state the absence of 3D explicitly: the 3D field is present with a null value, never omitted and never filled with locations of files that do not exist. Catalog badges and scene badges MUST use this same representation. The public contract MUST be updated to mark the 3D field as nullable, and client owners MUST be told before the first badge without 3D is published.

The proposed initial policy, to be confirmed with the teams that produce the assets:

| Control | Proposed value |
| --- | --- |
| Files per badge or tier | One 2D image; optionally the three 3D maps, all together |
| Format | Decodable, non-animated PNG |
| Dimensions | 2D 256x256; 3D maps 1024x1024 |
| Maximum size | 8 MiB per PNG; 50 MiB per archive; 256 MiB extracted; 256 entries; 8 folder levels |

Flow: the API issues a size-limited upload to private staging for one badge; a worker validates the uploaded object asynchronously and records a manifest with hashes, sizes, dimensions and slots; the administrator previews and corrects associations; publication activates the badge together with its exact, immutable assets. Content is validated by decoding it, never by trusting file names, extensions or declared sizes. Ambiguous associations are reported, never resolved silently. An incomplete upload MUST NOT enable a badge. Once the service manages a badge's assets, direct writes that skip validation MUST be retired for that badge.

Replacing the assets of a published badge goes through the same flow and activates a new asset set at a new location. Objects at a published location are never overwritten, so caches stay consistent and promotion always refers to exact bytes.

Upload requirements:

- The storage layer enforces the size limit of each upload; a limit only declared by the client is not enough.
- The server generates the storage key, and the upload grant is short-lived and issued only after checking that the actor may edit that badge in that environment.
- Corrected associations may only reference objects in the same badge's manifest.
- Archives are rejected if they contain absolute paths, parent references, backslashes, links, non-regular files, or duplicate or case-colliding names. Extracted size and entry limits are enforced while extracting, not from headers. Storage keys are never derived from entry names.
- Image dimensions are checked from the header before a full decode.
- Published images are served with a fixed image content type and without content sniffing.

### Promotion between environments

A badge can be published directly in Zone or in production, or promoted from Zone to production. Promotion exports the complete definition (badge, tiers and evaluator binding) and the exact verified asset bytes, and production creates or updates the badge by identifier. It MUST revalidate under production policy, require production authorization, preserve identifiers, be idempotent by a hash of the exported content, and be audited. It MUST be rejected as a conflict when the production badge differs in fields that are fixed after publication, or was created or edited in production since its last promotion, unless the request explicitly overrides it. Player progress, awards and credentials are never promoted.

Whichever transport is chosen, promotion is initiated in production by a production-authorized actor and reads from a fixed, configured Zone source, never from a location given in the request. Asset bytes are verified against the manifest hashes, and no Zone credential can write to production. An exported bundle MUST be signed and verified by production.

### Attendance rules

Attendance requirements are stored as a typed rule with each badge: a location selector (place, scene, parcel set, event or subevent) with an explicit subevent policy; a UTC time window with an inclusive start and exclusive end; entry only or a minimum duration with defined continuity; client, realm and world constraints; the evidence source and evaluator version; and a deterministic achievement timestamp. Nothing defaults to a particular location, client or realm.

The API validates and publishes rules and exposes them to authorized workers. Each worker has its own credential per environment, separate from the backfill credential and from human administrative identity. The API accepts a result only for a published, non-archived badge whose rule is bound to that worker's evaluator, with an achievement time inside the rule's window. A generic scheduled evaluator in the data warehouse evaluates them and submits idempotent results with provenance and per-record failures. Warehouse scans MUST NOT run inside browser-facing requests. A preview returns matched counts without granting anything. If a streaming evaluator is added later, the same evidence MUST NOT be counted twice across both paths.

### Integration with scene badges

Scene badges are in progress in separate pull requests and are not yet released. They are owned by NAME or LAND holders, awarded by authoritative scene servers, use server-assigned identifiers, their own storage and their own routes, and are merged into player badge reads as single-step badges under their own category.

- The two features' data is independent; no reference crosses them.
- Scene badges ship 2D only in their first phase and add 3D later under the same all-or-nothing rule and the same explicit null representation.
- Shared read paths MUST read the catalog when they need it, so merging scene badges does not reintroduce a catalog captured at startup.
- Route namespaces MUST NOT collide. Scene badges add owner routes and moderation routes under the same badge paths that catalog administration would use, so catalog administration needs a distinct namespace or an agreed dispatch rule. The ban on the shared backfill token for administrative routes applies to scene badge moderation too.
- Each family of routes resolves only its own identifiers: scene badge owner and moderation routes act only on scene badges and answer not found for catalog identifiers, and catalog administration rejects scene badge identifiers. An ownership or moderation check can therefore never apply to the other feature's badges.

### Public compatibility

Catalog, detail, tier, player badge and preview responses keep their shapes, with the 3D field becoming nullable. Archived badges remain resolvable for players who earned them. Custom tier names or counts require updating the public contract and verifying its clients first.

### Rollout

1. Platform records, per environment, the runtime flags, the service and release serving the badges API, the real queue consumer, the migration history, DDL permissions and storage permissions. If the shared workers runtime serves badges, its copy needs its own update and release.
2. Merge only after the parity tests pass against the frozen fixture.
3. Deploy to Zone and compare catalog, categories, tiers and player responses (empty, partial, complete, multi-tier) with the previous release. Rollback is redeploying a previous release that knows every published badge, never dropping data or running down migrations in shared environments.
4. Deploy to production as a separate operational decision, with the same comparison.
5. Deliver the administrative API, dynamic runtime, assets, Internal Tools and promotion, then reliable awarding before enabling new automatic mechanisms.

Once badges unknown to the compiled code exist, a release that knows only the compiled catalog is no longer a safe rollback.

### Open decisions

| Decision | Owner |
| --- | --- |
| Runtime evidence per environment (flags, active service, queue consumer, migrations, DDL, storage permissions) | Platform |
| Administrative identity: signed fetch ([ADR-44](/adr/ADR-44)) with a per-environment allowlist checked against the verified signer, with replay protection and a short timestamp window, or an authenticated proxy. Either way, audit records store the verified actor | Badges service owners with Platform |
| Per-environment administrative permissions and who holds them | Badges service owners |
| Promotion transport: service-to-service copy, or an exported bundle with verifiable provenance | Badges service owners with Platform |
| Asset limits and dimensions | Teams that produce badge assets |
| Asset worker deployment and storage permissions | Platform |
| How clients render a badge without 3D | Explorer client owners |
| Attendance evidence sources, event/subevent mapping, duration telemetry and evaluator ownership | Data |
| Administrative route namespace shared with scene badges | Badges service owners with scene badges owners |
| Notification changes for multi-tier awards | Badges service owners with notification consumers |
| Recurrence semantics (resetting periods, editions or tiers) | Product |
| Custom tier names and counts | Product with Explorer client owners |

## RFC 2119 and RFC 8174

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.
