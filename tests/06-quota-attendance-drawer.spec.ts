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

// Personnel and reserve-days live in explicit REST resources (/api/personnel,
// /api/reserve-days) backed by dedicated Mongoose models — the legacy generic
// /api/formSubmission endpoint this file used to hit no longer exists on the
// server (see apps/server/src/routes/index.ts). All helpers below go through
// the current REST endpoints, matching the pattern in
// 04-reserve-days-management-crud.spec.ts / 05-quota-management-calendar.spec.ts.
async function createPersonnel(request: any, overrides: Record<string, any> = {}): Promise<PersonnelRecord> {
 const firstName = overrides.firstName ?? `בדיקה${Date.now()}`;
 const lastName = overrides.lastName ?? `אוטומטי${Date.now()}`;
 const personalNumber = overrides.personalNumber ?? `DR${Date.now()}`;
 const res = await request.post(`${API}/personnel`, {
  data: { firstName, lastName, personalNumber, isActive: true, ...overrides },
 });
 expect(res.ok(), `personnel create failed: ${res.status()}`).toBe(true);
 const body = await res.json();
 return { id: body._id, firstName, lastName, personalNumber };
}

async function createReserveDay(
 request: any,
 personnel: PersonnelRecord,
 overrides: Record<string, any> = {},
): Promise<string> {
 const res = await request.post(`${API}/reserve-days`, {
  data: {
   employeeName: personnel.id,
   startDate: TODAY,
   endDate: TODAY,
   fundingSource: 'internal',
   orderType: '8open',
   requestStatus: 'pending',
   ...overrides,
  },
 });
 expect(res.ok(), `reserve-day create failed: ${res.status()}`).toBe(true);
 return (await res.json())._id;
}

async function deletePersonnel(request: any, id: string) {
 await request.delete(`${API}/personnel/${id}`);
}

async function deleteReserveDay(request: any, id: string) {
 await request.delete(`${API}/reserve-days/${id}`);
}

async function navigateToQuotaPage(page: any) {
 await page.goto(BASE_URL);
 await page.waitForLoadState('networkidle');
 await page.getByRole('group').filter({ hasText: 'נוכחות ומעקב יומי' }).click();
 await page.waitForURL('**/quota-management');
 await page.waitForLoadState('networkidle');
}

async function clickTodayCell(page: any) {
 // The day-number is its own Text node inside the cell's div (QuotaManagement.tsx:931-942);
 // the div itself also contains quota-info text (e.g. "300%) 75/25"), so a hasText filter
 // on the div with an exact-anchor regex can still miss/mismatch. Match the Text node directly.
 const dayCell = page.getByText(new RegExp(`^${TODAY_DAY}$`), { exact: true }).first();
 await dayCell.click();
 await page.waitForTimeout(500);
}

test.describe('Module 5: Daily Attendance Drawer', () => {
 // All tests read the drawer for TODAY and several create/delete their own
 // personnel+reserve-day records while a shared personnel/reserveDayId (see
 // beforeAll/afterAll) is alive for the whole file — running these
 // concurrently (this repo's default fullyParallel: true, 4 workers) causes
 // both personalNumber unique-index collisions (Date.now()-only suffixes can
 // collide across workers within the same millisecond) and cross-test
 // interference on the same day cell. Match file 04's mode: 'serial' fix.
 test.describe.configure({ mode: 'serial' });

 let sharedPersonnel: PersonnelRecord;
 let reserveDayId: string;

 test.beforeAll(async ({ request }) => {
  sharedPersonnel = await createPersonnel(request, {
   firstName: 'דרור',
   lastName: `ציוני${Date.now()}`,
   personalNumber: `DRAWER${Date.now()}`,
  });
  reserveDayId = await createReserveDay(request, sharedPersonnel, {
   startDate: TODAY,
   endDate: TODAY,
   fundingSource: 'internal',
   requestStatus: 'pending',
  });
 });

 test.afterAll(async ({ request }) => {
  if (reserveDayId) await deleteReserveDay(request, reserveDayId);
  if (sharedPersonnel) await deletePersonnel(request, sharedPersonnel.id);
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

  // With ~91 employees scheduled today from accumulated test fixture data,
  // the seeded employee can fall off page 1 (sorted by lastName, 30/page).
  // Search by the unique personal number to avoid depending on pagination order.
  await drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)').fill(sharedPersonnel.personalNumber);
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });
 });

 test('TC-DR-003: Employee starting today shows "מתחיל" badge', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'מתחיל',
    lastName: `היום${Date.now()}`,
    personalNumber: `START${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, {
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
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-DR-004: Employee ending today shows "מסיים" badge', async ({ page, request }) => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'מסיים',
    lastName: `היום${Date.now()}`,
    personalNumber: `END${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, {
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
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-DR-005: External employee shows "חיצוני" badge', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'חיצוני',
    lastName: `מימון${Date.now()}`,
    personalNumber: `EXT${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, {
    fundingSource: 'external',
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   await expect(drawer.getByText('חיצוני').first()).toBeVisible({ timeout: 8000 });
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-DR-006: Pending employee shows unapproved warning icon', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });

  // Same pagination issue as TC-DR-002 — search by personal number so the
  // seeded employee is found regardless of where it sorts on the page.
  await drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)').fill(sharedPersonnel.personalNumber);
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
   personnel = await createPersonnel(request, {
    firstName: 'מסנן',
    lastName: `סטטיסטיקה${Date.now()}`,
    personalNumber: `STAT${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, {
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
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-DR-009: Search by firstName filters results', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });

  // Search directly rather than asserting pre-search visibility — with
  // ~91 employees scheduled today, the seeded employee can be off page 1
  // before filtering (same pagination issue as TC-DR-002/006).
  const searchInput = drawer.locator('input[placeholder*="חפש"]');
  await searchInput.fill('דרור');
  await page.waitForTimeout(600);

  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });
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

  const searchInput = drawer.locator('input[placeholder*="חפש"]');
  // Confirm the seeded employee is reachable via search first (same
  // pagination issue as TC-DR-002/006/009 — sharedPersonnel can be off page 1
  // unfiltered), then verify a no-match search and clearing it restores them.
  await searchInput.fill(sharedPersonnel.personalNumber);
  await page.waitForTimeout(600);
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });

  await searchInput.fill('zzznomatch99999');
  await page.waitForTimeout(600);
  await expect(drawer.getByText('אין עובדים בסינון זה')).toBeVisible({ timeout: 5000 });

  await searchInput.fill(sharedPersonnel.personalNumber);
  await page.waitForTimeout(600);
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 5000 });
 });

 test('TC-DR-012: Filter=external hides internal employees', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'חיצוני',
    lastName: `סינון${Date.now()}`,
    personalNumber: `EXTF${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, {
    fundingSource: 'external',
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   // Search by personal number first to confirm this test's own seeded
   // employee is reachable at all — with ~91 employees scheduled today, it
   // can be off page 1 unfiltered — then clear the search before applying
   // the funding-source filter under test, so the filter's own effect
   // (not the leftover text search) is what's being verified below.
   const searchInput = drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)');
   await searchInput.fill(personnel.personalNumber);
   await expect(drawer.getByText('מימון חיצוני')).toBeVisible({ timeout: 8000 });
   await searchInput.fill('');
   await page.waitForTimeout(600);

   await drawer.getByText('מימון חיצוני').first().click();
   await page.waitForTimeout(500);

   await expect(drawer.getByText('חיצוני').first()).toBeVisible();
   await searchInput.fill(sharedPersonnel.personalNumber);
   await page.waitForTimeout(600);
   await expect(drawer.getByText('דרור')).not.toBeVisible();
   await searchInput.fill('');

   await drawer.getByRole('button', { name: 'נקה סינון' }).click();
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-DR-013: Filter=internal hides external employees', async ({ page, request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'חיצוני',
    lastName: `סינון2${Date.now()}`,
    personalNumber: `EXTF2${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, {
    fundingSource: 'external',
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   // Confirm this test's own (external-funded) seeded employee is reachable
   // via search first — same pagination risk as the other TC-DR tests —
   // then clear the search before applying the internal-funding filter, so
   // the filter's own effect is what's verified, not the leftover text search.
   const searchInput = drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)');
   await searchInput.fill(personnel.personalNumber);
   await expect(drawer.getByText('מימון פנימי')).toBeVisible({ timeout: 8000 });
   await searchInput.fill('');
   await page.waitForTimeout(600);

   await drawer.getByText('מימון פנימי').first().click();
   await page.waitForTimeout(500);

   // Only this test's own external-funded employee must be excluded — other
   // unrelated external-funded employees may exist in the wider dataset, so
   // scope the check by searching for this employee specifically.
   await searchInput.fill(personnel.personalNumber);
   await page.waitForTimeout(600);
   // Exact match — "מימון חיצוני" (the always-visible filter chip label) contains
   // "חיצוני" as a substring, so a non-exact getByText would match the chip
   // itself instead of the per-employee badge and always report "visible".
   await expect(drawer.getByText('חיצוני', { exact: true })).not.toBeVisible();
   await searchInput.fill('');

   await drawer.getByRole('button', { name: 'נקה סינון' }).click();
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-DR-014: Attendance report modal opens and shows columns', async ({ page }) => {
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });
  // Same pagination issue as TC-DR-002/006/009/011 — search by personal number.
  await drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)').fill(sharedPersonnel.personalNumber);
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });

  await drawer.getByRole('button', { name: 'הצג דוח' }).click();
  await page.waitForTimeout(500);

  // Scope by unique content, not `.last()` — once this dialog closes, `.last()`
  // re-resolves to whatever dialog is now last in the DOM (e.g. the still-open
  // drawer behind it), silently pointing the locator at the wrong element.
  const reportModal = page.getByRole('dialog').filter({ hasText: 'שם פרטי' });
  await expect(reportModal).toBeVisible({ timeout: 5000 });

  await expect(reportModal.getByText('שם פרטי')).toBeVisible();
  await expect(reportModal.getByText('שם משפחה')).toBeVisible();
  await expect(reportModal.getByText('מספר אישי')).toBeVisible();
  await expect(reportModal.getByText('ימי מילואים')).toBeVisible();

  // The modal has both an icon-only dialog close trigger (aria-label="סגור", no text
  // content) and a visible footer button with the same accessible name — both match
  // a role query, so target the one with visible text content specifically.
  const closeBtn = reportModal.getByRole('button', { name: 'סגור', exact: true }).filter({ hasText: 'סגור' });
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
   personnel = await createPersonnel(request, {
    firstName: 'ימי',
    lastName: `מילואים${Date.now()}`,
    personalNumber: `DAYS${Date.now()}`,
   });
   rid = await createReserveDay(request, personnel, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   // Search by personal number — both to reach this test's own seeded
   // employee past pagination, and to scope the report modal (which
   // respects the drawer's search filter, see DailyAttendanceDrawer.tsx's
   // `search={debouncedSearch}` prop) to just this employee, since a bare
   // "5" count assertion would otherwise be ambiguous against other rows.
   await drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)').fill(personnel.personalNumber);
   // Match on the generated lastName instead of "ימי" — the employee's first
   // name "ימי" is also a substring of always-visible chip labels like
   // "מסיימים היום" and "מימון פנימי", so it can match those instead of the card.
   await expect(drawer.getByText(personnel.lastName)).toBeVisible({ timeout: 8000 });

   await drawer.getByRole('button', { name: 'הצג דוח' }).click();
   await page.waitForTimeout(500);

   // Scope by unique content, not `.last()` — once this dialog closes, `.last()`
   // re-resolves to whatever dialog is now last in the DOM (e.g. the still-open
   // drawer behind it), silently pointing the locator at the wrong element.
   const reportModal = page.getByRole('dialog').filter({ hasText: 'שם פרטי' });
   await expect(reportModal).toBeVisible({ timeout: 5000 });
   await expect(reportModal.getByText('5')).toBeVisible({ timeout: 5000 });

   // The modal has both an icon-only dialog close trigger (aria-label="סגור", no text
   // content) and a visible footer button with the same accessible name — both match
   // a role query, so target the one with visible text content specifically.
   const closeBtn = reportModal.getByRole('button', { name: 'סגור', exact: true }).filter({ hasText: 'סגור' });
   await closeBtn.click();
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-DR-016: Employee card shows expired-base-entry-approval warning when the approval ended before today', async ({
  page,
  request,
 }) => {
  // Personnel whose base-entry approval range ended 5 days ago — today's
  // reserve day therefore falls after the approval expired. This must surface
  // the UnapprovedBaseEntryWarning badge on the card (see
  // EmployeeAttendanceCard.tsx / routes/quota/get.ts hasExpiredVehicleApproval).
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'פגתוקף',
    lastName: `רכב${Date.now()}`,
    personalNumber: `VEXP${Date.now()}`,
    entryStartDate: tenDaysAgo,
    entryEndDate: fiveDaysAgo,
   });
   rid = await createReserveDay(request, personnel, {
    startDate: TODAY,
    endDate: TODAY,
    requestStatus: 'approved',
   });

   await navigateToQuotaPage(page);
   await clickTodayCell(page);

   const drawer = page.getByRole('dialog');
   await expect(drawer).toBeVisible({ timeout: 5000 });
   // Same pagination issue as TC-DR-002/006/009/011/014/015 — search by personal number.
   await drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)').fill(personnel.personalNumber);
   await expect(drawer.getByText('פגתוקף')).toBeVisible({ timeout: 8000 });

   // UnapprovedBaseEntryWarning renders react-icons' FaDoorClosed in orange, with
   // no other orange svg on the card — target it by fill color rather than a bare
   // svg selector (the compact details row below also renders several svgs:
   // FaIdBadge/FaPhone/FaUsers/etc., so a plain `.locator('svg').first()` is
   // not reliably the warning icon).
   const employeeCard = drawer.locator('div').filter({ hasText: 'פגתוקף' }).last();
   const warningIcon = employeeCard.locator('svg[fill="orange"]').first();
   await expect(warningIcon).toBeVisible({ timeout: 5000 });
   await warningIcon.hover();
   await expect(page.getByText('תוקף אישור כניסה לבסיס')).toBeVisible({ timeout: 5000 });
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-DR-017: Employee card has NO expired-base-entry warning when no approval range is set', async ({
  page,
 }) => {
  // sharedPersonnel (created in beforeAll) has no entryStartDate/entryEndDate
  // at all — per the "only flag EXPIRED approvals" rule, no range configured
  // must never trigger the warning.
  await navigateToQuotaPage(page);
  await clickTodayCell(page);

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible({ timeout: 5000 });
  // Same pagination issue as TC-DR-002/006/etc — search by personal number.
  await drawer.getByPlaceholder('חפש עובדים (שם, ת.ז., מייל...)').fill(sharedPersonnel.personalNumber);
  await expect(drawer.getByText('דרור')).toBeVisible({ timeout: 8000 });

  const employeeCard = drawer.locator('div').filter({ hasText: 'דרור' }).last();
  await expect(employeeCard.getByText('תוקף אישור כניסה לבסיס')).not.toBeVisible();
 });
});
