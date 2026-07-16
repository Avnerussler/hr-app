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
 const firstName = overrides.firstName ?? `פעולה${Date.now()}`;
 const lastName = overrides.lastName ?? `אוטומטי${Date.now()}`;
 const personalNumber = overrides.personalNumber ?? `AT${Date.now()}`;
 const res = await request.post(`${API}/formSubmission/create`, {
  data: {
   formId,
   formName: 'personnel',
   formData: { firstName, lastName, personalNumber, status: 'active', employmentType: 'reserves', ...overrides },
  },
 });
 return { id: (await res.json()).form._id as string, firstName, lastName, personalNumber };
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
    requestStatus: 'approved',
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

async function openDrawerForToday(page: any) {
 const dayCell = page.locator('div').filter({ hasText: new RegExp(`^${TODAY_DAY}$`) }).first();
 await dayCell.click();
 const drawer = page.getByRole('dialog');
 await expect(drawer).toBeVisible({ timeout: 5000 });
 return drawer;
}

test.describe('Module 6: Attendance Actions', () => {
 let personnelFormId: string;
 let reserveDaysFormId: string;

 test.beforeAll(async ({ request }) => {
  personnelFormId = await getFormId(request, 'personnel');
  reserveDaysFormId = await getFormId(request, 'reserve_days_management');
 });

 test('TC-AT-001: Toggle attendance on via checkbox', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'נוכחות',
    lastName: `פועל${Date.now()}`,
    personalNumber: `TOG1${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'approved' });

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);

   await expect(drawer.getByText('נוכחות')).toBeVisible({ timeout: 8000 });

   const employeeCard = drawer.locator('div').filter({ hasText: 'נוכחות' }).first();
   const checkbox = employeeCard.getByRole('checkbox').first();
   await expect(checkbox).not.toBeChecked();
   await checkbox.click();

   await expect(checkbox).toBeChecked({ timeout: 5000 });
   await expect(employeeCard.getByText('נוכח')).toBeVisible({ timeout: 5000 });
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-AT-002: Toggle attendance off (un-check attended employee)', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'נוכחות2',
    lastName: `כבוי${Date.now()}`,
    personalNumber: `TOG2${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'approved' });

   await request.put(`${API}/quotas/attendance/individual`, {
    data: { employeeId: personnel.id, date: TODAY, hasAttended: true },
   });

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);

   await expect(drawer.getByText('נוכחות2')).toBeVisible({ timeout: 8000 });

   const employeeCard = drawer.locator('div').filter({ hasText: 'נוכחות2' }).first();
   const checkbox = employeeCard.getByRole('checkbox').first();
   await expect(checkbox).toBeChecked({ timeout: 5000 });

   await checkbox.click();
   await expect(checkbox).not.toBeChecked({ timeout: 5000 });
   await expect(employeeCard.getByText('לא הגיע')).toBeVisible({ timeout: 5000 });
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-AT-003: Toggle attendance via badge click', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'תג',
    lastName: `לחיצה${Date.now()}`,
    personalNumber: `BADGE${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'approved' });

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);

   await expect(drawer.getByText('תג')).toBeVisible({ timeout: 8000 });

   const employeeCard = drawer.locator('div').filter({ hasText: 'תג' }).first();
   await employeeCard.getByText('לא הגיע').click();

   await expect(employeeCard.getByText('נוכח')).toBeVisible({ timeout: 5000 });
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-AT-004: Toggle attendance re-enables manager report button', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  let quotaId: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'דוח',
    lastName: `איפוס${Date.now()}`,
    personalNumber: `RESET${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'approved' });

   const quotaCreateRes = await request.post(`${API}/quotas`, {
    data: { date: TODAY, quota: 50, createdBy: 'e2e-test' },
   });
   if (quotaCreateRes.ok()) {
    quotaId = (await quotaCreateRes.json())._id;
   }
   await request.post(`${API}/quotas/attendance/manager-report/${TODAY}`);

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);

   await expect(drawer.getByText('דוח')).toBeVisible({ timeout: 8000 });

   const reportBtn = drawer.getByRole('button', { name: 'דווח לקישור' });
   await expect(reportBtn).toBeDisabled({ timeout: 5000 });

   const employeeCard = drawer.locator('div').filter({ hasText: 'דוח' }).first();
   await employeeCard.getByRole('checkbox').first().click();
   await page.waitForTimeout(1000);

   await expect(reportBtn).not.toBeDisabled({ timeout: 5000 });
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
   if (quotaId) await request.delete(`${API}/quotas/${quotaId}`);
  }
 });

 test('TC-AT-005: Submit manager report successfully', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  let quotaId: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'מנהל',
    lastName: `דוח${Date.now()}`,
    personalNumber: `MGR${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'approved' });

   const quotaCreateRes = await request.post(`${API}/quotas`, {
    data: { date: TODAY, quota: 50, createdBy: 'e2e-test' },
   });
   if (quotaCreateRes.ok()) {
    quotaId = (await quotaCreateRes.json())._id;
   }
   if (quotaId) {
    await request.put(`${API}/quotas/${quotaId}`, { data: { managerReported: false } });
   }

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);
   await expect(drawer.getByText('מנהל')).toBeVisible({ timeout: 8000 });

   const reportBtn = drawer.getByRole('button', { name: 'דווח לקישור' });
   await expect(reportBtn).not.toBeDisabled({ timeout: 5000 });

   await reportBtn.click();
   await page.waitForTimeout(2000);

   await expect(reportBtn).toBeDisabled({ timeout: 5000 });

   const statusRes = await request.get(`${API}/quotas/attendance/manager-report/status/${TODAY}`);
   const status = await statusRes.json();
   expect(status.hasReported).toBe(true);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
   if (quotaId) await request.delete(`${API}/quotas/${quotaId}`);
  }
 });

 test('TC-AT-006: Manager report button is disabled when already reported', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  let quotaId: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'מדווח',
    lastName: `כבר${Date.now()}`,
    personalNumber: `REP${Date.now()}`,
   });
   rid = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'approved' });

   const quotaCreateRes = await request.post(`${API}/quotas`, {
    data: { date: TODAY, quota: 50, createdBy: 'e2e-test' },
   });
   if (quotaCreateRes.ok()) {
    quotaId = (await quotaCreateRes.json())._id;
   }
   await request.post(`${API}/quotas/attendance/manager-report/${TODAY}`);

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);
   await expect(drawer.getByText('מדווח')).toBeVisible({ timeout: 8000 });

   const reportBtn = drawer.getByRole('button', { name: 'דווח לקישור' });
   await expect(reportBtn).toBeDisabled({ timeout: 5000 });
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
   if (quotaId) await request.delete(`${API}/quotas/${quotaId}`);
  }
 });

 test('TC-AT-007: Duplicate manager report via API returns 409', async ({ request }) => {
  let quotaId: string | null = null;
  try {
   const quotaCreateRes = await request.post(`${API}/quotas`, {
    data: { date: TODAY, quota: 50, createdBy: 'e2e-test' },
   });
   if (quotaCreateRes.ok()) {
    quotaId = (await quotaCreateRes.json())._id;
   }
   if (quotaId) {
    await request.put(`${API}/quotas/${quotaId}`, { data: { managerReported: false } });
   }

   const first = await request.post(`${API}/quotas/attendance/manager-report/${TODAY}`);
   expect([200, 201]).toContain(first.status());

   const second = await request.post(`${API}/quotas/attendance/manager-report/${TODAY}`);
   expect(second.status()).toBe(409);
  } finally {
   if (quotaId) await request.delete(`${API}/quotas/${quotaId}`);
  }
 });
});
