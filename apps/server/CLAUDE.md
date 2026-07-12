# Server — CLAUDE.md

Node.js/Express REST API, TypeScript, MongoDB (Mongoose), MinIO for file storage.

## Architecture

```
src/
  server.ts              # Entry point — Express setup, route mounting, middleware
  types.ts               # Shared TypeScript interfaces (IForm, BusinessRule, configs)
  config/
    db.ts                # MongoDB connection (MONGO_URI env var)
    logger.ts            # Winston logger
    minio.ts             # MinIO S3-compatible storage
  models/
    FormFields.ts        # Form schema definitions (sections, fields, businessRules, filters)
    FormSubmissions.ts   # Form submission records
    Quota.ts             # Quota/reservation data
    index.ts             # Re-exports all models
  routes/
    index.ts             # Mounts all routers under /api
    formFields/get.ts    # GET /api/formFields/get
    formSubmission/
      create.ts          # POST /api/formSubmission/create — runs full validation
      get.ts             # GET /api/formSubmission
      update.ts          # POST /api/formSubmission/update — runs full validation
      delete.ts          # DELETE /api/formSubmission/delete
    quotas/              # CRUD + attendance endpoint
    statistics/get.ts    # Aggregated stats
    file/upload.ts       # MinIO upload
  services/
    formValidation.ts    # All validation logic (field rules + business rules)
    bidirectionalSync.ts # Keeps related form records in sync
    statisticsService.ts # Metric calculations
  migrations/
    personnel.ts         # Personnel form schema (upsert with version check)
    projectManagement.ts # Project form schema
    reserveDays.ts       # Reserve days form schema (includes noOverlap business rule)
    addMetricsConfig.ts  # Metrics config migration
    index.ts             # Runs all migrations on startup when RUN_MIGRATIONS=true
    seedViaApi.ts        # 3-phase seed: 100 personnel → 10 projects → ~1000 reservations
  middleware/
    validation.ts        # Joi-based input validation
    errorHandler.ts      # Global error handler + 404 + uncaught exception handlers
    requestLogger.ts     # HTTP request/response logging
  utils/
    formDataTransform.ts # Transform raw IDs to display objects when reading
    dateUtils.ts         # Date helpers (+ dateUtils.test.ts)
    uploadFileToMinio.ts # MinIO upload helper
    index.ts             # Re-exports
```

## Data Model

All user-facing data lives in two collections:

- **FormFields** — one document per form, defines schema (sections/fields, businessRules, filters, overviewFields, metricsConfig). Versioned; migrations upsert via `FormFields.updateOne({ formName }, { $set: formData })`.
- **FormSubmissions** — one document per submitted record. Raw field values stored (IDs, not display strings). Transformation to display objects happens at read time in `utils/formDataTransform.ts`.

## Form Validation Pipeline

All creates and updates go through `formValidationService.validateFormSubmission(formData, formId, formName, excludeId?)`:

1. **Field validation** — required checks, minLength/maxLength/pattern/min/max from field schema
2. **Business rules** — runs each enabled rule from `formDefinition.businessRules`:
   - `uniqueConstraint` — no duplicate values for specified fields
   - `dateRange` — start ≤ end, optional maxDays/minDays
   - `conditional` — if field A matches condition, field B must match condition
   - `noOverlap` — no two records with same entity ID have overlapping date ranges
   - `custom` — logs warning, returns valid (not implemented)

HTTP status codes come from `rule.statusCode ?? 400`. Never hardcode status codes in routes — they come from the DB rule config.

## Business Rules in DB

Business rules are stored on each form document:

```typescript
{
  id: string,
  name: string,
  ruleType: 'uniqueConstraint' | 'dateRange' | 'conditional' | 'noOverlap' | 'custom',
  enabled: boolean,
  statusCode?: number,      // HTTP status when this rule fails (e.g. 409 for overlap)
  errorMessage: string,     // User-facing Hebrew error message
  config: {
    // noOverlap:
    entityField: string,    // e.g. 'employeeName'
    startDateField: string, // e.g. 'startDate'
    endDateField: string,   // e.g. 'endDate'
    // uniqueConstraint:
    fields: string[],
    // dateRange:
    startDateField, endDateField, maxDays?, minDays?
  }
}
```

To add overlap protection to a new form: add a `noOverlap` business rule to that form's migration. No code changes needed.

## Migrations

- Each migration file exports a `create<FormName>Form()` function
- Pattern: check `existingForm.version === CURRENT_VERSION`, skip if up to date
- Always use `{ $set: formData }` in `updateOne` — omitting `$set` silently drops nested fields like `businessRules`
- Bump `CURRENT_VERSION` string whenever any field in the form schema changes
- `index.ts` runs all migrations; triggered at server start when `RUN_MIGRATIONS=true`

## Seed Script

`migrations/seedViaApi.ts` — seeds via HTTP API (so validation runs):

- Phase 1: 100 personnel (skips if ≥100 exist)
- Phase 2: 10 projects, assigns 15-40% of personnel to each (skips if ≥10 projects exist)
- Phase 3: ~1000 reservations spread across current month

Rate limiting: 800ms between requests, retry-on-429 with 15s/20s/25s backoff.

Run: `cd apps/server && npx ts-node src/migrations/seedViaApi.ts`

## Key Patterns

- **No hardcoded form names** in service/validation logic — always derive from DB definition
- **No `any` types** in `formValidation.ts` — use `Record<string, unknown>` for formData, cast to specific config types inside switch cases
- **Transformation on read, not write** — raw IDs stored in FormSubmissions, transformed to `{ _id, display, metadata }` objects when reading
- **Bidirectional sync** — when a personnel record updates, related form submissions with that employee are updated automatically via `bidirectionalSync.ts`
- **Rate limit**: 100 req/60s (enforced in `server.ts`)

## npm Scripts

```bash
npm run dev              # nodemon dev server
npm run build            # tsc compile → dist/
npm run start            # run compiled dist/server.js
npm run test             # Jest
npm run import:personnel # import from personnel.xlsx
npm run import:reserveDays
npm run delete:reserveDays
```

## Environment Variables

- `PORT` — server port
- `MONGO_URI` — MongoDB connection string
- `RUN_MIGRATIONS` — set to `true` to run migrations on startup
- `MINIO_*` — MinIO connection config
