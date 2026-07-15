// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:5173';

async function getFormId(request: any, formName: string): Promise<string> {
 const res = await request.get(`${API}/formSubmission?formName=${formName}&page=1&limit=1`);
 const body = await res.json();
 return body.forms[0].formId;
}

interface PersonnelRecord {
 id: string;
 firstName: string;
 lastName: string;
 personalNumber: string;
}

async function createPersonnel(request: any, formId: string, overrides: Record<string, any> = {}): Promise<PersonnelRecord> {
 const firstName = overrides.firstName ?? 'בדיקה';
 const lastName = overrides.lastName ?? `קאל${Date.now()}`;
 const personalNumber = overrides.personalNumber ?? `QM${Date.now()}`;
 const res = await request.post(`${API}/formSubmission/create`, {
  data: {
   formId,
   formName: 'personnel',
   formData: { firstName, lastName, personalNumber, status: 'active', employmentType: 'reserves', ...overrides },
  },
 });
 const body = await res.json();
 return { id: body.form._id, firstName, lastName, personalNumber };
}

async function createReserveDay(request: any, formId: string, personnel: PersonnelRecord, overrides: Record<string, any> = {}): Promise<string> {
 const res = await request.post(`${API}/formSubmission/create`, {
  data: {
   formId,
   formName: 'reserve_days_management',
   formData: {
    employeeName: {
     _id: personnel.id,
     display: `${personnel.firstName} ${personnel.lastName} ${personnel.personalNumber}`,
     metadata: { firstName: personnel.firstName, lastName: personnel.lastName, personalNumber: personnel.personalNumber },
    },
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    fundingSource: 'internal',
    orderType: '8open',
    requestStatus: 'approved',
    isActive: true,
    vehicleEntry: false,
    ...overrides,
   },
  },
 });
 return (await res.json()).form._id;
}

async function deleteSubmission(request: any, id: string) {
 await request.post(`${API}/formSubmission/delete`, { data: { id } });
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

  for (const day of ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']) {
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
  const monthLabel = page.locator('text=/\\d{4}/').first();
  const initialText = await monthLabel.textContent();

  // The nav arrows are icon buttons — target by being a button inside the header area
  const navButtons = page.locator('button').filter({ has: page.locator('svg') });
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
  let personnel: PersonnelRecord | null = null;
  let reserveDayId: string | null = null;

  try {
   const personnelFormId = await getFormId(request, 'personnel');
   const reserveDaysFormId = await getFormId(request, 'reserve_days_management');

   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'תפוסה',
    lastName: `בדיקה${Date.now()}`,
    personalNumber: `QMOCC${Date.now()}`,
   });
   reserveDayId = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: today,
    endDate: today,
    fundingSource: 'internal',
    requestStatus: 'approved',
   });

   await page.reload();
   await page.waitForLoadState('networkidle');

   await expect(page.getByText('פנימי:').first()).toBeVisible({ timeout: 8000 });
  } finally {
   if (reserveDayId) await deleteSubmission(request, reserveDayId);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-QM-005: Right-click on day cell opens context menu', async ({ page }) => {
  const today = new Date().getDate().toString();
  const dayCell = page.locator('[class*="css"]').filter({ hasText: new RegExp(`^${today}$`) }).first();
  await dayCell.dispatchEvent('contextmenu');
  await page.waitForTimeout(300);

  // Use role-based selectors to avoid strict-mode collisions
  await expect(page.getByRole('button', { name: 'ניהול כמויות' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'נהל חגים' })).toBeVisible();

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
 });

 test('TC-QM-006: Set quota via QuotaModal', async ({ page, request }) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 20);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  const futureDay = futureDate.getDate().toString();
  let quotaId: string | null = null;

  try {
   const futureMonth = futureDate.getMonth();
   const currentMonth = new Date().getMonth();
   const monthDiff = futureMonth - currentMonth;
   for (let i = 0; i < monthDiff; i++) {
    await page.locator('button').filter({ has: page.locator('svg') }).first().click();
    await page.waitForTimeout(300);
   }

   const dayCell = page.locator('div').filter({ hasText: new RegExp(`^${futureDay}$`) }).first();
   await dayCell.dispatchEvent('contextmenu');
   await page.waitForTimeout(300);

   await page.getByRole('button', { name: 'ניהול כמויות' }).click();
   await page.waitForTimeout(500);

   const modal = page.getByRole('dialog');
   await expect(modal).toBeVisible();

   await modal.locator('input[type="number"]').first().fill('25');
   await modal.getByRole('button', { name: /שמור|צור|Create|Save/ }).click();
   await page.waitForTimeout(1000);

   await expect(modal).not.toBeVisible({ timeout: 5000 });

   const res = await request.get(`${API}/quotas/date/${futureDateStr}`);
   if (res.ok()) {
    const body = await res.json();
    quotaId = body._id;
    expect(body.quota).toBe(25);
   }
  } finally {
   if (quotaId) await request.delete(`${API}/quotas/${quotaId}`);
   else await request.delete(`${API}/quotas/date/${futureDateStr}`);
  }
 });
});
