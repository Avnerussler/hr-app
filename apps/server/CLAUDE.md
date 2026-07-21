# Server — CLAUDE.md

Node.js/Express REST API, TypeScript, MongoDB (Mongoose), MinIO for file storage. npm workspace member (`apps/server`), depends on `@hr-app/shared-types` (`packages/shared-types`).

## Architecture

```
src/
  server.ts              # Entry point — Express setup, route mounting, middleware
  types.ts                # Shared TypeScript interfaces (BusinessRule, configs)
  config/
    db.ts                 # MongoDB connection (MONGO_URI env var)
    logger.ts             # Winston logger
    minio.ts              # MinIO S3-compatible storage
  models/
    Personnel.ts          # Personnel (reservist) documents
    Project.ts             # Project documents
    ReserveDay.ts           # Reserve-duty reservation documents
    Quota.ts               # Quota/reservation data
    index.ts               # Re-exports all models
  controllers/
    personnel.controller.ts    # Thin HTTP handlers — parse req, call service, send res
    project.controller.ts
    reserveDay.controller.ts
  services/
    personnel.service.ts     # Business logic + Mongoose queries for Personnel
    project.service.ts        # Business logic + Mongoose queries for Project
    reserveDay.service.ts      # Business logic + Mongoose queries for ReserveDay
    bidirectionalSync.service.ts # Keeps Personnel.assignedProjects and Project.projectPersonnel in sync
    statisticsService.ts       # Aggregated stats across Personnel/Project/ReserveDay
  routes/
    index.ts                # Mounts all routers under /api
    personnel/index.ts       # /personnel — list/get/create/update/delete/options/metrics
    projects/index.ts         # /projects — same shape
    reserveDays/index.ts       # /reserve-days — same shape
    quota/                   # CRUD + attendance endpoint
    statistics/get.ts         # Aggregated stats endpoint
    file/upload.ts            # MinIO upload
  migrations/
    toExplicitModels/        # One-time backfill: legacy FormSubmissions docs → Personnel/Project/ReserveDay
                               # collections. NOT YET RUN in every environment — do not delete until confirmed.
  middleware/
    validation.ts            # Joi-based input validation
    errorHandler.ts           # Global error handler + asyncHandler wrapper + 404 + uncaught exception handlers
    requestLogger.ts           # HTTP request/response logging
  utils/
    labelSortKey.ts           # Sort by human-readable label instead of raw enum value
    searchQueryBuilder.ts       # Builds Mongo $regex/$expr clauses for text + date search
    buildSortSpec.ts             # Builds a Mongoose sort spec from sortField/sortOrder
    dateUtils.ts                # Date helpers (+ dateUtils.test.ts)
    uploadFileToMinio.ts          # MinIO upload helper
    index.ts                     # Re-exports
```

## Data Model

Personnel, Project, and Reserve Days each have their own explicit Mongoose model (`models/Personnel.ts`, `Project.ts`, `ReserveDay.ts`) — no generic/dynamic schema layer. Each entity follows the same pattern end-to-end:

- **Model** — a typed Mongoose schema (see `models/Personnel.ts` etc.)
- **Service** (`services/<entity>.service.ts`) — all business logic and queries: `list<Entity>`, `get<Entity>ById`, `create<Entity>`, `update<Entity>`, `delete<Entity>`, `get<Entity>Metrics`, `search<Entity>Options`, `get<Entity>sByIds`
- **Controller** (`controllers/<entity>.controller.ts`) — thin: parses `req`, calls the service, sends `res`. No business logic here.
- **Router** (`routes/<entity>/index.ts`) — wires HTTP verbs to controller functions via `asyncHandler`. Route order matters: static segments (`/options`, `/metrics`) must be registered before the `/:id` param route.

Validation uses `zod` schemas from `@hr-app/shared-types` (e.g. `PersonnelSchema.parse(body)` in `personnel.service.ts`), shared with the frontend.

### Legacy generic form engine (removed)

An earlier version of this app stored all data as schema-less `FormSubmissions` documents validated against a `FormFields` schema definition, with generic CRUD routes and a dynamic-form frontend. That system has been fully replaced by the explicit models/controllers/services above — Personnel, Project Management, and Reserve Days were (and remain) the only three entity types in this app. `models/FormFields.ts` and `models/FormSubmissions.ts` still exist **only** to support `migrations/toExplicitModels/`, the one-time backfill script that has not yet been run in every environment. Once that migration is confirmed run and verified everywhere, delete `toExplicitModels/`, `models/FormFields.ts`, and `models/FormSubmissions.ts` — nothing else in the app depends on them.

## Bidirectional Sync

`services/bidirectionalSync.service.ts` keeps `Personnel.assignedProjects` and `Project.projectPersonnel` consistent — when a personnel record's `assignedProjects` changes, the previous and next project's `projectPersonnel` arrays are updated via `$pull`/`$addToSet`. Called from `personnel.service.ts` and `project.service.ts` on create/update/delete.

## Key Patterns

- **Thin controllers** — controllers only parse request params/query/body and call the corresponding service function. All logic lives in services.
- **No `any` types** — use `Record<string, unknown>` for loosely-typed query/filter objects, cast to specific types inside switch/if branches.
- **Validation via shared zod schemas** — `@hr-app/shared-types` defines `PersonnelSchema`/`ProjectSchema`/`ReserveDaySchema`, imported by both frontend and server so validation rules can't drift between them.
- **Metrics endpoints** — each entity's `/metrics` route returns a fixed array of `{ id, title, icon, color, value }` computed via `countDocuments` in the service (see `project.service.ts:getProjectMetrics` as the reference pattern). Metric definitions are hardcoded in the service, not driven by a database config document.

## npm Scripts

```bash
npm run dev                          # nodemon dev server (watches src/ and packages/shared-types/src)
npm run build                        # tsc compile → dist/
npm run start                        # run compiled dist/server.js
npm run test                         # Jest
npm run migrate:to-explicit-models   # one-time backfill from legacy FormSubmissions (see above)
npm run migrate:to-explicit-models:dry-run
```

This package is part of an npm workspace — run `npm ci` and `npm run build --workspace=apps/server` from the repo root, not from within `apps/server`.

## Environment Variables

- `PORT` — server port
- `MONGO_URI` — MongoDB connection string
- `MINIO_*` — MinIO connection config
