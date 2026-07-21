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

async function createPersonnel(request: any, overrides: Record<string, any> = {}): Promise<PersonnelRecord> {
 const firstName = overrides.firstName ?? `פעולה${Date.now()}`;
 const lastName = overrides.lastName ?? `אוטומטי${Date.now()}`;
 const personalNumber = overrides.personalNumber ?? `AT${Date.now()}`;
 const res = await request.post(`${API}/personnel`, {
  data: { firstName, lastName, personalNumber, isActive: true, ...overrides },
 });
 const body = await res.json();
 return { id: body._id as string, firstName, lastName, personalNumber };
}

async function createReserveDay(request: any, personnel: PersonnelRecord, overrides: Record<string, any> = {}): Promise<string> {
 const res = await request.post(`${API}/reserve-days`, {
  data: {
   employeeName: personnel.id,
   startDate: TODAY,
   endDate: TODAY,
   fundingSource: 'internal',
   orderType: '8open',
   requestStatus: 'approved',
   ...overrides,
  },
 });
 const body = await res.json();
 return body._id as string;
}

async function deleteReserveDay(request: any, id: string) {
 await request.delete(`${API}/reserve-days/${id}`);
}

async function deletePersonnel(request: any, id: string) {
 await request.delete(`${API}/personnel/${id}`);
}

async function navigateToQuotaPage(page: any) {
 await page.goto(BASE_URL);
 await page.waitForLoadState('networkidle');
 await page.getByRole('group').filter({ hasText: 'נוכחות ומעקב יומי' }).click();
 await page.waitForURL('**/quota-management');
 await page.waitForLoadState('networkidle');
}

async function openDrawerForToday(page: any) {
 // The calendar's day-number Text node contains only the bare day-of-month
 // (e.g. "21"), isolated from the quota-info text below it in the same cell
 // (see components/Pages/QuotaManagement.tsx) — so an exact-text match on
 // that node alone (not a `div` substring match, which never matches since
 // every day cell's div also contains quota/percentage text) reliably finds
 // today's cell.
 const dayCell = page.getByText(new RegExp(`^${TODAY_DAY}$`), { exact: true }).first();
 await dayCell.click();
 const drawer = page.getByRole('dialog');
 await expect(drawer).toBeVisible({ timeout: 5000 });
 return drawer;
}

/**
 * Search the drawer's employee list for a unique term (personnel.lastName is
 * always timestamp-suffixed, so it's a safe, unambiguous search term) — the
 * drawer's employee list is paginated (DailyAttendanceDrawer.tsx), so a
 * freshly-created employee isn't guaranteed to appear on the default first
 * page; searching narrows the list down to just this employee's card.
 */
async function searchDrawerFor(drawer: any, term: string): Promise<void> {
 await drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)').fill(term);
}

/**
 * Click an employee card's attendance checkbox. Chakra v3's Checkbox
 * (components/ui/checkbox.tsx) renders a visually-hidden native
 * `<input role="checkbox">` plus a separate visible `.chakra-checkbox__control`
 * span on top of it — clicking the `role=checkbox` locator directly hits the
 * hidden input, which the visible control span intercepts (confirmed via
 * Playwright's actionability log: "intercepts pointer events"), so the click
 * silently never lands. Click the visible control span instead.
 */
async function clickAttendanceCheckbox(employeeCard: any): Promise<void> {
 await employeeCard.locator('.chakra-checkbox__control').first().click();
}

/**
 * Get-or-create the Quota doc for TODAY and reset managerReported to false,
 * returning its id and whether this call created it. A Quota for TODAY may
 * already exist from unrelated seed/dev data (POST /api/quotas 400s "Quota
 * already exists for this date" in that case) — falling back to look it up
 * by date via GET /api/quotas instead of leaving the manager-report state
 * untouched, which would let a stale managerReported:true from prior data
 * leak into this test. `created` lets callers avoid deleting a pre-existing
 * quota document they don't own during cleanup.
 */
async function ensureQuotaForToday(request: any): Promise<{ quotaId: string; created: boolean }> {
 const createRes = await request.post(`${API}/quotas`, {
  data: { date: TODAY, quota: 50, createdBy: 'e2e-test' },
 });
 let quotaId: string;
 let created = false;
 if (createRes.ok()) {
  quotaId = (await createRes.json()).data._id;
  created = true;
 } else {
  const listRes = await request.get(`${API}/quotas?date=${TODAY}`);
  const { data } = await listRes.json();
  quotaId = data.quotas[0]._id;
 }
 await request.put(`${API}/quotas/${quotaId}`, { data: { managerReported: false } });
 return { quotaId, created };
}

test.describe('Module 6: Attendance Actions', () => {
 test('TC-AT-001: Toggle attendance on via checkbox', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'נוכחות',
    lastName: `פועל${Date.now()}`,
    personalNumber: `TOG1${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, { requestStatus: 'approved' });

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);
   await searchDrawerFor(drawer, personnel.lastName);

   await expect(drawer.getByText(personnel.lastName)).toBeVisible({ timeout: 8000 });

   const employeeCard = drawer.locator('div').filter({ hasText: personnel.lastName }).first();
   const checkbox = employeeCard.getByRole('checkbox').first();
   await expect(checkbox).not.toBeChecked();
   await clickAttendanceCheckbox(employeeCard);

   await expect(checkbox).toBeChecked({ timeout: 5000 });
   await expect(employeeCard.getByText('נוכח')).toBeVisible({ timeout: 5000 });
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-AT-002: Toggle attendance off (un-check attended employee)', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'נוכחות2',
    lastName: `כבוי${Date.now()}`,
    personalNumber: `TOG2${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, { requestStatus: 'approved' });

   await request.put(`${API}/quotas/attendance/individual`, {
    data: { employeeId: personnel.id, date: TODAY, hasAttended: true },
   });

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);
   await searchDrawerFor(drawer, personnel.lastName);

   await expect(drawer.getByText(personnel.lastName)).toBeVisible({ timeout: 8000 });

   const employeeCard = drawer.locator('div').filter({ hasText: personnel.lastName }).first();
   const checkbox = employeeCard.getByRole('checkbox').first();
   await expect(checkbox).toBeChecked({ timeout: 5000 });

   await clickAttendanceCheckbox(employeeCard);
   await expect(checkbox).not.toBeChecked({ timeout: 5000 });
   await expect(employeeCard.getByText('לא הגיע')).toBeVisible({ timeout: 5000 });
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-AT-003: Toggle attendance via badge click', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'תג',
    lastName: `לחיצה${Date.now()}`,
    personalNumber: `BADGE${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, { requestStatus: 'approved' });

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);
   await searchDrawerFor(drawer, personnel.lastName);

   await expect(drawer.getByText(personnel.lastName)).toBeVisible({ timeout: 8000 });

   const employeeCard = drawer.locator('div').filter({ hasText: personnel.lastName }).first();
   await employeeCard.getByText('לא הגיע').click();

   await expect(employeeCard.getByText('נוכח')).toBeVisible({ timeout: 5000 });
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 // TC-AT-004 through TC-AT-007 all read/write the single global Quota
 // document for TODAY's manager-report state (managerReported flag is keyed
 // by date, not per-test) — running them in parallel workers is a real race:
 // whichever test's manager-report POST/reset lands last flips the flag out
 // from under another concurrently-running test's assertion. `.serial` forces
 // this group to run one at a time (still parallel with TC-AT-001..003, which
 // don't touch the manager-report quota state).
 test.describe.serial('Manager report (shared per-date quota state)', () => {
 test('TC-AT-004: Toggle attendance re-enables manager report button', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  let quotaId: string | null = null;
  let quotaCreated = false;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'דוח',
    lastName: `איפוס${Date.now()}`,
    personalNumber: `RESET${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, { requestStatus: 'approved' });

   ({ quotaId, created: quotaCreated } = await ensureQuotaForToday(request));
   await request.post(`${API}/quotas/attendance/manager-report/${TODAY}`);

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);
   await searchDrawerFor(drawer, personnel.lastName);

   await expect(drawer.getByText(personnel.lastName)).toBeVisible({ timeout: 8000 });

   const reportBtn = drawer.getByRole('button', { name: 'דווח לקישור' });
   await expect(reportBtn).toBeDisabled({ timeout: 5000 });

   const employeeCard = drawer.locator('div').filter({ hasText: personnel.lastName }).first();
   await clickAttendanceCheckbox(employeeCard);
   await page.waitForTimeout(1000);

   await expect(reportBtn).not.toBeDisabled({ timeout: 5000 });
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
   if (quotaId && quotaCreated) await request.delete(`${API}/quotas/${quotaId}`);
  }
 });

 test('TC-AT-005: Submit manager report successfully', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  let quotaId: string | null = null;
  let quotaCreated = false;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'מנהל',
    lastName: `דוח${Date.now()}`,
    personalNumber: `MGR${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, { requestStatus: 'approved' });

   ({ quotaId, created: quotaCreated } = await ensureQuotaForToday(request));

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);
   await searchDrawerFor(drawer, personnel.lastName);
   await expect(drawer.getByText(personnel.lastName)).toBeVisible({ timeout: 8000 });

   const reportBtn = drawer.getByRole('button', { name: 'דווח לקישור' });
   await expect(reportBtn).not.toBeDisabled({ timeout: 5000 });

   await reportBtn.click();
   await page.waitForTimeout(2000);

   await expect(reportBtn).toBeDisabled({ timeout: 5000 });

   const statusRes = await request.get(`${API}/quotas/attendance/manager-report/status/${TODAY}`);
   const status = await statusRes.json();
   expect(status.hasReported).toBe(true);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
   if (quotaId && quotaCreated) await request.delete(`${API}/quotas/${quotaId}`);
  }
 });

 test('TC-AT-006: Manager report button is disabled when already reported', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  let quotaId: string | null = null;
  let quotaCreated = false;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'מדווח',
    lastName: `כבר${Date.now()}`,
    personalNumber: `REP${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, { requestStatus: 'approved' });

   ({ quotaId, created: quotaCreated } = await ensureQuotaForToday(request));
   await request.post(`${API}/quotas/attendance/manager-report/${TODAY}`);

   await navigateToQuotaPage(page);
   const drawer = await openDrawerForToday(page);
   await searchDrawerFor(drawer, personnel.lastName);
   await expect(drawer.getByText(personnel.lastName)).toBeVisible({ timeout: 8000 });

   const reportBtn = drawer.getByRole('button', { name: 'דווח לקישור' });
   await expect(reportBtn).toBeDisabled({ timeout: 5000 });
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
   if (quotaId && quotaCreated) await request.delete(`${API}/quotas/${quotaId}`);
  }
 });

 test('TC-AT-007: Duplicate manager report via API returns 409', async ({ request }) => {
  let quotaId: string | null = null;
  let quotaCreated = false;
  try {
   ({ quotaId, created: quotaCreated } = await ensureQuotaForToday(request));

   const first = await request.post(`${API}/quotas/attendance/manager-report/${TODAY}`);
   expect([200, 201]).toContain(first.status());

   const second = await request.post(`${API}/quotas/attendance/manager-report/${TODAY}`);
   expect(second.status()).toBe(409);
  } finally {
   if (quotaId && quotaCreated) await request.delete(`${API}/quotas/${quotaId}`);
  }
 });
 });
});
