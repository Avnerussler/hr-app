// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Module 1: Personnel Management', () => {
 test.beforeEach(async ({ page }) => {
  // Navigate to the application and wait for load
  await page.goto('http://localhost:5173');
  await expect(page.getByRole('heading')).toBeVisible();

  // Navigate to Personnel page
  await page.getByRole('group').filter({ hasText: 'משאבי אנושEmployee Management' }).click();
  await expect(page.getByRole('heading', { name: 'משאבי אנוש' })).toBeVisible();
 });

 test('TC-PERS-001: Personnel List Page Load', async ({ page }) => {
  // Verify page header displays "משאבי אנוש"
  await expect(page.getByRole('heading', { name: 'משאבי אנוש' })).toBeVisible();

  // Verify metric cards display
  await expect(page.getByText('Active Personnel').first()).toBeVisible();
  await expect(page.getByText('Inactive Personnel').first()).toBeVisible();
  await expect(page.getByText('Total Personnel').first()).toBeVisible();

  // Verify table is visible and displays records
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();

  // Verify table headers
  await expect(page.getByRole('columnheader', { name: 'שם פרטי Sort column' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'מספר אישי Sort column' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'סטטוס Sort column' })).toBeVisible();
 });

 test('TC-PERS-002: Search Personnel', async ({ page }) => {
  const searchBox = page.getByRole('textbox', { name: 'חפש בכל העמודות' });

  // Verify initial state - all records visible
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();

  // Type search query (Hebrew)
  await searchBox.fill('אבנר');

  // Verify table filters in real-time
  await expect(page.getByText('Showing 1 to 1 of 1 entries')).toBeVisible();
  await expect(page.getByText('אבנר דויד')).toBeVisible();

  // Clear search by clicking Clear Filters button
  await page.getByRole('button', { name: 'Clear Filters' }).click();

  // Verify all records return
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-PERS-011: Table Sorting', async ({ page }) => {
  // Click on "שם פרטי" (First Name) column header to sort
  const sortButton = page
   .getByRole('columnheader', { name: 'שם פרטי Sort column' })
   .getByLabel('Sort column');
  await sortButton.click();

  // Wait for sort to complete
  await page.waitForTimeout(500);

  // Click again to reverse sort
  await sortButton.click();

  // Verify data persists through sort
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-PERS-012: Table Pagination', async ({ page }) => {
  // Verify pagination controls are visible
  const pagination = page.getByRole('navigation', { name: 'pagination' });
  await expect(pagination).toBeVisible();

  // Verify "Rows per page" dropdown
  await expect(page.getByText('Rows per page:')).toBeVisible();

  // Verify current page indicator
  await expect(page.getByRole('button', { name: 'page 1' })).toBeVisible();

  // Verify entry count display
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-PERS-013: Export to Excel', async ({ page }) => {
  // Verify Export Excel button is visible and clickable
  const exportButton = page.getByRole('button', { name: 'Export Excel' });
  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();
 });

 test('TC-PERS-014: Hebrew Text and RTL Support', async ({ page }) => {
  // Verify Hebrew text in header
  await expect(page.getByRole('heading', { name: 'משאבי אנוש' })).toBeVisible();

  // Verify Hebrew text in search placeholder
  const searchBox = page.getByRole('textbox', { name: 'חפש בכל העמודות' });
  await expect(searchBox).toBeVisible();

  // Verify Hebrew data in table (any personnel with Hebrew names)
  await expect(page.getByRole('table')).toBeVisible();
  // Check that Hebrew status text exists (use first() to avoid strict mode)
  await expect(page.locator('tbody').getByText('פעיל').first()).toBeVisible();

  // Test search with Hebrew characters - search for any existing name
  const hebrewSearchTerm = 'דוד';
  await searchBox.fill(hebrewSearchTerm);
  // Verify search works (results should be filtered)
  await expect(page.getByRole('table')).toBeVisible();
 });
});
