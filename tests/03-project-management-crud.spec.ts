// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Module 2: Project Management', () => {
 test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.getByRole('group').filter({ hasText: 'ניהול פרויקטיםProject Tracking' }).click();
  await page.waitForURL('**/project_management/**');
  await expect(page.getByRole('heading', { name: 'ניהול פרויקטים' })).toBeVisible();
 });

 test('TC-PROJ-001: Project List Page Load', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'ניהול פרויקטים' })).toBeVisible();

  // Verify metric cards
  await expect(page.getByText('Total Projects').first()).toBeVisible();
  await expect(page.getByText('Active Projects').first()).toBeVisible();
  await expect(page.getByText('Inactive Projects').first()).toBeVisible();

  // Verify table is visible
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();

  // Verify table headers
  await expect(page.getByRole('columnheader', { name: /שם הפרויקט/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /סטטוס הפרוייקט/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /מנהל פרויקט/ })).toBeVisible();
 });

 test('TC-PROJ-002: Create New Project', async ({ page }) => {
  const projectName = 'פרויקט ' + faker.word.noun();

  // Click Add button — navigates to /new page with a dialog
  await page.getByRole('button', { name: 'ניהול פרויקטים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // Fill project name (only required field)
  await drawer.locator('input[name="projectName"]').fill(projectName);

  // Click Create — navigates back to list
  await drawer.getByRole('button', { name: /✨ Create/i }).click();
  await page.waitForURL('**/project_management/**');
  await page.waitForURL(/\/project_management\/[^/]+$/);

  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PROJ-003: View Project Details', async ({ page }) => {
  // Click first table row — navigates to /edit/:id page
  const firstRow = page.getByRole('table').locator('tbody tr').first();
  await firstRow.click();
  await page.waitForURL('**/edit/**');

  // Edit page should show Update/Delete/Cancel buttons
  await expect(page.getByRole('button', { name: /💾 Update/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Delete/i })).toBeVisible();

  // Form should contain projectName field
  await expect(page.locator('input[name="projectName"]')).toBeVisible();

  // Cancel navigates back to list
  await page.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL('**/project_management/**');
  await page.waitForURL(/\/project_management\/[^/]+$/);
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PROJ-004: Edit Project', async ({ page }) => {
  const updatedName = 'עדכון ' + faker.word.noun();

  // Click first row — navigates to edit page
  const firstRow = page.getByRole('table').locator('tbody tr').first();
  await firstRow.click();
  await page.waitForURL('**/edit/**');

  // Update project name
  const nameInput = page.locator('input[name="projectName"]');
  await nameInput.clear();
  await nameInput.fill(updatedName);

  // Update navigates back to list
  await page.getByRole('button', { name: /💾 Update/i }).click();
  await page.waitForURL(/\/project_management\/[^/]+$/);

  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PROJ-005: Delete Project', async ({ page }) => {
  // Click last table row — navigates to edit page
  const lastRow = page.getByRole('table').locator('tbody tr').last();
  await lastRow.click();
  await page.waitForURL('**/edit/**');

  const deleteButton = page.getByRole('button', { name: /Delete/i });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  // Verify success notification
  await expect(page.getByText(/deleted successfully|נמחק בהצלחה|Success/i).first()).toBeVisible({
   timeout: 5000,
  });

  // After delete, navigates back to list
  await page.waitForURL(/\/project_management\/[^/]+$/);
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PROJ-006: Form Validation - Required Field', async ({ page }) => {
  await page.getByRole('button', { name: 'ניהול פרויקטים' }).click();
  await page.waitForURL('**/new');

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // Submit without filling required projectName
  await drawer.getByRole('button', { name: /✨ Create/i }).click();

  // Form stays on /new page (validation failed)
  await expect(page).toHaveURL(/\/new$/);

  // projectName field is still present
  await expect(drawer.locator('input[name="projectName"]')).toBeVisible();

  // Cancel back to list
  await drawer.getByRole('button', { name: /Cancel/i }).click();
  await page.waitForURL(/\/project_management\/[^/]+$/);
 });

 test('TC-PROJ-007: Search Projects', async ({ page }) => {
  // Verify initial state
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();

  // Get first row's project name for search
  const firstCell = page.getByRole('table').locator('tbody tr').first().locator('td').first();
  const projectName = await firstCell.innerText();

  const searchBox = page.getByRole('textbox', { name: 'חפש בכל העמודות' });
  await searchBox.fill(projectName.trim());

  // Table should filter
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText(projectName.trim()).first()).toBeVisible();

  // Clear search
  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-PROJ-008: Table Sorting', async ({ page }) => {
  const sortBtn = page
   .getByRole('columnheader', { name: /שם הפרויקט/ })
   .getByLabel('Sort column');
  await sortBtn.click();
  await page.waitForTimeout(500);
  await sortBtn.click();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-PROJ-009: Table Pagination', async ({ page }) => {
  const pagination = page.getByRole('navigation', { name: 'pagination' });
  await expect(pagination).toBeVisible();
  await expect(page.getByText('Rows per page:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'page 1', exact: true })).toBeVisible();
 });
});
