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

  // Verify table headers (each header's sortable label includes its current sort state)
  await expect(page.getByRole('columnheader', { name: /שם פרטי/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /מספר אישי/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /סטטוס/ })).toBeVisible();
 });

 test('TC-PERS-002: Search by first name', async ({ page }) => {
  const searchBox = page.getByRole('textbox', { name: 'חפש בכל העמודות' });

  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();

  await searchBox.fill('אבנר');
  await expect(page.getByText('Showing 1 to 1 of 1 entries')).toBeVisible();
  await expect(page.getByText('אבנר דויד')).toBeVisible();

  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-PERS-003: Search by first name + last name combined', async ({ page }) => {
  const searchBox = page.getByRole('textbox', { name: 'חפש בכל העמודות' });

  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();

  // Search full name "אבנר דויד רוסלר" — firstName="אבנר דויד", lastName="רוסלר"
  await searchBox.fill('אבנר דויד רוסלר');
  await expect(page.getByText('Showing 1 to 1 of 1 entries')).toBeVisible();
  await expect(page.getByText('אבנר דויד')).toBeVisible();
  await expect(page.getByText('רוסלר')).toBeVisible();

  // Also verify partial last name search
  await searchBox.fill('שמיט');
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
  await expect(page.locator('tbody').getByText('שמיט').first()).toBeVisible();

  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-PERS-004: Search by personal number', async ({ page }) => {
  const searchBox = page.getByRole('textbox', { name: 'חפש בכל העמודות' });

  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();

  // Search by exact personal number
  await searchBox.fill('1233455');
  await expect(page.getByText('Showing 1 to 1 of 1 entries')).toBeVisible();
  await expect(page.getByText('1233455')).toBeVisible();
  await expect(page.getByText('אבנר דויד')).toBeVisible();

  // Search by partial personal number
  await searchBox.fill('3687412');
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
  await expect(page.getByText('3687412')).toBeVisible();

  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
 });

 test('TC-PERS-011: Table Sorting', async ({ page }) => {
  // Click on "שם פרטי" (First Name) column header to sort — the sort control is the whole
  // header (role="button"), whose accessible name reflects the current sort state.
  const sortButton = page.getByRole('button', { name: /Sort by שם פרטי/ });

  const firstColumnCells = () => page.locator('tbody tr td:first-child');

  await sortButton.click();
  await expect(
   page.getByRole('button', { name: /Sort by שם פרטי, currently ascending/ }),
  ).toBeVisible();

  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();

  // Row order should be ascending by first name on the current page
  const ascValues = await firstColumnCells().allTextContents();
  const sortedAsc = [...ascValues].sort((a, b) => a.localeCompare(b, 'he'));
  expect(ascValues).toEqual(sortedAsc);

  // Click again to reverse sort
  await sortButton.click();
  await expect(
   page.getByRole('button', { name: /Sort by שם פרטי, currently descending/ }),
  ).toBeVisible();

  const descValues = await firstColumnCells().allTextContents();
  const sortedDesc = [...descValues].sort((a, b) => b.localeCompare(a, 'he'));
  expect(descValues).toEqual(sortedDesc);

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
  await expect(page.getByRole('button', { name: 'page 1', exact: true })).toBeVisible();

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
  // Check that the table body has at least one row with content
  await expect(page.locator('tbody tr').first()).toBeVisible();

  // Test search with Hebrew characters - search for any existing name
  const hebrewSearchTerm = 'דוד';
  await searchBox.fill(hebrewSearchTerm);
  // Verify search works (results should be filtered)
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PERS-015: Table Sorting spans across pages, not just the current page', async ({
  page,
 }) => {
  // Regression test: sorting must be server-side and apply to the full dataset, not
  // just re-order whatever rows happen to be loaded for the current page.
  const sortButton = page.getByRole('button', { name: /Sort by שם פרטי/ });

  const sortResponse = page.waitForResponse(
   res => res.url().includes('/api/personnel') && res.url().includes('sortField='),
  );
  await sortButton.click();
  await sortResponse;

  const pagination = page.getByRole('navigation', { name: 'pagination' });
  await expect(pagination).toBeVisible();

  const firstColumnCells = () => page.locator('tbody tr td:first-child');
  await expect(firstColumnCells().first()).toBeVisible();
  const lastOnPage1 = (await firstColumnCells().allTextContents()).at(-1);

  const page2Response = page.waitForResponse(
   res => res.url().includes('/api/personnel') && res.url().includes('page=2'),
  );
  await page.getByRole('button', { name: 'page 2', exact: true }).click();
  await page2Response;
  await expect(page.getByText(/Showing 11 to \d+ of \d+ entries/)).toBeVisible();
  await expect(firstColumnCells().first()).toBeVisible();

  const firstOnPage2 = (await firstColumnCells().allTextContents()).at(0);

  expect(lastOnPage1!.localeCompare(firstOnPage2!, 'he')).toBeLessThanOrEqual(0);
 });
});
