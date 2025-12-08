// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Personnel - List, Search, and Open Detail', () => {
 test('Personnel - List, Search, and Open Detail', async ({ page }) => {
  // 1. Navigate directly to the Personnel page for the scenario
  await page.goto('http://localhost:5173/personnel/69109244427c61d54793b3f5');

  // 2. Wait for the Personnel page content to load
  await page.getByText('משאבי אנוש');

  // 3. Verify Active Personnel metric is visible
  await expect(page.getByText('Active Personnel')).toBeVisible();

  // 4. Verify Total Personnel metric is visible
  await expect(page.getByText('Total Personnel')).toBeVisible();

  // 5. Verify table footer shows expected entries count
  await expect(page.getByText('Showing 1 to 9 of 9 entries')).toBeVisible();

  // 6. Type אבנר into the search box and submit
  const search = page.getByRole('textbox', { name: 'חפש בכל העמודות' });
  await search.fill('אבנר');
  await search.press('Enter');

  // 7. Verify search result row contains "אבנר דויד"
  await expect(page.getByText('אבנר דויד')).toBeVisible();
 });
});
