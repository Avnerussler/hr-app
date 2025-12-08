# HR App - Comprehensive Test Plan

## Test Plan Overview

**Application:** HR Management System  
**Version:** 1.0  
**Test Plan Version:** 1.0  
**Date:** December 2025  
**Author:** QA Team

---

## 1. Application Overview

The HR App is a comprehensive human resources management system with three main CRUD modules:

### Core Modules

1. **Personnel Management** (משאבי אנוש) - Employee records and information
2. **Project Management** (ניהול פרויקטים) - Project tracking and assignments
3. **Reserve Days Management** (צווי מילואים) - Military reserve duty tracking

### Supporting Features

- **Quota Management** (נוכחות ומעקב יומי) - Daily attendance tracking
- **Dashboard** - Analytics and reporting
- **Dynamic Forms System** - Configurable form-based data entry

### Technology Stack

- **Frontend:** React + TypeScript + Vite (Port 5173)
- **Backend:** Node.js + Express + TypeScript (Port 3001)
- **Database:** MongoDB (Port 27017)
- **Storage:** MinIO (Ports 9000, 9001)

---

## 1.1 Forms Generation & CRUD (migrations)

Note: The application generates the main forms and initial data via server-side migrations. Tests should be aware of these migration sources and that each form exposes full CRUD functionality.

- Migration files that generate the forms and seed data:
  - `apps/server/src/migrations/personnel.ts`
  - `apps/server/src/migrations/projectManagement.ts`
  - `apps/server/src/migrations/reserveDays.ts`

- What the migrations provide:
  - Creation of `FormFields` definitions for each form (controls, field types, labels, validation rules).
  - Optional seeding of initial `FormSubmissions` / records used by the UI tables.
  - Any required lookup data (projects, positions, employment types) used by enhanced selects.

- Test implications / guidance:
  - Tests should rely on these migrations (or the server seeding scripts) to prepare deterministic test data for E2E runs.
  - Each form renders a table with standard table features (sorting, pagination, search, column actions) and provides full CRUD endpoints on the backend: Create, Read, Update, Soft Delete (restore where applicable).
  - Test cases must include both UI flow verification and API-level assertions for Create/Update/Delete to ensure persistence and soft-delete behavior.

---

## 2. Test Environment Setup

### Quick Start

```bash
# Start all services
npm run services:start

# Verify services are running
npm run services:check

# Run tests
npm test
```

### Service Requirements

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- MongoDB: localhost:27017
- MinIO Console: http://localhost:9001

---

## 3. Test Strategy

### Testing Approach

- **E2E Testing:** Playwright (Chromium, Firefox, WebKit)
- **API Testing:** Backend endpoint validation
- **UI Testing:** Component interactions and navigation
- **Data Testing:** CRUD operations validation
- **Localization Testing:** Hebrew/English RTL support

### Test Coverage

- ✅ CRUD operations on all 3 main modules
- ✅ Navigation and routing
- ✅ Form validation and error handling
- ✅ Search and filtering
- ✅ Table interactions (sorting, pagination)
- ✅ Cross-browser compatibility
- ✅ Hebrew text and RTL support

---

## 4. Module 1: Personnel Management Tests

### TC-PERS-001: Personnel List Page Load

**Priority:** Critical  
**Prerequisites:** All services running

**Test Steps:**

1. Navigate to Personnel page (משאבי אנוש) from sidebar
2. Verify page loads successfully
3. Check page header displays "משאבי אנוש"
4. Verify metric cards display:
   - Total Personnel
   - Active Personnel
   - Inactive Personnel
   - On Reserve
5. Verify table displays with columns:
   - Name
   - Personal Number
   - Position
   - Status
   - Projects
   - Actions

**Expected Results:**

- ✅ Page loads within 2 seconds
- ✅ Metrics display with correct counts
- ✅ Table shows all personnel records
- ✅ No console errors
- ✅ Hebrew text displays correctly (RTL)

---

### TC-PERS-002: Search Personnel

**Priority:** High  
**Prerequisites:** On Personnel page with data

**Test Steps:**

1. Locate search input field
2. Enter personnel name (Hebrew or English)
3. Verify table filters in real-time
4. Clear search
5. Verify all records return

**Expected Results:**

- ✅ Search is debounced (waits for typing to stop)
- ✅ Results filter instantly
- ✅ Partial matches work
- ✅ Case-insensitive search
- ✅ Hebrew and English search both work
- ✅ Clear button resets results

---

### TC-PERS-003: Filter Personnel

**Priority:** High  
**Prerequisites:** On Personnel page

**Test Steps:**

1. Click on filter dropdowns
2. Test filters:
   - Employment Type (קבע, סדיר, מילואים, יועץ)
   - Position
   - Status (Active/Inactive)
   - Department
3. Apply single filter
4. Apply multiple filters
5. Verify filter combinations work (AND logic)
6. Clear all filters

**Expected Results:**

- ✅ Each filter works independently
- ✅ Multiple filters combine correctly
- ✅ Filter counts update
- ✅ Clear filters button resets all
- ✅ URL updates with filter parameters

---

### TC-PERS-004: View Personnel Details

**Priority:** Critical  
**Prerequisites:** Personnel records exist

**Test Steps:**

1. Click on any personnel row in table
2. Verify details drawer opens from left
3. Check drawer displays tabs:
   - Personal Information (מידע אישי)
   - Military Service (שירות צבאי)
   - Contact Details (פרטי קשר)
   - Education & Skills (השכלה וכישורים)
   - Employment (העסקה)
4. Navigate through tabs
5. Verify all fields display correctly
6. Close drawer

**Expected Results:**

- ✅ Drawer opens smoothly with animation
- ✅ All tabs are accessible
- ✅ Data displays in all tabs
- ✅ Hebrew text aligns right (RTL)
- ✅ Close button works
- ✅ Clicking outside closes drawer

---

### TC-PERS-005: Create New Personnel

**Priority:** Critical  
**Prerequisites:** On Personnel page

**Test Steps:**

1. Click "+ הוסף עובד" (Add Employee) button
2. Verify empty form opens in drawer
3. Fill required fields:
   - First Name (שם פרטי) - Hebrew
   - Last Name (שם משפחה) - Hebrew
   - Personal Number (מספר אישי) - 9 digits
   - Email (דוא״ל)
   - Phone (טלפון) - Israeli format
   - Employment Type (סוג העסקה)
   - Position (תפקיד)
4. Fill optional fields in different tabs
5. Click "שמור" (Save)
6. Verify success message
7. Check new record appears in table

**Expected Results:**

- ✅ Form opens in "new" mode
- ✅ All required fields validated
- ✅ Hebrew input works correctly
- ✅ Personal number validates 9 digits
- ✅ Phone validates Israeli format (05X-XXXXXXX)
- ✅ Email format validated
- ✅ Success notification appears
- ✅ Table refreshes with new record
- ✅ Drawer closes after save

---

### TC-PERS-006: Edit Personnel Record

**Priority:** Critical  
**Prerequisites:** Personnel records exist

**Test Steps:**

1. Click on a personnel row to open details
2. Click "ערוך" (Edit) button at bottom
3. Verify form switches to edit mode
4. Modify multiple fields across tabs:
   - Change name
   - Update phone number
   - Modify employment type
   - Update skills
5. Click "עדכן" (Update)
6. Verify success message
7. Verify changes appear in table
8. Reopen record to confirm changes saved

**Expected Results:**

- ✅ Edit mode enables all fields
- ✅ Current data pre-populates form
- ✅ Validation still applies
- ✅ Changes save successfully
- ✅ Optimistic UI update works
- ✅ Data persists after refresh
- ✅ All tabs retain changes

---

### TC-PERS-007: Delete Personnel (Soft Delete)

**Priority:** High  
**Prerequisites:** Personnel records exist

**Test Steps:**

1. Click on personnel row
2. Click "מחק" (Delete) button
3. Verify confirmation dialog appears
4. Click "אישור" (Confirm)
5. Verify success message
6. Check record removed from main table
7. Verify record still exists in database (soft delete)

**Expected Results:**

- ✅ Confirmation dialog requires explicit confirmation
- ✅ Dialog explains action
- ✅ Soft delete (isDeleted=true in DB)
- ✅ Record disappears from view
- ✅ Success notification shows
- ✅ Cannot be viewed in normal list
- ✅ Data preserved for potential restore

---

### TC-PERS-008: Personnel Form Validation

**Priority:** Critical  
**Prerequisites:** On Personnel form

**Test Steps:**

1. Open new personnel form
2. Try to save without filling required fields
3. Verify error messages appear:
   - "שם פרטי הוא שדה חובה" (First name required)
   - "שם משפחה הוא שדה חובה" (Last name required)
4. Enter invalid data:
   - Personal number with letters
   - Personal number < 9 digits
   - Invalid email format
   - Invalid phone format
5. Verify inline validation
6. Correct errors and save successfully

**Expected Results:**

- ✅ Save button disabled until form is valid
- ✅ Required field errors show on blur
- ✅ Error messages in Hebrew
- ✅ Inline validation immediate
- ✅ Personal number accepts only digits
- ✅ Email format validated
- ✅ Phone format validated (050/051/052/053/054/055/058)
- ✅ Form submits only when all validations pass

---

### TC-PERS-009: Enhanced Select Fields

**Priority:** High  
**Prerequisites:** Personnel form with enhanced select

**Test Steps:**

1. Open personnel edit form
2. Find "Assigned Projects" enhanced select field
3. Click to open dropdown
4. Verify searchable dropdown appears
5. Search for project name
6. Select multiple projects
7. Verify selections display as badges
8. Remove a selection
9. Save and verify

**Expected Results:**

- ✅ Dropdown is searchable
- ✅ Options load from Projects collection
- ✅ Multiple selections allowed
- ✅ Selected items show as badges
- ✅ Remove button on each badge works
- ✅ Foreign field data populates
- ✅ Selections persist after save

---

### TC-PERS-010: File Upload (Resume)

**Priority:** Medium  
**Prerequisites:** Personnel form with file field

**Test Steps:**

1. Navigate to "Education & Skills" tab
2. Find "רזומה" (Resume) file upload field
3. Click upload button
4. Select file (PDF/DOCX)
5. Verify upload progress
6. Check file link appears
7. Click to download file
8. Delete file
9. Save form

**Expected Results:**

- ✅ File picker opens
- ✅ Accepts PDF, DOCX formats
- ✅ Upload progress shows
- ✅ File uploads to MinIO
- ✅ File URL stored in database
- ✅ Download link works
- ✅ Delete button removes file
- ✅ Form saves without file if deleted

---

### TC-PERS-011: Table Sorting

**Priority:** High  
**Prerequisites:** Personnel table with data

**Test Steps:**

1. Click on "Name" column header
2. Verify ascending sort (A-Z or א-ת)
3. Click again
4. Verify descending sort (Z-A or ת-א)
5. Test sorting on other columns:
   - Personal Number (numeric)
   - Position (alphabetic)
   - Status (alphabetic)
6. Verify sort indicator shows

**Expected Results:**

- ✅ Sort indicator (arrow) appears
- ✅ Data sorts correctly
- ✅ Hebrew sorts properly (א-ת)
- ✅ Numbers sort numerically
- ✅ Sort persists during pagination
- ✅ Multiple column sorts work

---

### TC-PERS-012: Table Pagination

**Priority:** High  
**Prerequisites:** Personnel table with >10 records

**Test Steps:**

1. Verify pagination controls at bottom
2. Check "Rows per page" dropdown (10, 25, 50, 100)
3. Change to 25 rows per page
4. Click "Next page"
5. Click "Previous page"
6. Jump to specific page number
7. Verify total count display

**Expected Results:**

- ✅ Pagination appears with >10 records
- ✅ Page size options work
- ✅ Navigation buttons work
- ✅ Page numbers are clickable
- ✅ Total records count correct
- ✅ "Showing X-Y of Z" accurate
- ✅ URL updates with page parameter

---

### TC-PERS-013: Export to Excel

**Priority:** Medium  
**Prerequisites:** Personnel records exist

**Test Steps:**

1. Apply filters (optional)
2. Click "ייצא לאקסל" (Export to Excel) button
3. Verify download starts
4. Open Excel file
5. Check data completeness:
   - All visible columns exported
   - Hebrew text preserved
   - Data matches screen
   - File name includes timestamp

**Expected Results:**

- ✅ Excel file downloads
- ✅ All visible records exported
- ✅ Filtered results respected
- ✅ Hebrew characters preserved (UTF-8)
- ✅ Column headers in Hebrew
- ✅ File name: "Personnel_YYYY-MM-DD_HH-MM.xlsx"
- ✅ Formatting is readable

---

### TC-PERS-014: Hebrew Text and RTL Support

**Priority:** High  
**Prerequisites:** Personnel with Hebrew data

**Test Steps:**

1. Create personnel with Hebrew names
2. Verify display in table (RTL alignment)
3. Open details drawer
4. Check all Hebrew text aligns right
5. Verify mixed Hebrew/English content
6. Test search with Hebrew characters
7. Check form labels in Hebrew

**Expected Results:**

- ✅ Hebrew text aligns right
- ✅ English text aligns appropriately
- ✅ No text overflow
- ✅ Icons positioned correctly for RTL
- ✅ Form inputs support Hebrew typing
- ✅ Search works with Hebrew
- ✅ No encoding issues

---

## 5. Module 2: Project Management Tests

### TC-PROJ-001: Project List Page Load

**Priority:** Critical  
**Prerequisites:** All services running

**Test Steps:**

1. Navigate to "ניהול פרויקטים" from sidebar
2. Verify page loads successfully
3. Check page header displays "ניהול פרויקטים"
4. Verify metric cards display:
   - Total Projects
   - Active Projects
   - Completed Projects
   - Pending Approval
5. Verify table displays with columns:
   - Project Name
   - Project Manager
   - Status
   - Start Date
   - End Date
   - Location
   - Actions

**Expected Results:**

- ✅ Page loads within 2 seconds
- ✅ Metrics display correctly
- ✅ Table shows all projects
- ✅ Status badges color-coded
- ✅ Hebrew text displays correctly

---

### TC-PROJ-002: Create New Project

**Priority:** Critical  
**Prerequisites:** On Project Management page

**Test Steps:**
1. Click "הוסף פרויקט" / "Add Project"
2. Fill required fields: `Project Name`, `Project Manager` (select), `Start Date`, `End Date`, `Status`
3. Add optional fields: `Location`, `Description`, `Tags`
4. Save project
5. Verify success notification
6. Verify project appears in table and in enhanced select lists (for Personnel assignment)

**Expected Results:**
- ✅ Project saves and persists
- ✅ Select lists update with new project
- ✅ Project is visible via API `GET /api/projects/:id`

---

### TC-PROJ-003: Edit Project

**Priority:** High

**Test Steps:**
1. Open a project row
2. Click Edit
3. Modify fields (change manager, dates, status)
4. Save and verify notification
5. Verify fields updated in table and via API

**Expected Results:**
- ✅ Changes saved and visible in UI and API

---

### TC-PROJ-004: Assign Personnel to Project

**Priority:** High

**Test Steps:**
1. Open Project details
2. Use enhanced multi-select to add personnel
3. Save
4. Verify assigned personnel appear in project and on Personnel side (cross-reference)

**Expected Results:**
- ✅ Bidirectional relation links persist
- ✅ Assigned people show in both Project and Personnel UI

---

### TC-PROJ-005: Project Filters, Sorting, Pagination

**Priority:** Medium

**Test Steps:**
1. Apply status filters, date ranges, manager filter
2. Sort by start date and name
3. Use pagination

**Expected Results:**
- ✅ Filtering and sorting work correctly
- ✅ Pagination accurate

---

### TC-PROJ-006: Soft Delete & Restore Project

**Priority:** Medium

**Test Steps:**
1. Delete a project (soft delete)
2. Verify it disappears from main list
3. Use admin/archived view to restore
4. Verify restored project returns to list

**Expected Results:**
- ✅ Soft delete flag is set in DB
- ✅ Restore re-enables project

---

## Module 3: Reserve Days Management (צווי מילואים)

### TC-RES-001: Reserve Days List Page Load

**Priority:** Critical

**Test Steps:**
1. Navigate to the Reserve Days page
2. Verify header, metrics (Total Orders, Active Orders)
3. Verify table columns (Order ID, Personnel, Date, Type, Status, Actions)

**Expected Results:**
- ✅ Page loads and table populates

---

### TC-RES-002: Create Reserve Order

**Priority:** High

**Test Steps:**
1. Click "הוסף צו" / Add Order
2. Select personnel (enhanced select), date range, type (מילואים/דחייה/etc.), remarks
3. Save
4. Verify notification and table entry

**Expected Results:**
- ✅ Order saved and appears in table and API

---

### TC-RES-003: Approve/Reject Workflow

**Priority:** High

**Test Steps:**
1. Create an order as regular user
2. Login as approver role (or simulate approval API)
3. Approve order
4. Verify status updates and notifications

**Expected Results:**
- ✅ Workflow status changes persisted
- ✅ Notifications dispatched (if implemented)

---

### TC-RES-004: Export & Reporting

**Priority:** Medium

**Test Steps:**
1. Apply filters (date range, status, personnel)
2. Export CSV/Excel
3. Validate file content matches filtered data

**Expected Results:**
- ✅ Export contains correct data and encoding (UTF-8 for Hebrew)

---

## Cross-Module & Common Tests

### TC-COM-001: Authentication & Authorization

- Verify login/logout
- Verify role-based access to create/edit/delete actions
- Verify UI hides/show actions based on role

### TC-COM-002: Localization / RTL

- Verify Hebrew labels are present
- Verify visual RTL alignment and icons placement
- Verify that entering Hebrew text works in forms and exports

### TC-COM-003: File Upload & Presigned URL Flow

- Verify upload flow (frontend requests presigned URL from backend `POST /api/file/presign`)
- Upload file directly to MinIO using presigned URL
- Verify backend records file URL and file is retrievable

### TC-COM-004: API Contract Tests

- For critical endpoints, validate response schema and status codes (200/201/400/401/403/404/500)

---

## API & Backend Tests (Examples)

Include a small suite of API tests (can be Playwright or a separate test runner like Jest + supertest).

Key endpoints to test:
- `GET /api/forms` - list form definitions
- `GET /api/formFields/get/all` - read form fields (expect schemas from migrations)
- `GET /api/:formId/submissions` - list submissions
- `POST /api/:formId/submissions` - create submission
- `GET /api/quotas` - quotas endpoints
- `POST /api/file/presign` - presign upload

Sample API assertions:
- Create -> 201, Location header, persisted in DB
- Invalid payload -> 400 with validation errors
- Soft delete -> 200 and `isDeleted=true` in DB

---

## Test Data & Seeding

- Use migrations in `apps/server/src/migrations` to prepare deterministic data.
- Provide a `seed` test (already present as `seed.spec.ts`) or a server-side seeding command.
- Recommended seeding sequence for test runs:
  1. Start MongoDB and MinIO
  2. Start backend in `dev` mode with migrations applied
  3. Run `npm run seed` (if available) or call server endpoint to run migrations

Data isolation:
- For CI, use a disposable test database (e.g., `hr-app-test-<ci-run-id>`) or drop collections before/after tests.
- Avoid running the full suite against production data.

---

## Test Execution & CI Guidelines

Local quick runs:
```bash
# start services
npm run services:start
npm run services:check

# run a single spec (headed)
npx playwright test tests/personnel-list-search.spec.ts -p chromium --headed
```

Recommended CI settings:
- Use `workers: 1` on CI when backend rate-limiting occurs.
- Retry flaky tests once (`retries: 1`) on CI.
- Use `trace: on-first-retry`, `screenshot: only-on-failure`.

Stability practices:
- Use seed data and reset DB between test suites
- Limit parallel browser workers to 1–4 depending on backend capacity
- Use stable locators (role, aria-labels, data-testid)
- Mock external services (email, third-party APIs) where possible

---

## Entry / Exit Criteria

Entry Criteria:
- All services are running locally (frontend, backend, DB, MinIO)
- Migrations applied and seed data present
- Playwright environment variables set (if any)

Exit Criteria:
- All critical tests (smoke & CRUD) pass
- No high-severity defects open
- Test coverage for core modules completed

---

## Defect Template (for reporting failed tests)

- **Title**: Short summary (e.g., "Personnel: Create form fails validation for valid email")
- **Environment**: `qa_20/11` branch, Node vXX, Playwright Chromium
- **Steps to reproduce**: numbered steps
- **Expected result**: The expected behavior
- **Actual result**: What happened
- **Logs / Screenshots**: Attach Playwright artifact links (screenshot, trace)
- **API request/response**: Include failing request/response bodies
- **Notes / Workaround**: Any relevant info

---

## Appendix: Helpful commands

- Start services and run full suite (local):
```bash
npm run services:start
npm run services:check
npx playwright test --workers=4
```

- Run only Personnel suite:
```bash
npx playwright test tests/personnel-list-search.spec.ts -p chromium
```


---

End of consolidated plan.
