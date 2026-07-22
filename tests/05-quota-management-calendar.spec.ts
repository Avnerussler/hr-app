// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:5173';

interface PersonnelRecord {
 id: string;
 firstName: string;
 lastName: string;
 personalNumber: string;
}

// Personnel and reserve-days now live in explicit REST resources (/api/personnel,
// /api/reserve-days) backed by dedicated Mongoose models, not the legacy generic
// /api/formSubmission endpoint. The quota-management calendar's occupancy calculation
// reads exclusively from the new ReserveDay model, so records must be created via these
// endpoints for the calendar to reflect them.
async function createPersonnel(request: any, overrides: Record<string, any> = {}): Promise<PersonnelRecord> {
 const firstName = overrides.firstName ?? 'בדיקה';
 const lastName = overrides.lastName ?? `קאל${Date.now()}`;
 const personalNumber = overrides.personalNumber ?? `QM${Date.now()}`;
 const res = await request.post(`${API}/personnel`, {
  data: { firstName, lastName, personalNumber, isActive: true, ...overrides },
 });
 const body = await res.json();
 return { id: body._id, firstName, lastName, personalNumber };
}

async function createReserveDay(request: any, personnel: PersonnelRecord, overrides: Record<string, any> = {}): Promise<string> {
 const res = await request.post(`${API}/reserve-days`, {
  data: {
   employeeName: personnel.id,
   startDate: new Date().toISOString().split('T')[0],
   endDate: new Date().toISOString().split('T')[0],
   fundingSource: 'internal',
   orderType: '8open',
   requestStatus: 'approved',
   ...overrides,
  },
 });
 return (await res.json())._id;
}

async function deletePersonnel(request: any, id: string) {
 await request.delete(`${API}/personnel/${id}`);
}

async function deleteReserveDay(request: any, id: string) {
 await request.delete(`${API}/reserve-days/${id}`);
}

test.describe('Module 4: Quota Management Calendar', () => {
 test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.getByRole('group').filter({ hasText: 'נוכחות ומעקב יומי' }).click();
  await page.waitForURL('**/quota-management');
  await page.waitForLoadState('networkidle');
 });

 test('TC-QM-001: Calendar page loads with correct structure', async ({ page }) => {
  // Use the page heading (h2/heading role) to avoid strict-mode collision with sidebar label
  await expect(page.getByRole('heading', { name: 'נוכחות ומעקב יומי' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'שבועי' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'חודשי' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'היום' })).toBeVisible();

  for (const day of ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'שבת']) {
   await expect(page.getByText(day).first()).toBeVisible();
  }
 });

 test('TC-QM-002: Monthly/weekly view toggle', async ({ page }) => {
  await page.getByRole('button', { name: 'שבועי' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'חודשי' }).click();
  await page.waitForTimeout(300);
  await expect(page.getByRole('button', { name: 'חודשי' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'היום' })).toBeVisible();
 });

 test('TC-QM-003: Prev/next month navigation', async ({ page }) => {
  // Month label reads like "יולי 2026" — scope to the calendar header's paragraph
  // to avoid matching unrelated 4-digit numbers elsewhere on the page (e.g. stat cards).
  const monthLabel = page.getByText(/^[֐-׿]+ \d{4}$/).first();
  const initialText = await monthLabel.textContent();

  // The nav arrows are icon buttons living in the same header row as the month label
  // and the "היום" button. Walk up from the "היום" button to the shared header
  // container (the Flex with justify="space-between") to avoid matching unrelated
  // icon buttons elsewhere on the page (sidebar, logout, etc.).
  const calendarHeader = page.getByRole('button', { name: 'היום' }).locator('xpath=ancestor::*[2]');
  const navButtons = calendarHeader.locator('button').filter({ has: page.locator('svg') });
  await navButtons.first().click();
  await page.waitForTimeout(400);
  const nextText = await monthLabel.textContent();
  expect(nextText).not.toBe(initialText);

  await page.getByRole('button', { name: 'היום' }).click();
  await page.waitForTimeout(300);
  expect(await monthLabel.textContent()).toBe(initialText);
 });

 test('TC-QM-004: Occupancy count shown when reserveDay exists', async ({ page, request }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayDay = new Date().getDate().toString();
  let personnel: PersonnelRecord | null = null;
  let reserveDayId: string | null = null;

  // The calendar day cell shows "assigned/quota (percent%)" (e.g. "62/25 (248%)") and a
  // "סה״כ:" (total) count. There is no "פנימי:" (internal) label rendered on the cell —
  // internal-funded reserve days are only reflected in the assigned/total counts, while a
  // separate "מימון חיצוני:" line is shown only for external-funded days. So we assert that
  // today's total occupancy count increments after creating an internal reserve day.
  // Find the day-number paragraph (exact text match, e.g. "19") and walk up to its
  // containing day-cell box, which also holds the "סה״כ:" total text.
  const todayCell = page
   .getByText(new RegExp(`^${todayDay}$`), { exact: true })
   .locator('xpath=ancestor::*[self::div][3]');
  const totalLocator = todayCell.locator('text=/סה״כ:\\d+/').first();

  const getTotal = async () => {
   const text = await totalLocator.textContent();
   const match = text?.match(/(\d+)/);
   return match ? Number(match[1]) : 0;
  };

  const initialTotal = await getTotal();

  try {
   personnel = await createPersonnel(request, {
    firstName: 'תפוסה',
    lastName: `בדיקה${Date.now()}`,
    personalNumber: `QMOCC${Date.now()}`,
   });
   reserveDayId = await createReserveDay(request, personnel, {
    startDate: today,
    endDate: today,
    fundingSource: 'internal',
    requestStatus: 'approved',
   });

   await page.reload();
   await page.waitForLoadState('networkidle');

   await expect(totalLocator).toBeVisible({ timeout: 8000 });
   await expect(async () => {
    expect(await getTotal()).toBe(initialTotal + 1);
   }).toPass({ timeout: 8000 });
  } finally {
   if (reserveDayId) await deleteReserveDay(request, reserveDayId);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-QM-005: Right-click on day cell opens context menu', async ({ page }) => {
  const today = new Date().getDate().toString();
  const dayCell = page.locator('[class*="css"]').filter({ hasText: new RegExp(`^${today}$`) }).first();
  await dayCell.dispatchEvent('contextmenu');
  await page.waitForTimeout(300);

  // Use role-based selectors to avoid strict-mode collisions
  await expect(page.getByRole('button', { name: 'ניהול כמויות' })).toBeVisible();

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
 });

 test('TC-QM-006: Set quota via QuotaModal', async ({ page, request }) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 20);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  const futureDay = futureDate.getDate().toString();

  try {
   const futureMonth = futureDate.getMonth();
   const currentMonth = new Date().getMonth();
   const monthDiff = futureMonth - currentMonth;
   // Scope the nav-arrow buttons to the calendar header row (shared container with the
   // "היום" button) to avoid matching unrelated icon buttons elsewhere on the page
   // (sidebar, logout, etc.) — see TC-QM-003 for the same fix.
   const calendarHeader = page.getByRole('button', { name: 'היום' }).locator('xpath=ancestor::*[2]');
   const navButtons = calendarHeader.locator('button').filter({ has: page.locator('svg') });
   const monthLabel = page.getByText(/^[֐-׿]+ \d{4}$/).first();
   for (let i = 0; i < monthDiff; i++) {
    const beforeNavText = await monthLabel.textContent();
    await navButtons.first().click();
    // Wait for the month label to actually change before proceeding — clicking the next
    // day cell before the calendar has re-rendered for the new month risks right-clicking
    // a stale element from the previous month's grid (which briefly shares day numbers,
    // e.g. "8"), causing the QuotaModal to seed the wrong start date.
    await expect(async () => {
     expect(await monthLabel.textContent()).not.toBe(beforeNavText);
    }).toPass({ timeout: 3000 });
   }

   // Anchor on the exact day-number text within the calendar grid, then dispatch the
   // context menu on its containing day-cell box — matching the approach used in
   // TC-QM-004 to avoid ambiguous substring/partial matches across the rendered grid.
   const dayCell = page
    .getByText(new RegExp(`^${futureDay}$`), { exact: true })
    .locator('xpath=ancestor::*[self::div][3]');
   await dayCell.dispatchEvent('contextmenu');
   await page.waitForTimeout(300);

   await page.getByRole('button', { name: 'ניהול כמויות' }).click();
   await page.waitForTimeout(500);

   const modal = page.getByRole('dialog');
   await expect(modal).toBeVisible();

   // QuotaModal's "start date" field defaults to today's date at first mount and is
   // only re-synced to the right-clicked day via a useEffect — explicitly set it here
   // rather than relying on that effect's timing. The field is a Chakra DatePicker
   // (dd/mm/yyyy) — use pressSequentially, not .fill(), since ark-ui's date-input
   // parses keystrokes as they're typed and a bulk .fill() can be silently dropped.
   const [isoYear, isoMonth, isoDay] = futureDateStr.split('-');
   const futurePickerDate = `${isoDay}/${isoMonth}/${isoYear}`;
   const startDateInput = modal.getByPlaceholder('dd/mm/yyyy').first();
   // The field is pre-filled with today's date — triple-click to select all of its
   // text before typing so the new keystrokes replace it instead of interleaving
   // with the existing digits.
   await startDateInput.click({ clickCount: 3 });
   await startDateInput.pressSequentially(futurePickerDate);
   await startDateInput.press('Tab');
   await expect(startDateInput).toHaveValue(futurePickerDate);

   await modal.locator('input[type="number"]').first().fill('25');
   await modal.getByRole('button', { name: /שמור|צור|Create|Save/ }).click();
   await page.waitForTimeout(1000);

   await expect(modal).not.toBeVisible({ timeout: 5000 });

   // GET /quotas/date/:date responds with { data: { date, quota, currentOccupancy,
   // occupancyRate } } — there is no top-level _id on this endpoint's response, so
   // cleanup below always deletes by date rather than by quota ID.
   const res = await request.get(`${API}/quotas/date/${futureDateStr}`);
   expect(res.ok()).toBeTruthy();
   const body = await res.json();
   expect(body.data.quota).toBe(25);
  } finally {
   await request.delete(`${API}/quotas/date/${futureDateStr}`);
  }
 });
});
