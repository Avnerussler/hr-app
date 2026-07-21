# Frontend Guidelines

## What This Project Is

This is an **IDF reserve-duty HR management system** (מערכת ניהול מילואים). It is used by unit HR managers to:

- Track **personnel** (reservists) — their roles, ranks, personal details, and military unit
- Manage **reserve-duty reservations** (`reserve_days_management`) — scheduling when reservists report for duty, with start/end dates, funding source (internal/external), order type, and attendance
- Manage **projects** (`project_management`) — assigning personnel to projects with a project manager
- View a **daily attendance dashboard** (`QuotaManagement`) — a calendar view showing how many reservists are scheduled per day vs. the daily quota, with a drawer to see/filter/search individual employees and mark attendance
- Track **quotas** — the max number of reservists allowed per day, with occupancy rates shown on a calendar

### Key Domain Terms
- **Personnel / עובד** — a reservist in the system
- **Reserve days / ימי מילואים** — a duty period (startDate → endDate) assigned to a reservist
- **Quota / מכסה** — the daily cap on how many reservists can be active
- **Funding source** — `internal` (unit funds) or `external` (funded by another unit)
- **Request status** — `approved`, `pending`, or `denied`
- **Attendance / נוכחות** — whether a reservist actually showed up on a given day

### Data Model

Personnel, Project Management, and Reserve Days each have an explicit backend model/service/route (see `apps/server/CLAUDE.md`) — no generic schema-driven document store. Types are shared with the backend via `@hr-app/shared-types` (`packages/shared-types`), e.g. `Personnel`, `Project`, `ReserveDay`, plus label-map enums (`RESERVE_CATEGORY_LABELS`, etc.).

- Personnel — reservist records (`components/Personnel/`)
- Reserve Days — duty period records; `assignedProjects`/employee reference points at a personnel `_id` (`components/ReserveDay/`)
- Project Management — project records; `projectPersonnel` is an array of personnel `_id`s (`components/Project/`)

### Main UI Areas
- `/quota-management` — the primary view; calendar + `DailyAttendanceDrawer` + `QuotaManagement` page
- `/personnel/default`, `/project_management/default`, `/reserve_days_management/default` (+ `/new`, `/edit/:itemId`) — the three entity list/create/edit pages. The `formName`/`default` URL segments are kept literal for e2e URL parity with the old dynamic-form routes; `default` is a stable placeholder, not a real form-definition id.
- `/dashboard` — statistics and analytics

---

## Code Reminders
- stop using leftIcon prop in button its not exist in this chakra version

## Stack
- React + TypeScript (strict)
- Chakra UI v3 — use components from `@/components/ui/` wrappers, not raw Chakra imports
- React Query v5 (`@tanstack/react-query`) for all server state
- React Hook Form for all form state
- axios via the centralized query client at `@/lib/queryClient.ts`
- react-router-dom v7 for routing
- Import alias: `@/*` → `src/*`
- This package is part of an npm workspace — run `npm ci` and workspace-scoped commands (e.g. `npm run build --workspace=apps/frontend`) from the repo root

---

## TypeScript Rules

- Everything must be typed — no `any`, no unannotated function parameters or return values
- Reuse existing types before creating new ones — check `@/types/`, `@hr-app/shared-types`, and each entity's query hooks (`@/hooks/queries/use<Entity>Queries.ts`) first
- Local `type`/`interface` is fine inside a file when it is only used there
- Use type predicates and explicit return type annotations when TypeScript cannot infer correctly

---

## Entities

Personnel, Project, and Reserve Day each follow the same file layout, split by kind rather than colocated in a per-entity folder:

- `hooks/queries/use<Entity>Queries.ts` — list/detail/metrics/options queries (React Query)
- `hooks/mutations/use<Entity>Mutations.ts` — create/update/delete mutations
- `hooks/use<Entity>Columns.tsx` — `@tanstack/react-table` column defs for the entity's list page
- `components/<Entity>/<entity>Schema.ts` — zod schema (imported from or mirroring `@hr-app/shared-types`)
- `components/<Entity>/<Entity>Form.tsx` — the React Hook Form fields for create/edit
- `components/<Entity>/<Entity>Drawer.tsx` — the create/edit drawer shell
- `components/<Entity>/` — entity-specific select components (e.g. `AssignedProjectSelect.tsx`, `ProjectManagerSelect.tsx`, `EmployeeSelect.tsx`) built on the paged option hooks in `@/hooks/usePagedPersonnelOptions.ts` / `usePagedProjectOptions.ts`
- `components/Pages/<Entity>ListPage.tsx` — the routed list page: builds its own `@tanstack/react-table` instance from the shared `components/common/Table/` building blocks (see below) rather than using one shared generic table component

When adding a new data-fetching or mutation need for an existing entity, add it to that entity's `use<Entity>Queries.ts`/`use<Entity>Mutations.ts` in `hooks/` — don't write inline `axios` calls in components.

---

## Component Rules

- Reuse shared components from `@/components/common/` (`MetricCard`, `SearchAndFilters`, `EntityLink`, etc.) and `@/components/ui/` (Chakra wrappers)
- Controlled form fields live in `@/components/ControlledFields/` — use them instead of raw inputs inside React Hook Form
- List pages assemble their table from `@/components/common/Table/components/` (`TableControls`, `TableContainer`, `TablePagination`, `TableBody`, `TableFilters`) and `@/components/common/Table/hooks/useTableState`, `utils/fuzzyFilter`, `utils/globalFilter` — these are shared building blocks, not a single drop-in table component. Follow the pattern in an existing `components/Pages/<Entity>ListPage.tsx` when building a new one.
- Dialogs/modals use the wrappers in `@/components/ui/dialog.tsx` (`DialogRoot`, `DialogContent`, etc.)
- Drawers use `@/components/ui/drawer.tsx`
- Pagination uses `@/components/ui/pagination.tsx`
- `EntityLink` (`@/components/common/EntityLink.tsx`) renders a clickable link to a personnel/project record — use it instead of ad hoc navigation links in table columns or select option displays

---

## Data Fetching

- All HTTP goes through the axios instance configured in `@/lib/queryClient.ts`
- Query keys follow the pattern `['<entity>', '<sub-resource>', ...params]` (e.g. `['personnel', 'metrics']`, `['projects', 'options', search, page]`)
- `staleTime: 0` (or omitted) for data that must always be fresh (attendance, quotas); `staleTime: 1000 * 60 * 5` for mostly-static data
- Invalidate related queries in mutation `onSuccess` callbacks — do not manually refetch

---

## File & Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` with `use` prefix
- Types: `camelCase.ts` (e.g. `fieldsType.ts`)
- UI primitives: `kebab-case.tsx` inside `components/ui/`
- Feature folders: PascalCase (e.g. `QuotaManagement/`) or the entity name (e.g. `components/Personnel/`)

---

## Do Not

- Do not write inline `axios.get/post` calls inside components — use or create a hook in `@/hooks/queries/` or `@/hooks/mutations/`
- Do not duplicate types that already exist in `@hr-app/shared-types` or `@/types/`
- Do not build a new table from scratch when the `components/common/Table/` building blocks (see Component Rules) cover the case
- Do not use `leftIcon` prop on `Button` — it does not exist in this version of Chakra
- Do not use `any` — use proper interfaces or generics
