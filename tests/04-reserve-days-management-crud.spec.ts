// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

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

 test('TC-RES-002: Create New Reserve Days Order', async ({ page }) => {
  // Click Add button — navigates to /new page with dialog
  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('NEW')).toBeVisible();

  // Select employee from the enhancedSelect combobox
  const employeeCombobox = drawer.getByRole('combobox').filter({ hasText: 'חפש ובחר עובד' });
  await employeeCombobox.click();
  await page.waitForTimeout(400);
  await page.getByRole('option').first().click();

  // Fill start date
  await drawer.locator('input[name="startDate"]').fill('2025-03-01');

  // Fill end date
  await drawer.locator('input[name="endDate"]').fill('2025-03-05');

  // Select order type radio
  await drawer.getByRole('radio', { name: 'צו 8 פתוח' }).click();

  // Click Create — navigates back to list
  await drawer.getByRole('button', { name: /✨ Create/i }).click();
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);

  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-RES-003: View Reserve Days Details', async ({ page }) => {
  // Click first row — navigates to /edit/:id page
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
  const firstRow = page.getByRole('table').locator('tbody tr').first();
  await firstRow.click();
  await page.waitForURL('**/edit/**');

  // Change request status combobox
  const requestStatusCombo = page.getByRole('combobox').filter({ hasText: /ממתין לטיפול|אושר|נדחה/ });
  if (await requestStatusCombo.count() > 0) {
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

  // Submit without filling required fields
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
  const nativeRequiredCount = await page.evaluate(() =>
   document.querySelectorAll('input[required], select[required], textarea[required]').length
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

  // Select one
  await drawer.getByRole('radio', { name: 'צו 8 חד יומי' }).click();
  await expect(drawer.getByRole('radio', { name: 'צו 8 חד יומי' })).toBeChecked();

  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/reserve_days_management\/[^/]+$/);
 });
});
