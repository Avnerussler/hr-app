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

### Data Model (simplified)
All data is stored as `FormSubmissions` documents keyed by `formName`:
- `formName: 'personnel'` → reservist records
- `formName: 'reserve_days_management'` → duty period records; `formData.employeeName` references a personnel `_id`
- `formName: 'project_management'` → project records; `formData.projectPersonnel` is an array of personnel `_id`s

### Main UI Areas
- `/quota-management` — the primary view; calendar + `DailyAttendanceDrawer` + `QuotaManagement` page
- `/:formName/:formId` — dynamic form list/create/edit views generated from form schema (`FormGenerator`)
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

---

## TypeScript Rules

- Everything must be typed — no `any`, no unannotated function parameters or return values
- Reuse existing types before creating new ones — check `@/types/` and `@/hooks/queries/types.ts` first
- Shared interfaces live in `@/types/` (field types, form types, mutation types) or alongside the hook that owns the data
- Local `type`/`interface` is fine inside a file when it is only used there
- Use type predicates and explicit return type annotations when TypeScript cannot infer correctly

---

## Hooks

- **Always use the existing query/mutation hooks** before writing a new fetch or axios call directly
- Query hooks live in `@/hooks/queries/` — covers forms, submissions, quotas, attendance, statistics, field options
- Mutation hooks live in `@/hooks/mutations/` — covers form submission CRUD, attendance, quotas
- Utility hooks: `useDebounce`, `useEnhancedSelectOptions`, `useErrorHandler`, `useMetrics`, `useRouteContext`
- When adding a new data-fetching need, add a hook to the appropriate file in `@/hooks/queries/` or `@/hooks/mutations/`

---

## Component Rules

- Reuse shared components from `@/components/common/` (`MetricCard`, `SummaryCard`, `SearchAndFilters`, `DataTable`, etc.) and `@/components/ui/` (Chakra wrappers)
- Controlled form fields live in `@/components/ControlledFields/` — use them instead of raw inputs inside React Hook Form
- Dynamic forms are rendered via `FormGenerator` — do not reimplement form layout manually
- Data tables use `GenericTable` — do not build custom table/pagination logic from scratch
- Dialogs/modals use the wrappers in `@/components/ui/dialog.tsx` (`DialogRoot`, `DialogContent`, etc.)
- Drawers use `@/components/ui/drawer.tsx`
- Pagination uses `@/components/ui/pagination.tsx`

---

## Data Fetching

- All HTTP goes through the axios instance configured in `@/lib/queryClient.ts`
- Query keys follow the pattern `['resource/sub-resource', id, { ...params }]`
- Pass filter/search/page params as the third element of the query key — the default `queryFn` forwards them automatically
- `staleTime: 0` for data that must always be fresh (attendance, quotas); `staleTime: 1000 * 60 * 5` for mostly-static data (form schemas)
- Invalidate related queries in mutation `onSuccess` callbacks — do not manually refetch

---

## File & Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` with `use` prefix
- Types: `camelCase.ts` (e.g. `fieldsType.ts`)
- UI primitives: `kebab-case.tsx` inside `components/ui/`
- Feature folders: PascalCase (e.g. `QuotaManagement/`, `FormGenerator/`)
- Utility files: camelCase (e.g. `formUtils.ts`)

---

## Do Not

- Do not write inline `axios.get/post` calls inside components — use or create a hook
- Do not duplicate types that already exist in `@/types/` or `@/hooks/queries/types.ts`
- Do not build custom pagination, table, or filter logic when `GenericTable` covers the case
- Do not use `leftIcon` prop on `Button` — it does not exist in this version of Chakra
- Do not use `any` — use proper interfaces or generics
