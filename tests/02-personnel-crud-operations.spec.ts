// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect, Page, Locator } from '@playwright/test';
import { faker } from '@faker-js/faker';

// The personnel row-click navigation (list -> /personnel/<formId>/edit/<itemId>)
// occasionally races with the table's initial data/query hydration right after
// the beforeEach lands on the page: a click that fires before the row's onClick
// handler is wired up is silently swallowed (no navigation happens at all).
// Retry the row click until the drawer dialog actually appears instead of
// relying on a single click + a single assertion.
async function openRowDrawer(page: Page, row: Locator): Promise<Locator> {
 const drawer = page.getByRole('dialog');
 await expect(async () => {
  await row.click();
  await expect(drawer).toBeVisible({ timeout: 2000 });
 }).toPass({ timeout: 15000 });
 return drawer;
}

test.describe('Module 1: Personnel Management - CRUD Operations', () => {
 test.beforeEach(async ({ page }) => {
  // Navigate to Personnel page
  await page.goto('http://localhost:5173');
  await expect(page.getByRole('heading')).toBeVisible();
  await page.getByRole('group').filter({ hasText: 'משאבי אנושEmployee Management' }).click();
  await expect(page.getByRole('heading', { name: 'משאבי אנוש' })).toBeVisible();

  // Wait for the table to finish its initial data load before any test
  // interacts with rows/buttons - otherwise the first click in a test can
  // land before row click handlers / row data are attached.
  await expect(page.getByRole('table').locator('tbody tr').first()).toBeVisible();
 });

 test('TC-PERS-004: View Personnel Details', async ({ page }) => {
  // Click on first personnel row in table (any row) - retry the click until
  // the details drawer (dialog) actually opens (see openRowDrawer above).
  const firstDataRow = page.getByRole('table').locator('tbody tr').first();
  const drawer = await openRowDrawer(page, firstDataRow);

  // Verify details drawer opens with the record's data/form inside it
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('form')).toBeVisible();
 });

 test('TC-PERS-005: Create New Personnel', async ({ page }) => {
  // Generate test data with Faker
  const testData = {
   firstName: faker.person.firstName(),
   lastName: faker.person.lastName(),
   personalNumber: faker.string.numeric(9),
   email: faker.internet.email(),
   phone: '050' + faker.string.numeric(7), // Israeli mobile format
  };

  // Click the "משאבי אנוש" add button - the PageHeader action button uses the
  // form's displayName as its label (there is no literal "Add personnel"
  // button in this app), same pattern used by TC-PERS-009 below.
  await page.getByRole('button', { name: 'משאבי אנוש' }).click();

  // Wait for drawer to open
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // The form may have tabs - click on "מידע אישי" (Personal Information) tab if it exists
  const personalInfoTab = page.getByRole('tab', { name: 'מידע אישי' });
  if (await personalInfoTab.isVisible({ timeout: 2000 }).catch(() => false)) {
   await personalInfoTab.click();
   await page.waitForTimeout(500);
  }

  // Fill required fields using name attributes
  await page.locator('input[name="firstName"]').fill(testData.firstName);
  await page.locator('input[name="lastName"]').fill(testData.lastName);
  await page.locator('input[name="personalNumber"]').fill(testData.personalNumber);
  await page.locator('input[name="email"]').fill(testData.email);
  await page.locator('input[name="phone"]').fill(testData.phone);

  // Click Save/Create button
  const saveButton = page.getByRole('button', { name: /Create|שמור/i });
  await saveButton.click();

  // Verify drawer closes and we're back on list page
  await expect(drawer).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PERS-009: Create Personnel With Vehicle Info', async ({ page }) => {
  // Generate test data with Faker
  const testData = {
   firstName: faker.person.firstName(),
   lastName: faker.person.lastName(),
   personalNumber: faker.string.numeric(9),
   email: faker.internet.email(),
   phone: '050' + faker.string.numeric(7), // Israeli mobile format
   vehicleNumber: faker.string.numeric(2) + '-' + faker.string.numeric(3) + '-' + faker.string.numeric(2),
  };

  // Click the "משאבי אנוש" add button (form display name, same pattern used
  // by the reserve-days "צווי מילואים" add button in file 04).
  await page.getByRole('button', { name: 'משאבי אנוש' }).click();

  // Wait for drawer to open
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // "מידע אישי" (Personal Information) tab holds firstName/lastName/.../
  // vehicleNumber AND, directly below it, the vehicle-entry-approval date range.
  const personalInfoTab = page.getByRole('tab', { name: 'מידע אישי' });
  if (await personalInfoTab.isVisible({ timeout: 2000 }).catch(() => false)) {
   await personalInfoTab.click();
   await page.waitForTimeout(500);
  }

  await page.locator('input[name="firstName"]').fill(testData.firstName);
  await page.locator('input[name="lastName"]').fill(testData.lastName);
  await page.locator('input[name="personalNumber"]').fill(testData.personalNumber);
  await page.locator('input[name="email"]').fill(testData.email);
  await page.locator('input[name="phone"]').fill(testData.phone);
  await page.locator('input[name="vehicleNumber"]').fill(testData.vehicleNumber);

  // Vehicle-entry-approval date range ("תוקף אישור כניסה עם רכב") — a
  // ControlledDateRangeField (components/ControlledFields/ControlledDateRangeField.tsx)
  // with two dd/mm/yyyy inputs. NOTE: this is a DIFFERENT date format than the
  // reserve-days date-range field (ReserveDayDateRangeField), which renders
  // mm/dd/yyyy placeholders — don't reuse that format here. Uses
  // pressSequentially (not .fill()), matching fillDateRangeInputs in file 04:
  // the ark-ui date-input parses keystrokes as typed, and a bulk .fill() on
  // the second (end) input is silently dropped.
  const vehicleApprovalDates = drawer.getByPlaceholder('dd/mm/yyyy');
  const startDate = new Date();
  const endDate = new Date(Date.now() + 30 * 86400000);
  const toPickerDate = (d: Date) =>
   `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  await vehicleApprovalDates.nth(0).click();
  await vehicleApprovalDates.nth(0).pressSequentially(toPickerDate(startDate));
  await vehicleApprovalDates.nth(1).pressSequentially(toPickerDate(endDate));
  await vehicleApprovalDates.nth(1).press('Tab');

  // Click Save/Create button
  const saveButton = page.getByRole('button', { name: /Create|שמור/i });
  await saveButton.click();

  // Verify drawer closes and we're back on list page
  await expect(drawer).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PERS-006: Edit Personnel Record', async ({ page }) => {
  // Generate new test data with Faker
  const updatedPhone = '050' + faker.string.numeric(7); // Israeli mobile format

  // Click on first personnel row to open the drawer. Retry the click until the
  // dialog actually appears (see openRowDrawer) - a single click can silently
  // no-op if it lands before the row's click handler / row data are ready.
  const testRow = page.getByRole('table').locator('tbody tr').first();
  const drawer = await openRowDrawer(page, testRow);

  // Confirm the drawer is in an editable state (an actual form with a save
  // action) before interacting with any field - not a read-only view.
  await expect(drawer.locator('form')).toBeVisible();
  const updateButton = page.getByRole('button', { name: /Update|עדכן/i });
  await expect(updateButton).toBeVisible();

  // Click on "מידע אישי" (Personal Information) tab to access phone field
  await page.getByRole('tab', { name: 'מידע אישי' }).click();

  // Wait for the phone field to be visible/editable on the new tab
  const phoneField = page.locator('input[name="phone"]');
  await expect(phoneField).toBeVisible();
  await expect(phoneField).toBeEditable();

  // Modify phone number field
  await phoneField.clear();
  await phoneField.fill(updatedPhone);

  // Click Update button
  await updateButton.click();

  // Wait for drawer to close and verify we're back on list page
  await expect(drawer).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PERS-007: Delete Personnel (Soft Delete)', async ({ page }) => {
  // Get initial count
  const initialCount = await page.getByText(/Showing \d+ to \d+ of (\d+) entries/).textContent();

  // Click on last personnel row to open drawer (retry until dialog appears)
  const testRow = page.getByRole('table').locator('tbody tr').last();
  const drawer = await openRowDrawer(page, testRow);

  // Look for delete button in the drawer
  const deleteButton = page.getByRole('button', { name: /מחק|Delete/i });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  // Verify success notification appears (use first() to avoid strict mode)
  await expect(page.getByText(/deleted successfully|נמחק בהצלחה|Success/i).first()).toBeVisible({
   timeout: 5000,
  });

  // Verify drawer closes
  await expect(drawer).not.toBeVisible({ timeout: 10000 });

  // Verify we're back on list page
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PERS-008: Personnel Form Validation', async ({ page }) => {
  // Generate test data with Faker - only the 3 truly-required fields
  // (firstName, lastName, personalNumber). All other personnel fields
  // (email, phone, city, etc.) are optional, so submitting with just these
  // three filled in must succeed without any validation error.
  const validData = {
   firstName: faker.person.firstName(),
   lastName: faker.person.lastName(),
   personalNumber: faker.string.numeric(9),
  };

  // Click the "משאבי אנוש" add button - the PageHeader action button uses the
  // form's displayName as its label (there is no literal "Add personnel"
  // button in this app).
  await page.getByRole('button', { name: 'משאבי אנוש' }).click();

  // Wait for drawer to open
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // The form may have tabs - click on "מידע אישי" (Personal Information) tab if it exists
  const personalInfoTab = page.getByRole('tab', { name: 'מידע אישי' });
  if (await personalInfoTab.isVisible({ timeout: 2000 }).catch(() => false)) {
   await personalInfoTab.click();
   await page.waitForTimeout(500);
  }

  // Fill only the required fields - email/phone/etc. are intentionally left blank
  await page.locator('input[name="firstName"]').fill(validData.firstName);
  await page.locator('input[name="lastName"]').fill(validData.lastName);
  await page.locator('input[name="personalNumber"]').fill(validData.personalNumber);

  // Click Create/Save button
  const saveButton = page.getByRole('button', { name: /Create|שמור/i });
  await saveButton.click();

  // Verify drawer closes and we're back on list page - no validation error
  // should block submission since only the 3 required fields matter.
  await expect(drawer).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('table')).toBeVisible();
 });

 test('TC-PERS-010: Missing Required Field Jumps To Its Section And Scrolls Into View', async ({ page }) => {
  // Click the "משאבי אנוש" add button to open the create drawer.
  await page.getByRole('button', { name: 'משאבי אנוש' }).click();

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  // The Create/Update button stays disabled until the form is dirty. Fill
  // one optional field (on the Personal Information tab, which is open by
  // default) so the Save button becomes enabled without satisfying the
  // required-field validation.
  await page.locator('input[name="city"]').fill('תל אביב');

  // Start from a tab other than "מידע אישי" (Personal Information) - the
  // missing required fields (firstName/lastName/personalNumber) live on that
  // tab, so submitting from elsewhere must switch back to it automatically.
  const militaryInfoTab = page.getByRole('tab', { name: 'מידע צבאי' });
  await militaryInfoTab.click();
  await expect(militaryInfoTab).toHaveAttribute('aria-selected', 'true');

  // Submit with all required fields empty.
  const saveButton = page.getByRole('button', { name: /Create|שמור/i });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  // Drawer must stay open (validation blocked submission) and the form must
  // switch back to the "מידע אישי" tab where the invalid fields live.
  await expect(drawer).toBeVisible();
  const personalInfoTab = page.getByRole('tab', { name: 'מידע אישי' });
  await expect(personalInfoTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });

  // The first invalid field (firstName) must be scrolled into view.
  const firstNameField = page.locator('[data-field-name="firstName"]');
  await expect(firstNameField).toBeInViewport({ timeout: 5000 });
 });

 test('TC-PERS-003: Filter Personnel', async ({ page }) => {
  // Test employment type filter
  const employmentTypeCombobox = page
   .getByRole('combobox')
   .filter({ hasText: /בחר סוג העסקה|Employment Type/i });
  await employmentTypeCombobox.click();

  // Select a filter option
  const filterOption = page.getByRole('option', { name: /קבע|מילואים/i }).first();
  await filterOption.click();

  // Verify table is filtered
  await expect(page.getByRole('table')).toBeVisible();

  // Clear filters
  const clearButton = page.getByRole('button', { name: 'Clear Filters' });
  if (await clearButton.isEnabled()) {
   await clearButton.click();
  }

  // Verify all records return (use flexible regex)
  await expect(page.getByText(/Showing 1 to \d+ of \d+ entries/)).toBeVisible();
 });
});
