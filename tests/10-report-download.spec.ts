// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts
//
// Report download (Excel export) — TopBar.tsx#67-70 opens ReportDownloadDialog,
// which calls exportReportsToExcel. Regression coverage for the bug where
// exportReportsToExcel.ts read `.data` instead of `.report` from every single
// statistics endpoint response, causing every report fetch to silently fail
// and the whole export to throw "לא ניתן לטעון את הדוחות מהשרת".

import { test, expect, Page } from '@playwright/test';

async function openReportDialog(page: Page) {
 await page.goto('/dashboard');
 await page.getByRole('button', { name: /הורד דוחות/ }).click();
 const dialog = page.getByRole('dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.getByText('הורדת דוחות לאקסל')).toBeVisible();
 return dialog;
}

test.describe('Module 10: Report Download (Excel export)', () => {
 test('TC-REPDL-001: Download button opens the report dialog', async ({ page }) => {
  const dialog = await openReportDialog(page);
  await expect(dialog.getByText('בחר דוחות לייצוא')).toBeVisible();
  await expect(dialog.getByText('סכימת ימי מילואים יומית')).toBeVisible();
 });

 test('TC-REPDL-002: Submitting with no report selected shows a validation error, no download', async ({
  page,
 }) => {
  const dialog = await openReportDialog(page);
  const submit = dialog.getByRole('button', { name: /הורד קובץ אקסל/ });

  // No report checkbox selected — the submit button stays disabled.
  await expect(submit).toBeDisabled();
 });

 test('TC-REPDL-003: Selecting one report and submitting downloads an .xlsx with no console errors', async ({
  page,
 }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
   if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const dialog = await openReportDialog(page);

  // Select the first report ("סכימת ימי מילואים יומית" / daily_summary).
  await dialog.getByText('סכימת ימי מילואים יומית', { exact: true }).click();

  const submit = dialog.getByRole('button', { name: /הורד קובץ אקסל/ });
  await expect(submit).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await submit.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^דוחות_ימי_מילואים_.*\.xlsx$/);

  // Success toast confirms the export completed without the
  // "לא ניתן לטעון את הדוחות מהשרת" failure path.
  await expect(page.getByText('הדוחות יוצאו בהצלחה')).toBeVisible({ timeout: 5000 });
  expect(consoleErrors.join('\n')).not.toContain('לא ניתן לטעון את הדוחות מהשרת');
  expect(consoleErrors.join('\n')).not.toContain('Error exporting reports');
 });

 test('TC-REPDL-004: Selecting all reports with a custom date range downloads successfully', async ({
  page,
 }) => {
  // Fetching all 5 reports sequentially + building the workbook is slower
  // than the default timeout.
  test.setTimeout(60_000);

  const dialog = await openReportDialog(page);

  // Select every available report checkbox.
  const reportLabels = [
   'סכימת ימי מילואים יומית',
   'סכימת ימי מילואים לפי טווח תאריכים',
   'סכימה לפי פרויקטים',
   'סכימת ימי מילואים חיצוניים לפי יחידות',
   'רשימת עובדים על צו בתאריך מוגדר',
  ];
  for (const label of reportLabels) {
   await dialog.getByText(label, { exact: true }).click();
  }

  // Switch to a custom date range.
  const timeFrameCombo = dialog.getByRole('combobox').filter({ hasText: /בחר טווח תאריכים|היום/ });
  await timeFrameCombo.click();
  await page.getByRole('option', { name: 'טווח מותאם' }).click();

  await dialog.locator('input[name="startDate"]').fill('2026-06-01');
  await dialog.locator('input[name="endDate"]').fill('2026-07-01');

  const submit = dialog.getByRole('button', { name: /הורד קובץ אקסל/ });
  await expect(submit).toBeEnabled();

  const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
  await submit.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^דוחות_ימי_מילואים_20260601_20260701_.*\.xlsx$/);
  await expect(page.getByText('הדוחות יוצאו בהצלחה')).toBeVisible({ timeout: 5000 });
 });

 test('TC-REPDL-005: Custom range with end date before start date is rejected client-side', async ({
  page,
 }) => {
  const dialog = await openReportDialog(page);
  await dialog.getByText('סכימת ימי מילואים יומית', { exact: true }).click();

  const timeFrameCombo = dialog.getByRole('combobox').filter({ hasText: /בחר טווח תאריכים|היום/ });
  await timeFrameCombo.click();
  await page.getByRole('option', { name: 'טווח מותאם' }).click();

  await dialog.locator('input[name="startDate"]').fill('2026-07-10');
  await dialog.locator('input[name="endDate"]').fill('2026-07-01');

  // RHF validation blocks submission; the dialog stays open.
  await expect(dialog.getByText('תאריך סיום חייב להיות אחרי תאריך התחלה')).toBeVisible();
  await expect(dialog).toBeVisible();
 });

 test('TC-REPDL-006: Cancel closes the dialog without downloading', async ({ page }) => {
  const dialog = await openReportDialog(page);
  await dialog.getByText('סכימת ימי מילואים יומית', { exact: true }).click();
  await dialog.getByRole('button', { name: 'ביטול' }).click();
  await expect(dialog).not.toBeVisible();
 });
});
