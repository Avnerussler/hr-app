// spec: tests/hr-app-comprehensive-test-plan.md

import { test, expect, Page, Locator } from './fixtures';
import { faker } from '@faker-js/faker';

// The Settings row-click occasionally races with the table's initial data hydration
// right after navigation, same as Personnel's openRowDrawer helper elsewhere in this
// suite — retry the click until the dialog actually appears.
async function openSettingDialog(page: Page, row: Locator): Promise<Locator> {
 const dialog = page.getByRole('dialog');
 await expect(async () => {
  await row.click();
  await expect(dialog).toBeVisible({ timeout: 2000 });
 }).toPass({ timeout: 15000 });
 return dialog;
}

async function inputValues(locator: Locator): Promise<string[]> {
 return locator.evaluateAll((inputs) => inputs.map((el) => (el as HTMLInputElement).value));
}

// SettingOptionsEditor renders one row per option, each row's value/label/active-checkbox
// /delete-button in the same DOM order as the "ערך (value)" textboxes — so the option's
// index among the value textboxes reliably indexes into the checkbox/delete-button
// collections too, without needing a container locator (there's no stable row wrapper to
// filter by that wouldn't also match the move-up/move-down button's own nested div).
async function findOptionIndexByValue(dialog: Locator, value: string): Promise<number> {
 const values = await inputValues(dialog.getByPlaceholder('ערך (value)'));
 const index = values.indexOf(value);
 expect(index, `option with value "${value}" should exist`).toBeGreaterThanOrEqual(0);
 return index;
}

test.describe('Module 11: Settings Management', () => {
 // These tests open/edit the same shared Settings documents (studioRole, projectStatus,
 // layer), so running across parallel workers races the same way the other CRUD specs
 // in this suite do — run serially, and each mutating test restores the state it changed.
 test.describe.configure({ mode: 'serial' });

 test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.getByRole('group').filter({ hasText: 'הגדרותApp Settings' }).click();
  await page.waitForURL('**/settings');
  await expect(page.getByRole('heading', { name: 'הגדרות' })).toBeVisible();
 });

 test('TC-SET-001: Settings List Page Load', async ({ page }) => {
  await expect(page.getByRole('table')).toBeVisible();

  const expectedLabels = [
   'תפקיד בסטודיו',
   'רמת סיווג',
   'שכבה',
   'סוג העסקה',
   'תחום מקצועי',
   'שנות ניסיון',
   'מקור מימון',
   'סוג צו',
   'סטטוס בקשה',
   'אישור כניסה לבסיס',
   'סטטוס פרויקט',
  ];
  for (const label of expectedLabels) {
   await expect(page.getByRole('cell', { name: label, exact: true })).toBeVisible();
  }
 });

 test('TC-SET-002: Open and Inspect an Option Set', async ({ page }) => {
  const row = page.getByRole('row', { name: /סטטוס פרויקט/ });
  const dialog = await openSettingDialog(page, row);

  await expect(dialog.getByRole('heading', { name: 'סטטוס פרויקט' })).toBeVisible();
  await expect(dialog.getByText('פרויקטים', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('radio', { name: 'פעיל', exact: true })).toBeChecked();

  await expect(dialog.getByPlaceholder('ערך (value)')).toHaveCount(3);
  await expect(dialog.getByPlaceholder('ערך (value)').nth(0)).toHaveValue('active');
  await expect(dialog.getByPlaceholder('תווית (label)').nth(0)).toHaveValue('פעיל');
  await expect(dialog.getByPlaceholder('ערך (value)').nth(1)).toHaveValue('inactive');
  await expect(dialog.getByPlaceholder('ערך (value)').nth(2)).toHaveValue('pending');

  await dialog.getByRole('button', { name: 'ביטול' }).click();
  await expect(dialog).not.toBeVisible();
 });

 test('TC-SET-003: Create a New Option and Use It in a Real Form', async ({ page }) => {
  const newValue = faker.lorem.slug(2);
  const newLabel = 'בדיקה ' + faker.word.noun();

  // --- Create the option via the Settings page ---
  const settingsDialog = await openSettingDialog(page, page.getByRole('row', { name: /תפקיד בסטודיו/ }));
  const initialOptionCount = await settingsDialog.getByPlaceholder('ערך (value)').count();

  await settingsDialog.getByRole('button', { name: 'הוסף אפשרות' }).click();
  const valueInputs = settingsDialog.getByPlaceholder('ערך (value)');
  const labelInputs = settingsDialog.getByPlaceholder('תווית (label)');
  await expect(valueInputs).toHaveCount(initialOptionCount + 1);

  await valueInputs.last().fill(newValue);
  await labelInputs.last().fill(newLabel);

  const saveButton = settingsDialog.getByRole('button', { name: 'שמור' });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(page.getByText(/success/i).first()).toBeVisible({ timeout: 5000 });
  await expect(settingsDialog).not.toBeVisible();

  // --- Check that it's been created: re-open and verify it persisted ---
  await expect(page.getByRole('row', { name: /תפקיד בסטודיו/ }).getByRole('cell', { name: String(initialOptionCount + 1) })).toBeVisible();

  const reopenedDialog = await openSettingDialog(page, page.getByRole('row', { name: /תפקיד בסטודיו/ }));
  await expect(reopenedDialog.getByPlaceholder('ערך (value)')).toHaveCount(initialOptionCount + 1);
  const persistedValues = await inputValues(reopenedDialog.getByPlaceholder('ערך (value)'));
  const persistedLabels = await inputValues(reopenedDialog.getByPlaceholder('תווית (label)'));
  expect(persistedValues).toContain(newValue);
  expect(persistedLabels).toContain(newLabel);
  await reopenedDialog.getByRole('button', { name: 'ביטול' }).click();

  // --- Submit a real form using the new setting value ---
  await page.getByRole('group').filter({ hasText: 'משאבי אנושEmployee Management' }).click();
  await page.waitForURL('**/personnel/**');
  await expect(page.getByRole('heading', { name: 'משאבי אנוש' })).toBeVisible();

  await page.getByRole('button', { name: 'משאבי אנוש' }).click();
  const personnelDrawer = page.getByRole('dialog');
  await expect(personnelDrawer).toBeVisible();

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const personalNumber = faker.string.numeric(9);

  await personnelDrawer.locator('input[name="firstName"]').fill(firstName);
  await personnelDrawer.locator('input[name="lastName"]').fill(lastName);
  await personnelDrawer.locator('input[name="personalNumber"]').fill(personalNumber);

  await page.getByRole('tab', { name: 'מידע צבאי' }).click();
  await personnelDrawer.getByRole('combobox', { name: 'תפקיד בסטודיו' }).click();
  await page.getByRole('option', { name: newLabel }).click();

  await personnelDrawer.getByRole('button', { name: /Create/i }).click();
  await expect(personnelDrawer).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('table')).toBeVisible();

  // Verify the created record shows the new studioRole label in the list, then clean it up.
  const searchBox = page.getByRole('textbox', { name: 'חפש בכל העמודות' });
  await searchBox.fill(personalNumber);
  const createdRow = page.getByRole('table').locator('tbody tr').first();
  await expect(createdRow).toContainText(newLabel);

  const cleanupPersonnelDrawer = await openSettingDialog(page, createdRow);
  await cleanupPersonnelDrawer.getByRole('button', { name: /Delete/i }).click();
  await expect(page.getByText(/deleted successfully|נמחק בהצלחה|Success/i).first()).toBeVisible({ timeout: 5000 });
  await expect(cleanupPersonnelDrawer).not.toBeVisible({ timeout: 10000 });

  // --- Cleanup: remove the throwaway option from the setting ---
  await page.getByRole('group').filter({ hasText: 'הגדרותApp Settings' }).click();
  await page.waitForURL('**/settings');
  const cleanupSettingDialog = await openSettingDialog(page, page.getByRole('row', { name: /תפקיד בסטודיו/ }));
  const deleteIndex = await findOptionIndexByValue(cleanupSettingDialog, newValue);
  await cleanupSettingDialog.getByRole('button', { name: 'Delete option' }).nth(deleteIndex).click();
  await cleanupSettingDialog.getByRole('button', { name: 'שמור' }).click();
  await expect(cleanupSettingDialog).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('row', { name: /תפקיד בסטודיו/ }).getByRole('cell', { name: String(initialOptionCount) })).toBeVisible();
 });

 test('TC-SET-004: Deactivating an Option Removes It From the Live Dropdown', async ({ page }) => {
  const throwawayValue = faker.lorem.slug(2);
  const throwawayLabel = 'זמני ' + faker.word.noun();

  // Add a throwaway option first so we can safely deactivate/reactivate it without
  // touching real seeded data.
  const dialog = await openSettingDialog(page, page.getByRole('row', { name: /תפקיד בסטודיו/ }));
  await dialog.getByRole('button', { name: 'הוסף אפשרות' }).click();
  await dialog.getByPlaceholder('ערך (value)').last().fill(throwawayValue);
  await dialog.getByPlaceholder('תווית (label)').last().fill(throwawayLabel);
  await dialog.getByRole('button', { name: 'שמור' }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10000 });

  // Re-open, deactivate the throwaway option specifically. Each option row carries a
  // stable `data-field-name="options.<index>"` attribute (SettingOptionsEditor.tsx), so
  // scope the click to that exact row — necessary because Chakra's Switch keeps the real
  // checkbox input visually hidden (zero-size) under a styled track/thumb, so a plain
  // role-based checkbox locator can resolve but never receives a deliverable click.
  const dialog2 = await openSettingDialog(page, page.getByRole('row', { name: /תפקיד בסטודיו/ }));
  const deactivateIndex = await findOptionIndexByValue(dialog2, throwawayValue);
  const optionRow = dialog2.locator(`[data-field-name="options.${deactivateIndex}"]`);
  await optionRow.getByText('פעיל', { exact: true }).click();
  await dialog2.getByRole('button', { name: 'שמור' }).click();
  await expect(dialog2).not.toBeVisible({ timeout: 10000 });

  // Verify it no longer appears as a selectable option in the live Personnel dropdown.
  await page.getByRole('group').filter({ hasText: 'משאבי אנושEmployee Management' }).click();
  await page.waitForURL('**/personnel/**');
  await page.getByRole('button', { name: 'משאבי אנוש' }).click();
  const personnelDrawer = page.getByRole('dialog');
  await expect(personnelDrawer).toBeVisible();
  await page.getByRole('tab', { name: 'מידע צבאי' }).click();
  await personnelDrawer.getByRole('combobox', { name: 'תפקיד בסטודיו' }).click();
  await expect(page.getByRole('option', { name: throwawayLabel })).not.toBeVisible();
  await page.keyboard.press('Escape');
  await personnelDrawer.getByRole('button', { name: /Cancel/i }).click();

  // Cleanup: remove the throwaway option entirely.
  await page.getByRole('group').filter({ hasText: 'הגדרותApp Settings' }).click();
  await page.waitForURL('**/settings');
  const cleanupDialog = await openSettingDialog(page, page.getByRole('row', { name: /תפקיד בסטודיו/ }));
  const cleanupIndex = await findOptionIndexByValue(cleanupDialog, throwawayValue);
  await cleanupDialog.getByRole('button', { name: 'Delete option' }).nth(cleanupIndex).click();
  await cleanupDialog.getByRole('button', { name: 'שמור' }).click();
  await expect(cleanupDialog).not.toBeVisible({ timeout: 10000 });
 });

 test('TC-SET-005: Toggle an Option-Set Active Status', async ({ page }) => {
  const row = page.getByRole('row', { name: /שכבה/ });
  const dialog = await openSettingDialog(page, row);

  // The radiogroup's real radio inputs are visually hidden under Chakra's styled
  // control (same as the option checkboxes above) — click the visible label text.
  await dialog.getByText('לא פעיל', { exact: true }).click();
  await dialog.getByRole('button', { name: 'שמור' }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10000 });

  await expect(page.getByRole('row', { name: /שכבה/ }).getByText('לא פעיל', { exact: true })).toBeVisible();

  // Revert so subsequent runs/specs see the setting active again.
  const dialog2 = await openSettingDialog(page, page.getByRole('row', { name: /שכבה/ }));
  await dialog2.getByText('פעיל', { exact: true }).first().click();
  await dialog2.getByRole('button', { name: 'שמור' }).click();
  await expect(dialog2).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('row', { name: /שכבה/ }).getByText('פעיל', { exact: true })).toBeVisible();
 });

 test('TC-SET-006: Delete an Option', async ({ page }) => {
  const throwawayValue = faker.lorem.slug(2);
  const throwawayLabel = 'מחיקה ' + faker.word.noun();

  const dialog = await openSettingDialog(page, page.getByRole('row', { name: /סטטוס פרויקט/ }));
  const initialCount = await dialog.getByPlaceholder('ערך (value)').count();

  await dialog.getByRole('button', { name: 'הוסף אפשרות' }).click();
  await dialog.getByPlaceholder('ערך (value)').last().fill(throwawayValue);
  await dialog.getByPlaceholder('תווית (label)').last().fill(throwawayLabel);
  await dialog.getByRole('button', { name: 'שמור' }).click();
  await expect(dialog).not.toBeVisible({ timeout: 10000 });

  const dialog2 = await openSettingDialog(page, page.getByRole('row', { name: /סטטוס פרויקט/ }));
  await expect(dialog2.getByPlaceholder('ערך (value)')).toHaveCount(initialCount + 1);
  const deleteIndex = await findOptionIndexByValue(dialog2, throwawayValue);
  await dialog2.getByRole('button', { name: 'Delete option' }).nth(deleteIndex).click();
  await dialog2.getByRole('button', { name: 'שמור' }).click();
  await expect(dialog2).not.toBeVisible({ timeout: 10000 });

  await expect(page.getByRole('row', { name: /סטטוס פרויקט/ }).getByRole('cell', { name: String(initialCount) })).toBeVisible();
  const dialog3 = await openSettingDialog(page, page.getByRole('row', { name: /סטטוס פרויקט/ }));
  const remainingValues = await inputValues(dialog3.getByPlaceholder('ערך (value)'));
  expect(remainingValues).not.toContain(throwawayValue);
  await dialog3.getByRole('button', { name: 'ביטול' }).click();
 });

 test('TC-SET-007: Cancel Discards Unsaved Changes', async ({ page }) => {
  const dialog = await openSettingDialog(page, page.getByRole('row', { name: /סטטוס פרויקט/ }));
  const originalLabel = await dialog.getByPlaceholder('תווית (label)').first().inputValue();

  await dialog.getByPlaceholder('תווית (label)').first().fill('שינוי זמני שלא יישמר');
  await dialog.getByRole('button', { name: 'ביטול' }).click();
  await expect(dialog).not.toBeVisible();

  const dialog2 = await openSettingDialog(page, page.getByRole('row', { name: /סטטוס פרויקט/ }));
  await expect(dialog2.getByPlaceholder('תווית (label)').first()).toHaveValue(originalLabel);
  await dialog2.getByRole('button', { name: 'ביטול' }).click();
 });

 test('TC-SET-008: Save Button Gating', async ({ page }) => {
  const dialog = await openSettingDialog(page, page.getByRole('row', { name: /סטטוס פרויקט/ }));
  const saveButton = dialog.getByRole('button', { name: 'שמור' });
  await expect(saveButton).toBeDisabled();

  await dialog.getByPlaceholder('תווית (label)').first().fill('פעיל ');
  await expect(saveButton).toBeEnabled();

  await dialog.getByRole('button', { name: 'ביטול' }).click();
 });
});
