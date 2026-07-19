// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect, APIRequestContext, Page } from '@playwright/test';

const API_ORIGIN = 'http://localhost:3001';

const today = () => new Date().toISOString().split('T')[0];

/** Convert a "YYYY-MM-DD" date string to the "MM/DD/YYYY" format the DatePicker range input expects. */
function toPickerDate(isoDate: string): string {
 const [year, month, day] = isoDate.split('-');
 return `${month}/${day}/${year}`;
}

/**
 * Fill the date-range picker's two "mm/dd/yyyy" inputs within `scope`. Uses
 * pressSequentially (not .fill()) — the ark-ui date-input parses keystrokes as
 * they're typed, and a bulk .fill() on the second (end) input is silently
 * dropped, leaving only the start date registered.
 */
async function fillDateRangeInputs(
 scope: import('@playwright/test').Locator,
 startDate: string,
 endDate: string,
): Promise<void> {
 const dateInputs = scope.getByPlaceholder('mm/dd/yyyy');
 await dateInputs.nth(0).click();
 await dateInputs.nth(0).pressSequentially(toPickerDate(startDate));
 await dateInputs.nth(1).pressSequentially(toPickerDate(endDate));
 // Blur the end input — ark-ui's date-input commits/parses the typed value on
 // blur (fixOnBlur), which is also what triggers the field's onChange into RHF.
 await dateInputs.nth(1).press('Tab');
}

/** Fetch every reserve-day order via the new /api/reserve-days REST endpoint, following pagination. */
async function fetchAllReserveDays(
 request: APIRequestContext,
): Promise<Array<Record<string, any>>> {
 const all: Array<Record<string, any>> = [];
 for (let page = 1; page <= 20; page++) {
  const res = await request.get(`${API_ORIGIN}/api/reserve-days?limit=500&page=${page}`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const items = body.items ?? [];
  all.push(...items);
  const total = body.pagination?.total ?? all.length;
  if (all.length >= total || items.length === 0) break;
 }
 return all;
}

/** Fetch every personnel record via the new /api/personnel REST endpoint, following pagination. */
async function fetchAllPersonnel(request: APIRequestContext): Promise<Array<Record<string, any>>> {
 const all: Array<Record<string, any>> = [];
 for (let page = 1; page <= 20; page++) {
  const res = await request.get(`${API_ORIGIN}/api/personnel?limit=500&page=${page}`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const items = body.items ?? [];
  all.push(...items);
  const total = body.pagination?.total ?? all.length;
  if (all.length >= total || items.length === 0) break;
 }
 return all;
}

/** Find a personnel record with NO reserve order overlapping `date`. */
async function findConflictFreeEmployee(
 request: APIRequestContext,
 date: string,
): Promise<{ personalNumber: string }> {
 const target = new Date(`${date}T00:00:00.000Z`).getTime();
 const orders = await fetchAllReserveDays(request);
 const busy = new Set<string>();
 for (const o of orders) {
  const empId = o.employeeName?._id ?? o.employeeName;
  const s = new Date(o.startDate).getTime();
  const e = new Date(o.endDate).getTime();
  if (empId && s <= target && target <= e) busy.add(String(empId));
 }
 const personnel = await fetchAllPersonnel(request);
 const free = personnel.find(p => !busy.has(String(p._id)) && p.personalNumber);
 expect(free, `no conflict-free employee for ${date}`).toBeTruthy();
 return { personalNumber: free!.personalNumber };
}

/** Create a personnel record directly via the API with known vehicle info. */
async function createPersonnelWithVehicle(
 request: APIRequestContext,
 overrides: Record<string, any> = {},
): Promise<{ _id: string; personalNumber: string; vehicleNumber: string }> {
 const personalNumber = `9${Date.now().toString().slice(-8)}`;
 const vehicleNumber = `12-${Date.now().toString().slice(-3)}-67`;
 const res = await request.post(`${API_ORIGIN}/api/personnel`, {
  data: {
   firstName: 'בדיקה',
   lastName: 'רכבטסט',
   personalNumber,
   vehicleEntry: true,
   vehicleNumber,
   isActive: true,
   ...overrides,
  },
 });
 expect(res.ok(), `personnel create failed: ${res.status()}`).toBe(true);
 const body = await res.json();
 return { _id: body._id, personalNumber, vehicleNumber };
}

/**
 * Fill the reserve-days create drawer for a given employee/date range (does not
 * submit). Selects employee via the EmployeeSelect async search by personalNumber.
 */
async function fillReserveDayDrawer(
 page: import('@playwright/test').Page,
 personalNumber: string,
 startDate: string,
 endDate: string,
): Promise<void> {
 const drawer = page.getByRole('dialog');
 await expect(drawer).toBeVisible();

 await drawer.getByRole('combobox').filter({ hasText: 'חפש ובחר עובד' }).click();
 const search = page.getByPlaceholder('Search...');
 await expect(search).toBeVisible();
 await search.fill(personalNumber);
 await page.waitForTimeout(400);
 await page.getByRole('option').filter({ hasText: personalNumber }).first().click();

 await fillDateRangeInputs(drawer, startDate, endDate);
 await drawer.getByText('צו 8 פתוח', { exact: true }).click();
 // requestStatus (required)
 const statusCombo = drawer
  .getByRole('combobox')
  .filter({ hasText: /בחר סטטוס בקשה|ממתין לטיפול|אושר|נדחה/ });
 await statusCombo.first().click();
 await page.getByRole('option', { name: 'ממתין לטיפול', exact: true }).first().click();
}

/**
 * Read the numeric value shown on a MetricCard given its label text.
 * MetricCard renders <Text>{label}</Text> and <Text>{value}</Text> as direct
 * siblings inside a common Box (components/common/MetricCard.tsx). We locate the
 * label and read the immediately-following sibling element.
 */
async function readMetricValue(scope: Page, label: string): Promise<number> {
 const labelNode = scope.getByText(label, { exact: true }).first();
 await expect(labelNode).toBeVisible();
 const valueText = await labelNode.locator('xpath=following-sibling::*[1]').innerText();
 const parsed = Number(valueText.trim());
 expect(Number.isNaN(parsed), `metric "${label}" value "${valueText}" is not numeric`).toBe(false);
 return parsed;
}

/** Poll a MetricCard value until it satisfies `predicate` (async refetch). */
async function expectMetricToReach(
 page: Page,
 label: string,
 predicate: (value: number) => boolean,
 timeout: number,
): Promise<void> {
 await expect(async () => {
  const value = await readMetricValue(page, label);
  expect(predicate(value)).toBe(true);
 }).toPass({ timeout });
}

/**
 * Create a reserve-days record via the UI from the list page, using a
 * conflict-free employee for `date` so the noOverlap rule doesn't reject it.
 */
async function createReserveDay(
 page: Page,
 request: APIRequestContext,
 date: string,
 requestStatusLabel = 'ממתין לטיפול',
): Promise<void> {
 const { personalNumber } = await findConflictFreeEmployee(request, date);

 await page.getByRole('button', { name: 'צווי מילואים' }).click();
 await page.waitForURL('**/new');
 await fillReserveDayDrawer(page, personalNumber, date, date);

 if (requestStatusLabel !== 'ממתין לטיפול') {
  const statusCombo = page
   .getByRole('dialog')
   .getByRole('combobox')
   .filter({ hasText: /בחר סטטוס בקשה|ממתין לטיפול|אושר|נדחה/ });
  await statusCombo.first().click();
  await page.getByRole('option', { name: requestStatusLabel, exact: true }).first().click();
 }

 await page
  .getByRole('dialog')
  .getByRole('button', { name: /✨ Create/i })
  .click();
 await page.waitForURL(/\/reserve_days_management\/default$/);
 await expect(page.getByRole('table')).toBeVisible();
}

test.describe('Module 3: Reserve Days Management', () => {
 // Tests create/edit/delete real records and some click the first/last table
 // row by position, so they must not run concurrently with each other —
 // parallel workers mutate shared data mid-test and destabilize row order.
 test.describe.configure({ mode: 'serial' });

 test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.getByRole('group').filter({ hasText: 'צווי מילואיםReserve Days Management' }).click();
  await page.waitForURL('**/reserve_days_management/**');
  await expect(page.getByRole('heading', { name: 'צווי מילואים' })).toBeVisible();
 });

 test('TC-RES-001: Reserve Days List Page Load', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'צווי מילואים' })).toBeVisible();

  // Verify table
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();

  // Verify table headers
  await expect(page.getByRole('columnheader', { name: /שם העובד/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /סוג צו/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /סטטוס בקשה/ })).toBeVisible();

  // Verify filter dropdowns
  await expect(page.getByRole('combobox').filter({ hasText: 'כל הבקשות' })).toBeVisible();
  await expect(page.getByRole('combobox').filter({ hasText: 'כל הסוגים' })).toBeVisible();
 });

 test('TC-RES-002: Create New Reserve Days Order', async ({ page, request }) => {
  const startDate = '2025-03-01';
  const endDate = '2025-03-05';
  // Picking the first EmployeeSelect option accumulates conflicts across test
  // runs (each run adds a new order at this fixed date), eventually 409ing.
  // Use a conflict-free employee instead, selected by unique personalNumber.
  const { personalNumber } = await findConflictFreeEmployee(request, startDate);

  // Click Add button — navigates to /new page with dialog
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('NEW')).toBeVisible();

  // Select employee from the EmployeeSelect combobox by searching personalNumber.
  const employeeCombobox = drawer.getByRole('combobox').filter({ hasText: 'חפש ובחר עובד' });
  await employeeCombobox.click();
  const search = page.getByPlaceholder('Search...');
  await expect(search).toBeVisible();
  await search.fill(personalNumber);
  await page.waitForTimeout(400);
  await page.getByRole('option').filter({ hasText: personalNumber }).first().click();

  // Fill the date-range picker (single field, two mm/dd/yyyy inputs)
  await fillDateRangeInputs(drawer, startDate, endDate);

  // Select order type radio — click the visible label, not the input; Chakra
  // renders a visually-hidden control span that can intercept a direct click.
  await drawer.getByText('צו 8 פתוח', { exact: true }).click();

  // requestStatus is required; select it explicitly.
  const statusCombo = drawer
   .getByRole('combobox')
   .filter({ hasText: /בחר סטטוס בקשה|ממתין לטיפול|אושר|נדחה/ });
  await statusCombo.first().click();
  await page.getByRole('option', { name: 'ממתין לטיפול', exact: true }).first().click();

  // Click Create — navigates back to list
  await drawer.getByRole('button', { name: /✨ Create/i }).click();
  await page.waitForURL(/\/reserve_days_management\/default$/);

  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-RES-003: View Reserve Days Details', async ({ page }) => {
  // Click first row — navigates to /edit/:id page. Wait for the table to settle
  // (large dataset re-renders after the initial paint) so the click lands on a
  // stable row instead of one about to be replaced.
  await expect(page.getByRole('table')).toBeVisible();
  await page.waitForTimeout(300);
  const firstRow = page.getByRole('table').locator('tbody tr').first();
  await firstRow.click();
  await page.waitForURL('**/edit/**');

  // Edit page should show Update/Delete/Cancel buttons
  await expect(page.getByRole('button', { name: /💾 Update/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Delete/i })).toBeVisible();

  // Key fields are present — the date-range picker's two mm/dd/yyyy inputs
  const dateInputs = page.getByPlaceholder('mm/dd/yyyy');
  await expect(dateInputs.nth(0)).toBeVisible();
  await expect(dateInputs.nth(1)).toBeVisible();

  // Cancel navigates back to list
  await page.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/default$/);
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-RES-004: Edit Reserve Days Order - Change Request Status', async ({ page }) => {
  await expect(page.getByRole('table')).toBeVisible();
  await page.waitForTimeout(300);
  const firstRow = page.getByRole('table').locator('tbody tr').first();
  await firstRow.click();
  await page.waitForURL('**/edit/**');

  // Change request status combobox
  const requestStatusCombo = page
   .getByRole('combobox')
   .filter({ hasText: /ממתין לטיפול|אושר|נדחה/ });
  if ((await requestStatusCombo.count()) > 0) {
   await requestStatusCombo.click();
   await page.waitForTimeout(300);
   await page.getByRole('option', { name: 'אושר' }).click();
  }

  // Update — navigates back to list
  await page.getByRole('button', { name: /💾 Update/i }).click();
  await page.waitForURL(/\/reserve_days_management\/default$/);

  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-RES-005: Delete Reserve Days Order', async ({ page }) => {
  const lastRow = page.getByRole('table').locator('tbody tr').last();
  await lastRow.click();
  await page.waitForURL('**/edit/**');

  const deleteButton = page.getByRole('button', { name: /Delete/i });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  await expect(page.getByText(/deleted successfully|נמחק בהצלחה|Success/i).first()).toBeVisible({
   timeout: 5000,
  });

  // After delete, navigates back to list
  await page.waitForURL(/\/reserve_days_management\/default$/);
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-RES-006: Form Validation - Required Fields', async ({ page }) => {
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // The Create button stays disabled until the form is dirty; make it dirty by
  // selecting an order type (label click — see TC-RES-002 for why), while
  // leaving the other required fields empty to trigger validation.
  await drawer.getByText('צו 8 פתוח', { exact: true }).click();

  // Submit without filling the other required fields
  await drawer.getByRole('button', { name: /✨ Create/i }).click();

  // Form stays on /new page (validation failed)
  await expect(page).toHaveURL(/\/new$/);

  // Required fields still present — the date-range picker's two mm/dd/yyyy inputs
  await expect(drawer.getByPlaceholder('mm/dd/yyyy').first()).toBeVisible();

  // Cancel back to list
  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/default$/);
 });

 test('TC-RES-007: Filter by Request Status', async ({ page }) => {
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();

  const requestStatusFilter = page.getByRole('combobox').filter({ hasText: 'כל הבקשות' });
  await requestStatusFilter.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: 'אושר' }).click();
  await page.waitForTimeout(500);

  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-RES-009: Search Reserve Days', async ({ page }) => {
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();

  const searchBox = page.getByRole('textbox', { name: 'חפש בכל העמודות' });
  await searchBox.fill('לאה');

  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-RES-010: Table Pagination', async ({ page }) => {
  const pagination = page.getByRole('navigation', { name: 'pagination' });
  await expect(pagination).toBeVisible();
  await expect(page.getByText('Rows per page:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'page 1', exact: true })).toBeVisible();
 });

 test('TC-RES-012: No native browser validation - RHF errors shown instead', async ({ page }) => {
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // Verify no native required attributes leak onto inputs/selects
  const nativeRequiredCount = await page.evaluate(
   () => document.querySelectorAll('input[required], select[required], textarea[required]').length,
  );
  expect(nativeRequiredCount).toBe(0);

  // Click a radio option (makes form dirty, enabling the Create button)
  await drawer.getByText('צו 8 פתוח').click();
  await expect(drawer.getByRole('radio', { name: 'צו 8 פתוח' })).toBeChecked();

  // Submit with other required fields still empty
  await drawer.getByRole('button', { name: /✨ Create/i }).click();

  // Page stays on /new — RHF blocked submission
  await expect(page).toHaveURL(/\/new$/);

  // RHF error messages appear in the drawer (chakra-field__errorText spans)
  await expect(drawer.locator('.chakra-field__errorText').first()).toBeVisible();

  // Specific required field errors are shown
  await expect(drawer.getByText('שם העובד הוא שדה חובה')).toBeVisible();
  await expect(drawer.getByText('תקופת שירות הינו שדה חובה')).toBeVisible();

  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/default$/);
 });

 test('TC-RES-011: Order Type Radio Selection', async ({ page }) => {
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // Verify all 4 order type options are available
  await expect(drawer.getByRole('radio', { name: 'צו 8 פתוח' })).toBeVisible();
  await expect(drawer.getByRole('radio', { name: 'צו 8 חד יומי' })).toBeVisible();
  await expect(drawer.getByRole('radio', { name: 'יממ שיגרה פתוח' })).toBeVisible();
  await expect(drawer.getByRole('radio', { name: 'יממ שיגרה חד יומי' })).toBeVisible();

  // Select one — click the visible label, not the input; Chakra renders a
  // visually-hidden control span that can intercept a direct click on the radio.
  await drawer.getByText('צו 8 חד יומי', { exact: true }).click();
  await expect(drawer.getByRole('radio', { name: 'צו 8 חד יומי' })).toBeChecked();

  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/default$/);
 });

 test('TC-RES-013: Overlapping order for same employee is rejected (409 noOverlap)', async ({
  page,
  request,
 }) => {
  // Use a far-future window so the first create itself never conflicts with
  // existing seed data; the second create must then conflict with the first.
  const startDate = '2027-03-01';
  const endDate = '2027-03-10';
  const { personalNumber } = await findConflictFreeEmployee(request, startDate);

  // 1) First order for this employee/window — should succeed (201) and return.
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');
  await fillReserveDayDrawer(page, personalNumber, startDate, endDate);
  await page
   .getByRole('dialog')
   .getByRole('button', { name: /✨ Create/i })
   .click();
  await page.waitForURL(/\/reserve_days_management\/default$/);
  await expect(page.getByRole('table')).toBeVisible();

  // 2) Second order for the SAME employee with an overlapping window — the
  // noOverlap business rule must reject it with HTTP 409.
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');
  // Overlaps the first window (2027-03-05 falls within 03-01..03-10).
  await fillReserveDayDrawer(page, personalNumber, '2027-03-05', '2027-03-15');

  const conflictResponse = page.waitForResponse(
   r =>
    r.url().toLowerCase().includes('/reserve-days') &&
    r.request().method() === 'POST' &&
    r.status() === 409,
   { timeout: 15_000 },
  );
  await page
   .getByRole('dialog')
   .getByRole('button', { name: /✨ Create/i })
   .click();

  // The server returns 409 and the UI stays on the create page (not navigated).
  const resp = await conflictResponse;
  expect(resp.status()).toBe(409);
  await expect(page).toHaveURL(/\/new$/);

  // A conflict error toast (Hebrew "צו חופף") is shown to the user.
  await expect(page.getByText(/צו חופף/).first()).toBeVisible({ timeout: 5000 });
 });

 test('TC-RES-017: Date-range picker blocks already-reserved days and flags a conflicting selection', async ({
  page,
  request,
 }) => {
  // Seed a known reserve-day window for a conflict-free employee via the API,
  // then reproduce the same window through the UI's date-range picker. Anchored
  // to day 10-12 of *next* month, so the test also exercises the calendar's
  // "next month" navigation (the picker always opens on today's month).
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 10));
  const startDate = toIso(base);
  const endDateObj = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 12));
  const endDate = toIso(endDateObj);
  const { personalNumber } = await findConflictFreeEmployee(request, startDate);

  const personnelRes = await request.get(
   `${API_ORIGIN}/api/personnel?limit=500&page=1&search=${personalNumber}`,
  );
  expect(personnelRes.ok()).toBe(true);
  const { items: personnelItems } = await personnelRes.json();
  const employeeId = personnelItems.find((p: any) => p.personalNumber === personalNumber)?._id;
  expect(employeeId, `employee id for ${personalNumber} not found`).toBeTruthy();

  const seedRes = await request.post(`${API_ORIGIN}/api/reserve-days`, {
   data: {
    employeeName: employeeId,
    startDate,
    endDate,
    orderType: '8open',
    requestStatus: 'pending',
    fundingSource: 'internal',
   },
  });
  expect(seedRes.ok(), `seed reserve-day create failed: ${seedRes.status()}`).toBe(true);

  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // No conflict indicator before an employee/range is chosen.
  await expect(drawer.getByText(/חופף/)).not.toBeVisible();

  await drawer.getByRole('combobox').filter({ hasText: 'חפש ובחר עובד' }).click();
  const search = page.getByPlaceholder('Search...');
  await expect(search).toBeVisible();
  await search.fill(personalNumber);
  await page.waitForTimeout(400);
  // Match the option containing this exact personalNumber in parentheses — a
  // plain substring filter can land on the wrong option if the number is a
  // substring of another employee's number/id in the (debounced) result list.
  await page
   .getByRole('option', { name: new RegExp(`\\(${personalNumber}\\)`) })
   .first()
   .click();
  // Give the employee-reserved-ranges query (fired on employee selection) time
  // to resolve before opening the calendar, so the disabled-dates set is populated.
  await page.waitForLoadState('networkidle');

  // Open the calendar (opens on today's month) and navigate to next month,
  // where the seeded window lives, then confirm a reserved day is disabled.
  await drawer.getByRole('button', { name: 'Open calendar' }).click();
  const calendar = page.locator('[role="application"]');
  await expect(calendar).toBeVisible();
  // The day/month/year views each render their own (CSS-hidden) prev/next
  // triggers simultaneously, so "Switch to next month" matches 3 elements —
  // scope to the one that's actually visible.
  await calendar.getByLabel('Switch to next month').locator('visible=true').click();

  // Target the day-view cell by its zag-js data-value (the exact ISO date) —
  // the day/month/year views all coexist in the DOM simultaneously, so a plain
  // day-number match (e.g. "10") is ambiguous with month/year view cells.
  const reservedDayCell = calendar.locator(`[data-view="day"][data-value="${startDate}"]`);
  await expect(reservedDayCell).toHaveAttribute('aria-disabled', 'true');
  await drawer.getByRole('button', { name: 'Close calendar' }).click();

  // Selecting the exact reserved window for this employee surfaces a controlled
  // RHF error instead of silently allowing an invalid overlapping submission.
  await fillDateRangeInputs(drawer, startDate, endDate);
  await expect(drawer.getByText(/חופף/)).toBeVisible({ timeout: 5000 });

  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/default$/);
 });

 test('TC-RES-014: Filter by Order Type', async ({ page }) => {
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();

  const orderTypeFilter = page.getByRole('combobox').filter({ hasText: 'כל הסוגים' });
  await orderTypeFilter.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: 'צו 8 פתוח' }).click();
  await page.waitForTimeout(500);

  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-RES-015: Vehicle Status Display Field Updates Live On Employee Selection', async ({
  page,
  request,
 }) => {
  // Seed a personnel record via the API (not the UI) with known vehicle info,
  // so this assertion is deterministic and doesn't depend on file 02's test
  // having run first.
  const { personalNumber, vehicleNumber } = await createPersonnelWithVehicle(request);

  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // vehicleStatus is read-only and shows "—" until an employee is selected.
  const vehicleStatusGroup = drawer.getByText('סטטוס רכב').locator('..');
  await expect(vehicleStatusGroup).toContainText('—');

  // Select the seeded employee via the EmployeeSelect search-by-personalNumber.
  await drawer.getByRole('combobox').filter({ hasText: 'חפש ובחר עובד' }).click();
  const search = page.getByPlaceholder('Search...');
  await expect(search).toBeVisible();
  await search.fill(personalNumber);
  await page.waitForTimeout(400);
  await page.getByRole('option').filter({ hasText: personalNumber }).first().click();

  // The vehicleStatus field live-looks-up the selected employee's personnel
  // record with no save required: vehicleEntry renders as a green-check
  // "img" (aria-label "Yes") when true, plus the vehicleNumber text.
  await expect(vehicleStatusGroup.getByRole('img', { name: 'Yes' })).toBeVisible({
   timeout: 5000,
  });
  await expect(vehicleStatusGroup).toContainText(vehicleNumber);

  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/default$/);
 });

 test('TC-RES-016: Creating a reserve day updates its page MetricCards immediately', async ({
  page,
  request,
 }) => {
  test.setTimeout(90_000);

  const totalBefore = await readMetricValue(page, 'סה"כ צווים');
  const pendingBefore = await readMetricValue(page, 'ממתינים לאישור');

  // Create mutation invalidates the reserve-days metrics query, so both cards
  // must bump without a page reload.
  await createReserveDay(page, request, today(), 'ממתין לטיפול');

  await expectMetricToReach(page, 'סה"כ צווים', v => v === totalBefore + 1, 15_000);
  await expectMetricToReach(page, 'ממתינים לאישור', v => v === pendingBefore + 1, 15_000);
 });
});
