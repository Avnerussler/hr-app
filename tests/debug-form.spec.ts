import { test, expect } from '@playwright/test';

test('Debug: Investigate Add Personnel Form', async ({ page }) => {
 // Navigate to Personnel page
 await page.goto('http://localhost:5173');
 await expect(page.getByRole('heading')).toBeVisible();
 await page.getByRole('group').filter({ hasText: 'משאבי אנושEmployee Management' }).click();
 await expect(page.getByRole('heading', { name: 'משאבי אנוש' })).toBeVisible();

 // Click Add personnel button
 await page.getByRole('button', { name: 'Add personnel' }).click();

 // Wait for navigation
 await page.waitForLoadState('networkidle');
 await page.waitForTimeout(1000);

 // Check URL
 console.log('Current URL:', page.url());

 // Take screenshot
 await page.screenshot({ path: 'test-results/add-personnel-form.png', fullPage: true });

 // Get all input fields
 const inputs = await page.locator('input').all();
 console.log('Number of inputs:', inputs.length);

 for (let i = 0; i < Math.min(inputs.length, 10); i++) {
  const input = inputs[i];
  const name = await input.getAttribute('name');
  const placeholder = await input.getAttribute('placeholder');
  const type = await input.getAttribute('type');
  console.log(`Input ${i}: name="${name}", placeholder="${placeholder}", type="${type}"`);
 }
});
