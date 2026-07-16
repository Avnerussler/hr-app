// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect, APIRequestContext } from '@playwright/test';

const API_ORIGIN = 'http://localhost:3001';

/** Fetch every submission of a form, following pagination. */
async function fetchAllSubmissions(
 request: APIRequestContext,
 formName: string,
): Promise<Array<Record<string, any>>> {
 const all: Array<Record<string, any>> = [];
 for (let page = 1; page <= 20; page++) {
  const res = await request.get(
   `${API_ORIGIN}/api/formSubmission?formName=${formName}&limit=500&page=${page}`,
  );
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const forms = (body.forms ?? []).filter((f: { formName?: string }) => f.formName === formName);
  all.push(...forms);
  const total = body.pagination?.total ?? all.length;
  if (all.length >= total || forms.length === 0) break;
 }
 return all;
}

/** Find a personnel record with NO reserve order overlapping `date`. */
async function findConflictFreeEmployee(
 request: APIRequestContext,
 date: string,
): Promise<{ personalNumber: string }> {
 const target = new Date(`${date}T00:00:00.000Z`).getTime();
 const orders = await fetchAllSubmissions(request, 'reserve_days_management');
 const busy = new Set<string>();
 for (const o of orders) {
  const fd = o.formData;
  const empId = fd.employeeName?._id ?? fd.employeeName;
  const s = new Date(fd.startDate).getTime();
  const e = new Date(fd.endDate).getTime();
  if (empId && s <= target && target <= e) busy.add(String(empId));
 }
 const personnel = await fetchAllSubmissions(request, 'personnel');
 const free = personnel.find(p => !busy.has(String(p._id)) && p.formData.personalNumber);
 expect(free, `no conflict-free employee for ${date}`).toBeTruthy();
 return { personalNumber: free!.formData.personalNumber };
}

/**
 * Fill the reserve-days create drawer for a given employee/date range (does not
 * submit). Selects employee via the enhancedSelect search by personalNumber.
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

 await drawer.locator('input[name="startDate"]').fill(startDate);
 await drawer.locator('input[name="endDate"]').fill(endDate);
 await drawer.getByText('צו 8 פתוח', { exact: true }).click();
 // requestStatus (required)
 const statusCombo = drawer
  .getByRole('combobox')
  .filter({ hasText: /בחר סטטוס בקשה|ממתין לטיפול|אושר|נדחה/ });
 await statusCombo.first().click();
 await page.getByRole('option', { name: 'ממתין לטיפול', exact: true }).first().click();
}

test.describe('Module 3: Reserve Days Management', () => {
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
  await expect(page.getByRole('combobox').filter({ hasText: 'כל הצווים' })).toBeVisible();
  await expect(page.getByRole('combobox').filter({ hasText: 'כל הבקשות' })).toBeVisible();
 });

 test('TC-RES-002: Create New Reserve Days Order', async ({ page, request }) => {
  const startDate = '2025-03-01';
  const endDate = '2025-03-05';
  // Picking the first enhancedSelect option accumulates conflicts across test
  // runs (each run adds a new order at this fixed date), eventually 409ing.
  // Use a conflict-free employee instead, selected by unique personalNumber.
  const { personalNumber } = await findConflictFreeEmployee(request, startDate);

  // Click Add button — navigates to /new page with dialog
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('NEW')).toBeVisible();

  // Select employee from the enhancedSelect combobox by searching personalNumber.
  const employeeCombobox = drawer.getByRole('combobox').filter({ hasText: 'חפש ובחר עובד' });
  await employeeCombobox.click();
  const search = page.getByPlaceholder('Search...');
  await expect(search).toBeVisible();
  await search.fill(personalNumber);
  await page.waitForTimeout(400);
  await page.getByRole('option').filter({ hasText: personalNumber }).first().click();

  // Fill start date
  await drawer.locator('input[name="startDate"]').fill(startDate);

  // Fill end date
  await drawer.locator('input[name="endDate"]').fill(endDate);

  // Select order type radio — click the visible label, not the input; Chakra
  // renders a visually-hidden control span that can intercept a direct click.
  await drawer.getByText('צו 8 פתוח', { exact: true }).click();

  // Click Create — navigates back to list
  await drawer.getByRole('button', { name: /✨ Create/i }).click();
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);

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

  // Key fields are present
  await expect(page.locator('input[name="startDate"]')).toBeVisible();
  await expect(page.locator('input[name="endDate"]')).toBeVisible();

  // Cancel navigates back to list
  await page.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);
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
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);

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
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);
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

  // Required fields still present
  await expect(drawer.locator('input[name="startDate"]')).toBeVisible();

  // Cancel back to list
  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);
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

 test('TC-RES-008: Filter by Active Status', async ({ page }) => {
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();

  const activeFilter = page.getByRole('combobox').filter({ hasText: 'כל הצווים' });
  await activeFilter.click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: 'צווים פעילים' }).click();
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
  await expect(drawer.getByText('תאריך התחלה הוא שדה חובה')).toBeVisible();

  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);
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
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);
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
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);
  await expect(page.getByRole('table')).toBeVisible();

  // 2) Second order for the SAME employee with an overlapping window — the
  // noOverlap business rule must reject it with HTTP 409.
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');
  // Overlaps the first window (2027-03-05 falls within 03-01..03-10).
  await fillReserveDayDrawer(page, personalNumber, '2027-03-05', '2027-03-15');

  const conflictResponse = page.waitForResponse(
   r => r.url().toLowerCase().includes('/formsubmission/create') && r.status() === 409,
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
});
