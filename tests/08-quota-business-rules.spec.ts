// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect, APIRequestContext } from '@playwright/test';

const API_ORIGIN = 'http://localhost:3001';
const API = `${API_ORIGIN}/api`;

const TODAY = new Date().toISOString().split('T')[0];
const RANGE_START = '2026-09-01';
const RANGE_END = '2026-09-05';
const RANGE_MID = '2026-09-03';
const BEFORE_RANGE = '2026-08-31';
const AFTER_RANGE = '2026-09-06';
const SINGLE_DATE = '2026-09-10';
const SINGLE_DATE_NEXT = '2026-09-11';

interface PersonnelRecord {
 id: string;
 firstName: string;
 lastName: string;
 personalNumber: string;
}

async function createPersonnel(
 request: APIRequestContext,
 overrides: Record<string, any> = {},
): Promise<PersonnelRecord> {
 const firstName = overrides.firstName ?? `כלל${Date.now()}`;
 const lastName = overrides.lastName ?? `עסקי${Date.now()}`;
 const personalNumber = overrides.personalNumber ?? `BR${Date.now()}`;
 const res = await request.post(`${API}/personnel`, {
  data: { firstName, lastName, personalNumber, isActive: true, ...overrides },
 });
 expect(res.ok(), `personnel create failed: ${res.status()}`).toBe(true);
 const body = await res.json();
 return { id: body._id as string, firstName, lastName, personalNumber };
}

async function createReserveDay(
 request: APIRequestContext,
 personnel: PersonnelRecord,
 overrides: Record<string, any> = {},
) {
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
 const body = res.ok() ? await res.json() : null;
 return { id: body?._id as string | undefined, status: res.status() };
}

async function deletePersonnel(request: APIRequestContext, id: string) {
 await request.delete(`${API}/personnel/${id}`);
}

async function deleteReserveDay(request: APIRequestContext, id: string) {
 await request.delete(`${API}/reserve-days/${id}`);
}

test.describe('Module 7: Quota Business Rules', () => {
 test('TC-BR-001: Denied employee is excluded from employee list', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'נדחה',
    lastName: `סטטוס${Date.now()}`,
    personalNumber: `DENIED${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, { requestStatus: 'denied' });
   rid = result.id ?? null;

   const res = await request.get(`${API}/quotas/employees/${TODAY}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const ids = body.data.employees.map((e: any) => e._id?.toString());
   expect(ids).not.toContain(personnel.id);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-002: Pending employee is included in list', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'ממתין',
    lastName: `בקשה${Date.now()}`,
    personalNumber: `PEND${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, { requestStatus: 'pending' });
   rid = result.id ?? null;

   const res = await request.get(`${API}/quotas/employees/${TODAY}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const ids = body.data.employees.map((e: any) => e._id?.toString());
   expect(ids).toContain(personnel.id);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-003: Approved employee is included without warning', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'מאושר',
    lastName: `עובד${Date.now()}`,
    personalNumber: `APPR${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, { requestStatus: 'approved' });
   rid = result.id ?? null;

   const res = await request.get(`${API}/quotas/employees/${TODAY}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const emp = body.data.employees.find((e: any) => e._id?.toString() === personnel!.id);
   expect(emp).toBeTruthy();
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-004: Employee visible on startDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'תאריך',
    lastName: `התחלה${Date.now()}`,
    personalNumber: `SDATE${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id ?? null;

   const res = await request.get(`${API}/quotas/employees/${RANGE_START}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const emp = body.data.employees.find((e: any) => e._id?.toString() === personnel!.id);
   expect(emp).toBeTruthy();
   expect(emp.isStartingToday).toBe(true);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-005: Employee visible on endDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'תאריך',
    lastName: `סיום${Date.now()}`,
    personalNumber: `EDATE${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id ?? null;

   const res = await request.get(`${API}/quotas/employees/${RANGE_END}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const emp = body.data.employees.find((e: any) => e._id?.toString() === personnel!.id);
   expect(emp).toBeTruthy();
   expect(emp.isEndingToday).toBe(true);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-006: Employee visible on mid-range date', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'תאריך',
    lastName: `אמצע${Date.now()}`,
    personalNumber: `MDATE${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id ?? null;

   const res = await request.get(`${API}/quotas/employees/${RANGE_MID}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const emp = body.data.employees.find((e: any) => e._id?.toString() === personnel!.id);
   expect(emp).toBeTruthy();
   expect(emp.isStartingToday).toBe(false);
   expect(emp.isEndingToday).toBe(false);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-007: Employee absent one day before startDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'לפני',
    lastName: `התחלה${Date.now()}`,
    personalNumber: `BFORE${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id ?? null;

   const res = await request.get(`${API}/quotas/employees/${BEFORE_RANGE}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const ids = body.data.employees.map((e: any) => e._id?.toString());
   expect(ids).not.toContain(personnel.id);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-008: Employee absent one day after endDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'אחרי',
    lastName: `סיום${Date.now()}`,
    personalNumber: `AFTER${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id ?? null;

   const res = await request.get(`${API}/quotas/employees/${AFTER_RANGE}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const ids = body.data.employees.map((e: any) => e._id?.toString());
   expect(ids).not.toContain(personnel.id);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-009: Single-day reservation appears only on startDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'יום',
    lastName: `יחיד${Date.now()}`,
    personalNumber: `SINGLE${Date.now()}`,
   });
   const result = await createReserveDay(request, personnel, {
    startDate: SINGLE_DATE,
    endDate: SINGLE_DATE,
    requestStatus: 'approved',
   });
   rid = result.id ?? null;

   const onDate = await request.get(`${API}/quotas/employees/${SINGLE_DATE}?filter=all&page=1&limit=100`);
   const onIds = (await onDate.json()).data.employees.map((e: any) => e._id?.toString());
   expect(onIds).toContain(personnel.id);

   const nextDay = await request.get(`${API}/quotas/employees/${SINGLE_DATE_NEXT}?filter=all&page=1&limit=100`);
   const nextIds = (await nextDay.json()).data.employees.map((e: any) => e._id?.toString());
   expect(nextIds).not.toContain(personnel.id);
  } finally {
   if (rid) await deleteReserveDay(request, rid);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-010: Overlapping reserveDay for same employee returns 409', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid1: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'חפיפה',
    lastName: `מניעה${Date.now()}`,
    personalNumber: `OVL${Date.now()}`,
   });

   const r1 = await createReserveDay(request, personnel, {
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    requestStatus: 'approved',
   });
   rid1 = r1.id ?? null;

   const res = await request.post(`${API}/reserve-days`, {
    data: {
     employeeName: personnel.id,
     startDate: '2026-10-05',
     endDate: '2026-10-15',
     fundingSource: 'internal',
     orderType: '8open',
     requestStatus: 'approved',
    },
   });
   expect(res.status()).toBe(409);
  } finally {
   if (rid1) await deleteReserveDay(request, rid1);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-011: Non-overlapping reserveDay for same employee succeeds', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid1: string | null = null;
  let rid2: string | null = null;
  try {
   personnel = await createPersonnel(request, {
    firstName: 'סמוך',
    lastName: `תאריכים${Date.now()}`,
    personalNumber: `ADJ${Date.now()}`,
   });

   const r1 = await createReserveDay(request, personnel, {
    startDate: '2026-11-01',
    endDate: '2026-11-05',
    requestStatus: 'approved',
   });
   rid1 = r1.id ?? null;

   const res = await request.post(`${API}/reserve-days`, {
    data: {
     employeeName: personnel.id,
     startDate: '2026-11-06',
     endDate: '2026-11-10',
     fundingSource: 'internal',
     orderType: '8open',
     requestStatus: 'approved',
    },
   });
   expect([200, 201]).toContain(res.status());
   rid2 = (await res.json())._id;
  } finally {
   if (rid2) await deleteReserveDay(request, rid2);
   if (rid1) await deleteReserveDay(request, rid1);
   if (personnel) await deletePersonnel(request, personnel.id);
  }
 });

 test('TC-BR-012: Overlapping dates for different employees succeeds', async ({ request }) => {
  let personnel1: PersonnelRecord | null = null;
  let personnel2: PersonnelRecord | null = null;
  let rid1: string | null = null;
  let rid2: string | null = null;
  try {
   personnel1 = await createPersonnel(request, {
    firstName: 'עובד',
    lastName: `א${Date.now()}`,
    personalNumber: `OVLA${Date.now()}`,
   });
   personnel2 = await createPersonnel(request, {
    firstName: 'עובד',
    lastName: `ב${Date.now()}`,
    personalNumber: `OVLB${Date.now()}`,
   });

   const r1 = await createReserveDay(request, personnel1, {
    startDate: '2026-12-01',
    endDate: '2026-12-10',
    requestStatus: 'approved',
   });
   rid1 = r1.id ?? null;

   const res = await request.post(`${API}/reserve-days`, {
    data: {
     employeeName: personnel2.id,
     startDate: '2026-12-01',
     endDate: '2026-12-10',
     fundingSource: 'internal',
     orderType: '8open',
     requestStatus: 'approved',
    },
   });
   expect([200, 201]).toContain(res.status());
   rid2 = (await res.json())._id;
  } finally {
   if (rid2) await deleteReserveDay(request, rid2);
   if (rid1) await deleteReserveDay(request, rid1);
   if (personnel2) await deletePersonnel(request, personnel2.id);
   if (personnel1) await deletePersonnel(request, personnel1.id);
  }
 });
});
