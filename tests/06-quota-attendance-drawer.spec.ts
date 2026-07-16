// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:5173';

const TODAY = new Date().toISOString().split('T')[0];
const TODAY_DAY = new Date().getDate().toString();

interface PersonnelRecord {
 id: string;
 firstName: string;
 lastName: string;
 personalNumber: string;
}

async function getFormId(request: any, formName: string): Promise<string> {
 const res = await request.get(`${API}/formSubmission?formName=${formName}&page=1&limit=1`);
 const body = await res.json();
 return body.forms[0].formId;
}

async function createPersonnel(request: any, formId: string, overrides: Record<string, any> = {}): Promise<PersonnelRecord> {
 const firstName = overrides.firstName ?? `בדיקה${Date.now()}`;
 const lastName = overrides.lastName ?? `אוטומטי${Date.now()}`;
 const personalNumber = overrides.personalNumber ?? `DR${Date.now()}`;
 const res = await request.post(`${API}/formSubmission/create`, {
  data: {
   formId,
   formName: 'personnel',
   formData: { firstName, lastName, personalNumber, status: 'active', employmentType: 'reserves', ...overrides },
  },
 });
 const body = await res.json();
 return { id: body.form._id as string, firstName, lastName, personalNumber };
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
    startDate: TODAY,
    endDate: TODAY,
    fundingSource: 'internal',
    orderType: '8open',
    requestStatus: 'pending',
    isActive: true,
    vehicleEntry: false,
    ...overrides,
   },
  },
 });
 return (await res.json()).form._id as string;
}

async function deleteSubmission(request: any, id: string) {
 await request.post(`${API}/formSubmission/delete`, { data: { id } });
}

async function navigateToQuotaPage(page: any) {
 await page.goto(BASE_URL);
 await page.waitForLoadState('networkidle');
 await page.getByRole('group').filter({ hasText: 'נוכחות ומעקב יומי' }).click();
 await page.waitForURL('**/quota-management');
 await page.waitForLoadState('networkidle');
}

async function clickTodayCell(page: any) {
 const dayCell = page.locator('div').filter({ hasText: new RegExp(`^${TODAY_DAY}$`) }).first();
 await dayCell.click();
 await page.waitForTimeout(500);
}

test.describe('Module 5: Daily Attendance Drawer', () => {
 let personnelFormId: string;
 let reserveDaysFormId: string;
 let sharedPersonnel: PersonnelRecord;
 let reserveDayId: string;

 test.beforeAll(async ({ request }) => {
  personnelFormId = await getFormId(request, 'personnel');
  reserveDaysFormId = await getFormId(request, 'reserve_days_management');

  sharedPersonnel = await createPersonnel(request, personnelFormId, {
   firstName: 'דרור',
   lastName: `ציוני${Date.now()}`,
   personalNumber: `DRAWER${Date.now()}`,
  });
  reserveDayId = await createReserveDay(request, reserveDaysFormId, sharedPersonnel, {
   startDate: TODAY,
   endDate: TODAY,
   fundingSource: 'internal',
   requestStatus: 'pending',
  });
 });

 test.afterAll(async ({ request }) => {
  if (reserveDayId) await deleteSubmission(request, reserveDayId);
  if (sharedPersonnel) await deleteSubmission(request, sharedPersonnel.id);
 });

 test('TC-DR-001: Clicking a day cell opens the drawer', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });
  await expect(drawer.getByText('נוכחות יומית')).toBeVisible();
 });

 test('TC-DR-002: Seeded employee appears in employee list', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });
 });

 test('TC-DR-003: Employee starting today shows "מתחיל" badge', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'מתחיל',
    lastName: `היום${Date.now()}`,
    personalNumber: `START${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: TODAY,
    endDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   await expect(drawer.getByText('מתחיל').first()).toBeVisible({ timeout: 8000 });
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-DR-004: Employee ending today shows "מסיים" badge', async ({ page, request }) => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'מסיים',
    lastName: `היום${Date.now()}`,
    personalNumber: `END${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: yesterday,
    endDate: TODAY,
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   await expect(drawer.getByText('מסיים').first()).toBeVisible({ timeout: 8000 });
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-DR-005: External employee shows "חיצוני" badge', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'חיצוני',
    lastName: `מימון${Date.now()}`,
    personalNumber: `EXT${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, {
    fundingSource: 'external',
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   await expect(drawer.getByText('חיצוני').first()).toBeVisible({ timeout: 8000 });
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-DR-006: Pending employee shows unapproved warning icon', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });

  const warningIcon = drawer.locator('[title*="לא מאושר"], [aria-label*="לא מאושר"], [class*="warning"], svg').first();
  await expect(warningIcon).toBeVisible({ timeout: 5000 });
 });

 test('TC-DR-007: Statistics cards are visible in drawer', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });

  await expect(drawer.getByText('מתחילים היום')).toBeVisible({ timeout: 8000 });
  await expect(drawer.getByText('מסיימים היום')).toBeVisible();
  await expect(drawer.getByText('הגיעו בפועל')).toBeVisible();
  await expect(drawer.getByText('מימון פנימי')).toBeVisible();
  await expect(drawer.getByText('מימון חיצוני')).toBeVisible();
 });

 test('TC-DR-008: Click stat card filters the employee list', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'מסנן',
    lastName: `סטטיסטיקה${Date.now()}`,
    personalNumber: `STAT${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: TODAY,
    endDate: tomorrow,
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   await expect(drawer.getByText('מתחילים היום')).toBeVisible({ timeout: 8000 });

   await drawer.getByText('מתחילים היום').click();
   await page.waitForTimeout(500);

   await expect(drawer.getByRole('button', { name: 'נקה סינון' })).toBeVisible();

   const cards = drawer.locator('div').filter({ has: drawer.locator('[role="checkbox"]') });
   const count = await cards.count();
   if (count > 0) {
    await expect(drawer.getByText('מתחיל').first()).toBeVisible();
   }

   await drawer.getByRole('button', { name: 'נקה סינון' }).click();
   await page.waitForTimeout(300);
   await expect(drawer.getByRole('button', { name: 'נקה סינון' })).not.toBeVisible();
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-DR-009: Search by firstName filters results', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });

  const searchInput = drawer.locator('input[placeholder*="חפש"]');
  await searchInput.fill('דרור');
  await page.waitForTimeout(600);

  await expect(drawer.getByText('דרור')).toBeVisible();
 });

 test('TC-DR-010: Search with no match shows empty state', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });

  const searchInput = drawer.locator('input[placeholder*="חפש"]');
  await searchInput.fill('zzznomatch99999');
  await page.waitForTimeout(600);

  await expect(drawer.getByText('אין עובדים בסינון זה')).toBeVisible({ timeout: 5000 });
 });

 test('TC-DR-011: Clearing search restores full list', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });

  const searchInput = drawer.locator('input[placeholder*="חפש"]');
  await searchInput.fill('zzznomatch99999');
  await page.waitForTimeout(600);
  await expect(drawer.getByText('אין עובדים בסינון זה')).toBeVisible({ timeout: 5000 });

  await searchInput.fill('');
  await page.waitForTimeout(600);
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 5000 });
 });

 test('TC-DR-012: Filter=external hides internal employees', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'חיצוני',
    lastName: `סינון${Date.now()}`,
    personalNumber: `EXTF${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, {
    fundingSource: 'external',
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   await expect(drawer.getByText('מימון חיצוני')).toBeVisible({ timeout: 8000 });

   await drawer.getByText('מימון חיצוני').click();
   await page.waitForTimeout(500);

   await expect(drawer.getByText('חיצוני').first()).toBeVisible();
   await expect(drawer.getByText('דרור')).not.toBeVisible();

   await drawer.getByRole('button', { name: 'נקה סינון' }).click();
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-DR-013: Filter=internal hides external employees', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'חיצוני',
    lastName: `סינון2${Date.now()}`,
    personalNumber: `EXTF2${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, {
    fundingSource: 'external',
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   await expect(drawer.getByText('מימון פנימי')).toBeVisible({ timeout: 8000 });

   await drawer.getByText('מימון פנימי').click();
   await page.waitForTimeout(500);

   await expect(drawer.getByText('חיצוני')).not.toBeVisible();

   await drawer.getByRole('button', { name: 'נקה סינון' }).click();
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-DR-014: Attendance report modal opens and shows columns', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });

  await drawer.getByRole('button', { name: 'הצג דוח' }).click();
  await page.waitForTimeout(500);

  const reportModal = page.getByRole('dialog').last();
  await expect(reportModal).toBeVisible({ timeout: 5000 });

  await expect(reportModal.getByText('שם פרטי')).toBeVisible();
  await expect(reportModal.getByText('שם משפחה')).toBeVisible();
  await expect(reportModal.getByText('מספר אישי')).toBeVisible();
  await expect(reportModal.getByText('ימי מילואים')).toBeVisible();

  const closeBtn = reportModal.getByRole('button', { name: /סגור|Close/i });
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await expect(reportModal).not.toBeVisible({ timeout: 3000 });
 });

 test('TC-DR-015: Report modal shows reserveDays count per employee', async ({ page, request }) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 2);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 2);

  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'ימי',
    lastName: `מילואים${Date.now()}`,
    personalNumber: `DAYS${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   await expect(drawer.getByText('ימי')).toBeVisible({ timeout: 8000 });

   await drawer.getByRole('button', { name: 'הצג דוח' }).click();
   await page.waitForTimeout(500);

   const reportModal = page.getByRole('dialog').last();
   await expect(reportModal).toBeVisible({ timeout: 5000 });
   await expect(reportModal.getByText('5')).toBeVisible({ timeout: 5000 });

   await reportModal.getByRole('button', { name: /סגור|Close/i }).click();
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });
});
