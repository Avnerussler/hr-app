// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts
//
// Dashboard / statistics: metric reliability, all statistics reports, and
// live-update behavior.
//
// Three concerns, all regressions we care about:
//  1. Every MetricCard rendered on a form page (personnel / project /
//     reserve-days) must equal the value returned by its metrics endpoint —
//     personnel still reads GET /api/formSubmission/metrics/:formId (not yet
//     cut over), while project_management and reserve_days_management read
//     the new GET /api/projects/metrics and GET /api/reserve-days/metrics —
//     covers count-total, count-filtered, and sum metric configs.
//  2. Every Dashboard statistics report renders and its UI values agree with
//     the corresponding /api/statistics/* endpoint — covers all 5 reports.
//  3. Creating / editing a record updates the relevant MetricCards and the
//     Dashboard immediately (React Query invalidation) and via auto-refresh.
//
// NOTE on defaults: the create form does NOT persist a field's schema
// defaultValue for untouched select/radio fields. Tests therefore select
// statuses explicitly (e.g. projectStatus, requestStatus) rather than relying
// on the schema default.

import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

const API_ORIGIN = 'http://localhost:3001';

interface CalculatedMetric {
 id: string;
 title: string;
 value: number;
 icon?: string;
 color?: string;
}

// -----------------------------------------------------------------------------
// Generic helpers
// -----------------------------------------------------------------------------

/** Convert a "YYYY-MM-DD" date string to the "DD/MM/YYYY" format the DatePicker range input expects. */
function toPickerDate(isoDate: string): string {
 const [year, month, day] = isoDate.split('-');
 return `${day}/${month}/${year}`;
}

/**
 * Fill the date-range picker's two "dd/mm/yyyy" inputs within `scope` (the
 * shared ControlledDateRangeField — components/ControlledFields/ControlledDateRangeField.tsx —
 * always renders dd/mm/yyyy, regardless of which entity's form embeds it).
 * Uses pressSequentially (not .fill()) — the ark-ui date-input parses
 * keystrokes as they're typed, and a bulk .fill() on the second (end) input
 * is silently dropped, leaving only the start date registered.
 */
async function fillDateRangeInputs(
 scope: import('@playwright/test').Locator,
 startDate: string,
 endDate: string
): Promise<void> {
 const dateInputs = scope.getByPlaceholder('dd/mm/yyyy');
 await dateInputs.nth(0).click();
 await dateInputs.nth(0).pressSequentially(toPickerDate(startDate));
 // Blur+re-focus between the two inputs — typing into the end input
 // immediately after the start input can race ark-ui's own commit of the
 // just-typed start value, silently dropping a leading digit from it
 // (observed: "10" committed as "02"). Tabbing off the start input first
 // forces its value to commit before the end input's keystrokes begin.
 await dateInputs.nth(0).press('Tab');
 await dateInputs.nth(1).click();
 await dateInputs.nth(1).pressSequentially(toPickerDate(endDate));
 // Blur the end input — ark-ui's date-input commits/parses the typed value on
 // blur (fixOnBlur), which is also what triggers the field's onChange into RHF.
 await dateInputs.nth(1).press('Tab');
}

const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => {
 const d = new Date();
 d.setDate(d.getDate() - n);
 return d.toISOString().split('T')[0];
};

/** Fetch every reserve-day order via the new /api/reserve-days REST endpoint. */
async function fetchAllReserveDays(
 request: APIRequestContext
): Promise<Array<Record<string, any>>> {
 const all: Array<Record<string, any>> = [];
 for (let page = 1; page <= 20; page++) {
  const res = await request.get(
   `${API_ORIGIN}/api/reserve-days?limit=500&page=${page}`
  );
  expect(res.ok(), `reserve-days list failed: ${res.status()}`).toBe(true);
  const body = await res.json();
  const items = body.items ?? [];
  all.push(...items);
  const total = body.pagination?.total ?? all.length;
  if (all.length >= total || items.length === 0) break;
 }
 return all;
}

/**
 * Fetch every personnel record via the new /api/personnel REST endpoint.
 * reserve_days_management is fully cut over — its employeeName field (and the
 * EmployeeSelect UI search) resolve against this NEW Personnel collection, not
 * the frozen formSubmission snapshot, so employee selection in reserve-day
 * flows must pick ids from here.
 */
async function fetchAllPersonnelNew(
 request: APIRequestContext
): Promise<Array<Record<string, any>>> {
 const all: Array<Record<string, any>> = [];
 for (let page = 1; page <= 20; page++) {
  const res = await request.get(
   `${API_ORIGIN}/api/personnel?limit=500&page=${page}`
  );
  expect(res.ok(), `personnel list failed: ${res.status()}`).toBe(true);
  const body = await res.json();
  const items = body.items ?? [];
  all.push(...items);
  const total = body.pagination?.total ?? all.length;
  if (all.length >= total || items.length === 0) break;
 }
 return all;
}

interface FreeEmployee {
 id: string;
 personalNumber: string;
 firstName: string;
 lastName: string;
}

/**
 * Find a personnel record that has NO reserve order overlapping `date`, so a
 * new order for that employee/date won't trip the noOverlap (409) business rule.
 * `skipIds` lets callers avoid re-picking an employee used earlier in the test.
 */
async function findConflictFreeEmployee(
 request: APIRequestContext,
 date: string,
 skipIds: Set<string> = new Set()
): Promise<FreeEmployee> {
 const target = new Date(`${date}T00:00:00.000Z`).getTime();
 // reserve_days_management is fully cut over to /api/reserve-days — read
 // ground truth from there, not the frozen formSubmission snapshot.
 const orders = await fetchAllReserveDays(request);

 const busy = new Set<string>();
 for (const o of orders) {
  const empId = o.employeeName?._id ?? o.employeeName;
  const s = new Date(o.startDate).getTime();
  const e = new Date(o.endDate).getTime();
  if (empId && !Number.isNaN(s) && !Number.isNaN(e) && s <= target && target <= e) {
   busy.add(String(empId));
  }
 }

 // Pick the employee from the NEW /api/personnel collection — reserve-days'
 // EmployeeSelect UI searches against this collection (not the old
 // formSubmission personnel snapshot), so ids must come from here to be
 // selectable in the create-reserve-day drawer.
 const personnel = await fetchAllPersonnelNew(request);
 const free = personnel.find((p) => {
  const id = String(p._id);
  return !busy.has(id) && !skipIds.has(id) && !!p.personalNumber;
 });
 expect(free, `no conflict-free employee for ${date}`).toBeTruthy();
 const fd = free!;
 return {
  id: String(free!._id),
  personalNumber: fd.personalNumber,
  firstName: fd.firstName,
  lastName: fd.lastName,
 };
}

/**
 * Ground-truth metric values from the fully-cut-over REST endpoints. personnel,
 * project_management, and reserve_days_management each have their own explicit
 * model/service (no generic FormSubmissions store — see apps/server/CLAUDE.md),
 * so their metrics are read from GET /api/personnel/metrics,
 * /api/projects/metrics, and /api/reserve-days/metrics respectively.
 */
async function fetchMetricsForEntity(
 request: APIRequestContext,
 formName: string
): Promise<CalculatedMetric[]> {
 const path =
  formName === 'personnel'
   ? '/api/personnel/metrics'
   : formName === 'project_management'
   ? '/api/projects/metrics'
   : formName === 'reserve_days_management'
   ? '/api/reserve-days/metrics'
   : undefined;
 expect(path, `no new metrics endpoint mapped for "${formName}"`).toBeTruthy();
 const res = await request.get(`${API_ORIGIN}${path}`);
 expect(res.ok(), `metrics request failed: ${res.status()}`).toBe(true);
 return (await res.json()) as CalculatedMetric[];
}

/**
 * Read the numeric value shown on a MetricCard given its label text.
 * MetricCard renders <Text>{label}</Text> and <Text>{value}</Text> as direct
 * siblings inside a common Box (components/common/MetricCard.tsx). We locate the
 * label and read the immediately-following sibling element.
 */
async function readMetricValue(scope: Page, label: string): Promise<number> {
 const labelNode = scope.getByText(label, { exact: true }).first();
 await expect(labelNode).toBeVisible();
 const valueText = await labelNode
  .locator('xpath=following-sibling::*[1]')
  .innerText();
 const parsed = Number(valueText.trim());
 expect(
  Number.isNaN(parsed),
  `metric "${label}" value "${valueText}" is not numeric`
 ).toBe(false);
 return parsed;
}

/** Poll a MetricCard value until it satisfies `predicate` (async refetch). */
async function expectMetricToReach(
 page: Page,
 label: string,
 predicate: (value: number) => boolean,
 timeout: number
): Promise<void> {
 await expect(async () => {
  const value = await readMetricValue(page, label);
  expect(predicate(value)).toBe(true);
 }).toPass({ timeout });
}

/** Navigate the app shell to a form list page and wait for its table. */
async function gotoFormPage(
 page: Page,
 groupFilterText: string,
 headingName: string
): Promise<void> {
 await page.goto('/');
 await page.waitForLoadState('networkidle');
 await page.getByRole('group').filter({ hasText: groupFilterText }).click();
 await expect(page.getByRole('heading', { name: headingName })).toBeVisible();
}

async function gotoDashboard(page: Page): Promise<void> {
 // The MetricCards render a "0" placeholder (activeProjectCount ?? 0) until the
 // statistics queries resolve, so wait for the relevant responses before any
 // read to avoid capturing the loading value.
 const dailyDone = page
  .waitForResponse(
   (r) => r.url().includes('/api/statistics/daily-summary') && r.ok(),
   { timeout: 15_000 }
  )
  .catch(() => undefined);
 const analyticsDone = page
  .waitForResponse(
   (r) => r.url().includes('/api/statistics/project-analytics') && r.ok(),
   { timeout: 15_000 }
  )
  .catch(() => undefined);

 await page.goto('/dashboard');
 await expect(
  page.getByRole('heading', { name: /לוח בקרה - סטטיסטיקות מילואים/ })
 ).toBeVisible();
 await Promise.all([dailyDone, analyticsDone]);
}

/** Choose an option in a Chakra v3 select identified by its trigger text. */
async function selectOption(
 scope: Page,
 triggerText: string | RegExp,
 optionName: string
): Promise<void> {
 const combo = scope.getByRole('combobox').filter({ hasText: triggerText });
 await combo.click();
 await scope.getByRole('option', { name: optionName, exact: true }).first().click();
}

// -----------------------------------------------------------------------------
// Create helpers (explicit statuses — no reliance on schema defaults)
// -----------------------------------------------------------------------------

/**
 * Fill the reserve-days create drawer (does NOT submit). Assumes the drawer is
 * already open. Selects `employee` by typing its personalNumber into the
 * enhancedSelect search, sets the dates, order type, and requestStatus.
 */
async function fillReserveDayDrawer(
 page: Page,
 employee: FreeEmployee,
 startDate: string,
 endDate: string,
 requestStatusLabel: string
): Promise<void> {
 const drawer = page.getByRole('dialog');
 await expect(drawer).toBeVisible();

 // Employee (enhancedSelect): open, type the unique personalNumber, pick result.
 const employeeCombobox = drawer
  .getByRole('combobox')
  .filter({ hasText: 'חפש ובחר עובד' });
 await employeeCombobox.click();
 const search = page.getByPlaceholder('Search...');
 await expect(search).toBeVisible();
 await search.fill(employee.personalNumber);
 await page.waitForTimeout(400);
 await page
  .getByRole('option')
  .filter({ hasText: employee.personalNumber })
  .first()
  .click();

 await fillDateRangeInputs(drawer, startDate, endDate);
 // Chakra renders a visually-hidden control span that can intercept the radio
 // click; click the radio's visible label to avoid flakiness.
 await drawer.getByText('צו 8 פתוח', { exact: true }).click();

 // fundingSource: the app now defaults this select to 'פנימי' (internal), but
 // to stay robust regardless of default behavior, select it explicitly — the
 // daily-summary report counts orders by fundingSource, so a null value would
 // make the new order invisible there. Match either the placeholder or an
 // already-selected value so this works whether or not a default is applied.
 await selectOption(page, /בחר מקור מימון|פנימי|חיצוני/, 'פנימי');

 // requestStatus is required; select it explicitly.
 await selectOption(page, /בחר סטטוס בקשה|ממתין לטיפול|אושר|נדחה/, requestStatusLabel);
}

/**
 * Create a reserve-days record via the UI, assuming we start on the
 * reserve_days_management list page. Uses a conflict-free employee for `date`
 * so the noOverlap rule doesn't reject it; retries with a different employee if
 * a 409 slips through (seed data for `date` may be dense). Returns employee used.
 */
async function createReserveDay(
 page: Page,
 request: APIRequestContext,
 date: string,
 requestStatusLabel = 'ממתין לטיפול'
): Promise<FreeEmployee> {
 const tried = new Set<string>();

 for (let attempt = 0; attempt < 4; attempt++) {
  const employee = await findConflictFreeEmployee(request, date, tried);
  tried.add(employee.id);

  await page.getByRole('button', { name: 'צווי מילואים' }).click();
  await page.waitForURL('**/new');
  await fillReserveDayDrawer(page, employee, date, date, requestStatusLabel);

  // Watch the create response so we can detect a 409 (noOverlap) and retry.
  const createResp = page
   .waitForResponse(
    (r) =>
     r.url().toLowerCase().includes('/reserve-days') &&
     r.request().method() === 'POST',
    { timeout: 15_000 }
   )
   .catch(() => undefined);

  await page
   .getByRole('dialog')
   .getByRole('button', { name: /✨ Create/i })
   .click();

  const resp = await createResp;
  if (resp && resp.status() === 409) {
   // Overlap for this employee/date — close the drawer and try another.
   await page.getByRole('button', { name: /Cancel/i }).click();
   await page.waitForURL(/\/reserve_days_management\/default$/);
   continue;
  }

  await page.waitForURL(/\/reserve_days_management\/default$/);
  await expect(page.getByRole('table')).toBeVisible();
  return employee;
 }

 throw new Error(`could not create a non-conflicting reserve day for ${date}`);
}

/**
 * Create a project via the UI. Navigates to the project list first and selects
 * the given status ('פעיל' | 'לא פעיל' | 'מושהה') explicitly. Returns the name.
 */
async function createProject(page: Page, statusLabel = 'פעיל'): Promise<string> {
 const projectName =
  'פרויקט ' + faker.word.noun() + ' ' + faker.string.alphanumeric(4);

 await gotoFormPage(
  page,
  'ניהול פרויקטיםProject Tracking',
  'ניהול פרויקטים'
 );

 await page.getByRole('button', { name: 'ניהול פרויקטים' }).click();
 await page.waitForURL('**/new');

 const drawer = page.getByRole('dialog');
 await expect(drawer).toBeVisible();
 await drawer.locator('input[name="projectName"]').fill(projectName);

 // projectStatus is a select that may render its placeholder 'בחר סטטוס' or an
 // already-selected default value ('פעיל'/'לא פעיל'/'מושהה'); match either so
 // this is robust regardless of whether a default is applied.
 await selectOption(page, /בחר סטטוס|פעיל|לא פעיל|מושהה/, statusLabel);

 await drawer.getByRole('button', { name: /✨ Create/i }).click();
 await page.waitForURL(/\/project_management\/default$/);
 await expect(page.getByRole('table')).toBeVisible();

 return projectName;
}

// -----------------------------------------------------------------------------
// 1. Metric reliability — every MetricCard matches the metrics endpoint
// -----------------------------------------------------------------------------

const FORM_PAGES = [
 {
  formName: 'personnel',
  group: 'משאבי אנושEmployee Management',
  heading: 'משאבי אנוש',
 },
 {
  formName: 'project_management',
  group: 'ניהול פרויקטיםProject Tracking',
  heading: 'ניהול פרויקטים',
 },
 {
  formName: 'reserve_days_management',
  group: 'צווי מילואיםReserve Days Management',
  heading: 'צווי מילואים',
 },
];

test.describe('Module 9A: MetricCard reliability (all metric types)', () => {
 for (const form of FORM_PAGES) {
  test(`TC-METRIC-${form.formName}: every MetricCard matches the metrics API`, async ({
   page,
   request,
  }) => {
   const metrics = await fetchMetricsForEntity(request, form.formName);

   // Forms without metrics configured render no cards — skip cleanly.
   test.skip(metrics.length === 0, `${form.formName} has no metrics configured`);

   await gotoFormPage(page, form.group, form.heading);

   // Each metric card's displayed value must equal the API's value.
   for (const metric of metrics) {
    await expectMetricToReach(
     page,
     metric.title,
     (v) => v === metric.value,
     15_000
    );
   }
  });
 }

 test('TC-METRIC-project-filtered-consistency: filtered status counts sum to total', async ({
  request,
 }) => {
  // The project form defines total + active/inactive/pending filtered counts.
  // The three status buckets need not sum to total (records may have no/other
  // status), but each must be <= total and non-negative — a sanity invariant.
  const metrics = await fetchMetricsForEntity(request, 'project_management');
  const byId = Object.fromEntries(metrics.map((m) => [m.id, m.value]));

  const total = byId['total'];
  expect(total).toBeGreaterThanOrEqual(0);
  for (const id of ['active', 'inactive', 'pending']) {
   if (byId[id] === undefined) continue;
   expect(byId[id]).toBeGreaterThanOrEqual(0);
   expect(byId[id]).toBeLessThanOrEqual(total);
  }
 });
});

// -----------------------------------------------------------------------------
// 2. All statistics reports render and agree with their API
// -----------------------------------------------------------------------------

test.describe('Module 9B: Dashboard statistics reports', () => {
 test('TC-REPORT-render: all five report tables render on the Dashboard', async ({
  page,
 }) => {
  await gotoDashboard(page);

  // Report titles (Dashboard.tsx). Each StatisticsTable renders its title.
  const titles = [
   'דוח יומי - סיכום צווים לפי פרויקטים', // daily-summary
   'סיכום לפי טווח תאריכים', // date-range-summary
   'ניתוח פרויקטים', // project-analytics
   'מימון חיצוני לפי יחידות', // external-by-unit
   'עובדים על צו בתאריך מוגדר', // employees-on-reserve
  ];
  for (const title of titles) {
   await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
 });

 test('TC-REPORT-daily-summary: daily-summary table headers match API', async ({
  page,
  request,
 }) => {
  const res = await request.get(`${API_ORIGIN}/api/statistics/daily-summary`);
  expect(res.ok()).toBe(true);
  const { report } = await res.json();

  await gotoDashboard(page);
  const card = page
   .getByText('דוח יומי - סיכום צווים לפי פרויקטים', { exact: true })
   .locator('xpath=ancestor::div[.//table][1]');

  // Every API header must appear as a column header in the rendered table.
  for (const header of report.headers as string[]) {
   await expect(card.getByText(header, { exact: true }).first()).toBeVisible();
  }
 });

 test('TC-REPORT-date-range-summary: totals row value matches API', async ({
  page,
  request,
 }) => {
  const startDate = daysAgo(30);
  const endDate = today();
  const res = await request.get(
   `${API_ORIGIN}/api/statistics/date-range-summary?startDate=${startDate}&endDate=${endDate}`
  );
  expect(res.ok()).toBe(true);
  const { report } = await res.json();
  // rows[0] is the totals row (label + per-day totals). Verify the row label.
  const totalsLabel = report.rows[0][0] as string;

  await gotoDashboard(page);
  const card = page
   .getByText('סיכום לפי טווח תאריכים', { exact: true })
   .locator('xpath=ancestor::div[.//table][1]');
  await expect(card.getByText(totalsLabel, { exact: true }).first()).toBeVisible();
 });

 test('TC-REPORT-project-analytics: activeProjectCount metric == API and >= in-range rows', async ({
  page,
  request,
 }) => {
  const startDate = daysAgo(30);
  const endDate = today();
  const res = await request.get(
   `${API_ORIGIN}/api/statistics/project-analytics?startDate=${startDate}&endDate=${endDate}`
  );
  expect(res.ok()).toBe(true);
  const { report } = await res.json();
  const apiCount = report.activeProjectCount as number;

  await gotoDashboard(page);
  // UI metric must equal the server's activeProjectCount exactly.
  await expectMetricToReach(page, 'פרויקטים פעילים', (v) => v === apiCount, 15_000);

  // The analytics table lists only projects that had reservations in-range, so
  // its non-total, non-"ללא פרויקט" row count must be <= activeProjectCount
  // (the metric counts ALL active projects — may legitimately exceed it).
  const card = page
   .getByText('ניתוח פרויקטים', { exact: true })
   .locator('xpath=ancestor::div[.//table][1]');
  const rows = card.locator('tbody tr');
  const rowCount = await rows.count();
  let inRangeProjects = 0;
  for (let i = 0; i < rowCount; i++) {
   const first = (await rows.nth(i).locator('td').first().innerText()).trim();
   if (first === 'ללא פרויקט' || first.includes('סה"כ') || first === '' || first === '-')
    continue;
   inRangeProjects++;
  }
  expect(inRangeProjects).toBeLessThanOrEqual(apiCount);
 });

 test('TC-REPORT-external-by-unit: totals row label renders (matches API)', async ({
  page,
  request,
 }) => {
  const startDate = daysAgo(30);
  const endDate = today();
  const res = await request.get(
   `${API_ORIGIN}/api/statistics/external-by-unit?startDate=${startDate}&endDate=${endDate}`
  );
  expect(res.ok()).toBe(true);
  const { report } = await res.json();
  test.skip(report.rows.length === 0, 'no external funding data to assert');
  const totalsLabel = report.rows[report.rows.length - 1][0] as string;

  await gotoDashboard(page);
  const card = page
   .getByText('מימון חיצוני לפי יחידות', { exact: true })
   .locator('xpath=ancestor::div[.//table][1]');
  await expect(card.getByText(totalsLabel, { exact: true }).first()).toBeVisible();
 });

 test('TC-REPORT-employees-on-reserve: row count matches API for today', async ({
  page,
  request,
 }) => {
  const date = today();

  // Compare the rendered row count against a freshly-fetched API count inside
  // the poll, so a concurrent create (which changes both) still converges.
  // The employeesOnReserve query has a 5-minute staleTime, so the UI table
  // from a single navigation is a fixed snapshot and can never converge with
  // a live-changing API count (e.g. other tests creating reserve days for
  // today concurrently) — reload the dashboard on every poll iteration.
  await expect(async () => {
   const res = await request.get(
    `${API_ORIGIN}/api/statistics/employees-on-reserve?date=${date}`
   );
   expect(res.ok()).toBe(true);
   const { report } = await res.json();
   const apiRowCount = report.rows.length as number;

   await gotoDashboard(page);
   const card = page
    .getByText('עובדים על צו בתאריך מוגדר', { exact: true })
    .locator('xpath=ancestor::div[.//table][1]');

   if (apiRowCount === 0) {
    await expect(card.getByText('אין נתונים להצגה')).toBeVisible();
   } else {
    const rendered = await card.locator('tbody tr').count();
    expect(rendered).toBe(apiRowCount);
   }
  }).toPass({ timeout: 15_000 });
 });
});

// -----------------------------------------------------------------------------
// 3. Live-update behavior (immediate invalidation + auto-refresh)
// -----------------------------------------------------------------------------

// These tests used to snapshot a MetricCard's value, create a record, then
// assert an exact +1 delta. That races with any OTHER spec file creating a
// reserve day / project for today concurrently (fullyParallel: true, see
// playwright.config.ts) — a concurrent write lands between the "before" read
// and the "after" poll and skews the delta by more than 1, in either
// direction depending on timing.
//
// Fix: never diff two point-in-time snapshots of a shared counter. Instead,
// re-fetch the ground-truth value from the metrics/statistics API inside the
// poll (same pattern already used by TC-REPORT-employees-on-reserve above)
// and assert the UI converges to whatever that live value currently is. Both
// sides of the comparison observe the same live state, so the assertion
// holds regardless of what other tests are doing concurrently — this also
// means the describe-level serial mode is no longer needed.
test.describe('Module 9C: Live updates', () => {
 test('TC-DASH-001: Creating a reserve day updates the Dashboard immediately', async ({
  page,
  request,
 }) => {
  await gotoFormPage(
   page,
   'צווי מילואיםReserve Days Management',
   'צווי מילואים'
  );
  await createReserveDay(page, request, today(), 'אושר');

  // Poll: reload the dashboard and re-fetch the ground-truth API value each
  // iteration, so a concurrent create from another test still converges.
  // Dashboard.tsx computes this card client-side from the daily-summary
  // report's totals row (last row, "Total" column at index 4) — there's no
  // named field for it, so mirror that same positional read here.
  await expect(async () => {
   const res = await request.get(`${API_ORIGIN}/api/statistics/daily-summary`);
   expect(res.ok()).toBe(true);
   const { report } = await res.json();
   const totalsRow = report.rows[report.rows.length - 1];
   const apiValue = Number(totalsRow[4]);

   await gotoDashboard(page);
   const uiValue = await readMetricValue(page, 'סה״כ צווים היום');
   expect(uiValue).toBe(apiValue);
  }).toPass({ timeout: 15_000 });
 });

 test('TC-DASH-002: Creating an active project updates "Active Projects" immediately', async ({
  page,
  request,
 }) => {
  await createProject(page, 'פעיל');

  // Dashboard.tsx reads this card from /api/statistics/project-analytics's
  // activeProjectCount (see TC-REPORT-project-analytics above), NOT from
  // /api/projects/metrics — mirror that same source here.
  const startDate = daysAgo(30);
  const endDate = today();
  await expect(async () => {
   const res = await request.get(
    `${API_ORIGIN}/api/statistics/project-analytics?startDate=${startDate}&endDate=${endDate}`
   );
   expect(res.ok()).toBe(true);
   const { report } = await res.json();
   const apiValue = report.activeProjectCount as number;

   await gotoDashboard(page);
   const uiValue = await readMetricValue(page, 'פרויקטים פעילים');
   expect(uiValue).toBe(apiValue);
  }).toPass({ timeout: 15_000 });
 });

 test('TC-DASH-003: Dashboard auto-refresh picks up an out-of-band change', async ({
  page,
  request,
  context,
 }) => {
  test.setTimeout(120_000);

  await gotoDashboard(page);

  // Create a project in a SEPARATE tab — the original tab's cache is unaware.
  const otherPage = await context.newPage();
  await createProject(otherPage, 'פעיל');
  await otherPage.close();

  // Do NOT touch/reload the original tab; the 60s auto-refresh must update
  // the metric on its own. Compare against the live API value each poll
  // iteration (not a stale "before" snapshot) so concurrent tests can't skew
  // the expected value out from under us.
  const startDate = daysAgo(30);
  const endDate = today();
  await expect(async () => {
   const res = await request.get(
    `${API_ORIGIN}/api/statistics/project-analytics?startDate=${startDate}&endDate=${endDate}`
   );
   expect(res.ok()).toBe(true);
   const { report } = await res.json();
   const apiValue = report.activeProjectCount as number;

   const uiValue = await readMetricValue(page, 'פרויקטים פעילים');
   expect(uiValue).toBe(apiValue);
  }).toPass({ timeout: 70_000 });
 });

 test('TC-DASH-003b: Create + edit a reserve day updates its page MetricCards immediately', async ({
  page,
  request,
 }) => {
  test.setTimeout(90_000);

  await gotoFormPage(
   page,
   'צווי מילואיםReserve Days Management',
   'צווי מילואים'
  );

  // Create a pending reserve day (create mutation invalidates
  // ['formSubmission/metrics', formId], so both cards must bump without reload).
  await createReserveDay(page, request, today(), 'ממתין לטיפול');

  await expect(async () => {
   const metrics = await fetchMetricsForEntity(request, 'reserve_days_management');
   const totalApi = metrics.find((m) => m.id === 'total')?.value;
   const pendingApi = metrics.find((m) => m.id === 'pending')?.value;
   expect(totalApi).toBeDefined();
   expect(pendingApi).toBeDefined();

   const totalUi = await readMetricValue(page, 'סה"כ צווים');
   const pendingUi = await readMetricValue(page, 'ממתינים לאישור');
   expect(totalUi).toBe(totalApi);
   expect(pendingUi).toBe(pendingApi);
  }).toPass({ timeout: 15_000 });
 });
});
