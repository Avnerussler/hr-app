// spec: tests/hr-app-comprehensive-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001/api';

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

async function getFormId(request: any, formName: string): Promise<string> {
 const res = await request.get(`${API}/formSubmission?formName=${formName}&page=1&limit=1`);
 const body = await res.json();
 return body.forms[0].formId;
}

async function createPersonnel(request: any, formId: string, overrides: Record<string, any> = {}): Promise<PersonnelRecord> {
 const firstName = overrides.firstName ?? `כלל${Date.now()}`;
 const lastName = overrides.lastName ?? `עסקי${Date.now()}`;
 const personalNumber = overrides.personalNumber ?? `BR${Date.now()}`;
 const res = await request.post(`${API}/formSubmission/create`, {
  data: {
   formId,
   formName: 'personnel',
   formData: { firstName, lastName, personalNumber, status: 'active', employmentType: 'reserves', ...overrides },
  },
 });
 return { id: (await res.json()).form._id as string, firstName, lastName, personalNumber };
}

async function createReserveDay(request: any, formId: string, personnel: PersonnelRecord, overrides: Record<string, any> = {}) {
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
 return { id: (await res.json()).form._id as string, status: res.status() };
}

async function deleteSubmission(request: any, id: string) {
 await request.post(`${API}/formSubmission/delete`, { data: { id } });
}

test.describe('Module 7: Quota Business Rules', () => {
 let personnelFormId: string;
 let reserveDaysFormId: string;

 test.beforeAll(async ({ request }) => {
  personnelFormId = await getFormId(request, 'personnel');
  reserveDaysFormId = await getFormId(request, 'reserve_days_management');
 });

 test('TC-BR-001: Denied employee is excluded from employee list', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'נדחה',
    lastName: `סטטוס${Date.now()}`,
    personalNumber: `DENIED${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'denied' });
   rid = result.id;

   const res = await request.get(`${API}/quotas/employees/${TODAY}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const ids = body.employees.map((e: any) => e._id?.toString());
   expect(ids).not.toContain(personnel.id);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-002: Pending employee is included in list', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'ממתין',
    lastName: `בקשה${Date.now()}`,
    personalNumber: `PEND${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'pending' });
   rid = result.id;

   const res = await request.get(`${API}/quotas/employees/${TODAY}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const ids = body.employees.map((e: any) => e._id?.toString());
   expect(ids).toContain(personnel.id);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-003: Approved employee is included without warning', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'מאושר',
    lastName: `עובד${Date.now()}`,
    personalNumber: `APPR${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, { requestStatus: 'approved' });
   rid = result.id;

   const res = await request.get(`${API}/quotas/employees/${TODAY}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const emp = body.employees.find((e: any) => e._id?.toString() === personnel!.id);
   expect(emp).toBeTruthy();
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-004: Employee visible on startDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'תאריך',
    lastName: `התחלה${Date.now()}`,
    personalNumber: `SDATE${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id;

   const res = await request.get(`${API}/quotas/employees/${RANGE_START}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const emp = body.employees.find((e: any) => e._id?.toString() === personnel!.id);
   expect(emp).toBeTruthy();
   expect(emp.isStartingToday).toBe(true);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-005: Employee visible on endDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'תאריך',
    lastName: `סיום${Date.now()}`,
    personalNumber: `EDATE${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id;

   const res = await request.get(`${API}/quotas/employees/${RANGE_END}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const emp = body.employees.find((e: any) => e._id?.toString() === personnel!.id);
   expect(emp).toBeTruthy();
   expect(emp.isEndingToday).toBe(true);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-006: Employee visible on mid-range date', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'תאריך',
    lastName: `אמצע${Date.now()}`,
    personalNumber: `MDATE${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id;

   const res = await request.get(`${API}/quotas/employees/${RANGE_MID}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const emp = body.employees.find((e: any) => e._id?.toString() === personnel!.id);
   expect(emp).toBeTruthy();
   expect(emp.isStartingToday).toBe(false);
   expect(emp.isEndingToday).toBe(false);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-007: Employee absent one day before startDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'לפני',
    lastName: `התחלה${Date.now()}`,
    personalNumber: `BFORE${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id;

   const res = await request.get(`${API}/quotas/employees/${BEFORE_RANGE}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const ids = body.employees.map((e: any) => e._id?.toString());
   expect(ids).not.toContain(personnel.id);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-008: Employee absent one day after endDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'אחרי',
    lastName: `סיום${Date.now()}`,
    personalNumber: `AFTER${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: RANGE_START,
    endDate: RANGE_END,
    requestStatus: 'approved',
   });
   rid = result.id;

   const res = await request.get(`${API}/quotas/employees/${AFTER_RANGE}?filter=all&page=1&limit=100`);
   const body = await res.json();
   const ids = body.employees.map((e: any) => e._id?.toString());
   expect(ids).not.toContain(personnel.id);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-009: Single-day reservation appears only on startDate', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'יום',
    lastName: `יחיד${Date.now()}`,
    personalNumber: `SINGLE${Date.now()}`,
   });
   const result = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: SINGLE_DATE,
    endDate: SINGLE_DATE,
    requestStatus: 'approved',
   });
   rid = result.id;

   const onDate = await request.get(`${API}/quotas/employees/${SINGLE_DATE}?filter=all&page=1&limit=100`);
   const onIds = (await onDate.json()).employees.map((e: any) => e._id?.toString());
   expect(onIds).toContain(personnel.id);

   const nextDay = await request.get(`${API}/quotas/employees/${SINGLE_DATE_NEXT}?filter=all&page=1&limit=100`);
   const nextIds = (await nextDay.json()).employees.map((e: any) => e._id?.toString());
   expect(nextIds).not.toContain(personnel.id);
  } finally {
   if (rid) await deleteSubmission(request, rid);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-010: Overlapping reserveDay for same employee returns 409', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid1: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'חפיפה',
    lastName: `מניעה${Date.now()}`,
    personalNumber: `OVL${Date.now()}`,
   });

   const r1 = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    requestStatus: 'approved',
   });
   rid1 = r1.id;

   const res = await request.post(`${API}/formSubmission/create`, {
    data: {
     formId: reserveDaysFormId,
     formName: 'reserve_days_management',
     formData: {
      employeeName: {
       _id: personnel.id,
       display: `${personnel.firstName} ${personnel.lastName} ${personnel.personalNumber}`,
       metadata: { firstName: personnel.firstName, lastName: personnel.lastName, personalNumber: personnel.personalNumber },
      },
      startDate: '2026-10-05',
      endDate: '2026-10-15',
      fundingSource: 'internal',
      orderType: '8open',
      requestStatus: 'approved',
      isActive: true,
      vehicleEntry: false,
     },
    },
   });
   expect(res.status()).toBe(409);
  } finally {
   if (rid1) await deleteSubmission(request, rid1);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-011: Non-overlapping reserveDay for same employee succeeds', async ({ request }) => {
  let personnel: PersonnelRecord | null = null;
  let rid1: string | null = null;
  let rid2: string | null = null;
  try {
   personnel = await createPersonnel(request, personnelFormId, {
    firstName: 'סמוך',
    lastName: `תאריכים${Date.now()}`,
    personalNumber: `ADJ${Date.now()}`,
   });

   const r1 = await createReserveDay(request, reserveDaysFormId, personnel, {
    startDate: '2026-11-01',
    endDate: '2026-11-05',
    requestStatus: 'approved',
   });
   rid1 = r1.id;

   const res = await request.post(`${API}/formSubmission/create`, {
    data: {
     formId: reserveDaysFormId,
     formName: 'reserve_days_management',
     formData: {
      employeeName: {
       _id: personnel.id,
       display: `${personnel.firstName} ${personnel.lastName} ${personnel.personalNumber}`,
       metadata: { firstName: personnel.firstName, lastName: personnel.lastName, personalNumber: personnel.personalNumber },
      },
      startDate: '2026-11-06',
      endDate: '2026-11-10',
      fundingSource: 'internal',
      orderType: '8open',
      requestStatus: 'approved',
      isActive: true,
      vehicleEntry: false,
     },
    },
   });
   expect([200, 201]).toContain(res.status());
   rid2 = (await res.json()).form._id;
  } finally {
   if (rid2) await deleteSubmission(request, rid2);
   if (rid1) await deleteSubmission(request, rid1);
   if (personnel) await deleteSubmission(request, personnel.id);
  }
 });

 test('TC-BR-012: Overlapping dates for different employees succeeds', async ({ request }) => {
  let personnel1: PersonnelRecord | null = null;
  let personnel2: PersonnelRecord | null = null;
  let rid1: string | null = null;
  let rid2: string | null = null;
  try {
   personnel1 = await createPersonnel(request, personnelFormId, {
    firstName: 'עובד',
    lastName: `א${Date.now()}`,
    personalNumber: `OVLA${Date.now()}`,
   });
   personnel2 = await createPersonnel(request, personnelFormId, {
    firstName: 'עובד',
    lastName: `ב${Date.now()}`,
    personalNumber: `OVLB${Date.now()}`,
   });

   const r1 = await createReserveDay(request, reserveDaysFormId, personnel1, {
    startDate: '2026-12-01',
    endDate: '2026-12-10',
    requestStatus: 'approved',
   });
   rid1 = r1.id;

   const res = await request.post(`${API}/formSubmission/create`, {
    data: {
     formId: reserveDaysFormId,
     formName: 'reserve_days_management',
     formData: {
      employeeName: {
       _id: personnel2.id,
       display: `${personnel2.firstName} ${personnel2.lastName} ${personnel2.personalNumber}`,
       metadata: { firstName: personnel2.firstName, lastName: personnel2.lastName, personalNumber: personnel2.personalNumber },
      },
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      fundingSource: 'internal',
      orderType: '8open',
      requestStatus: 'approved',
      isActive: true,
      vehicleEntry: false,
     },
    },
   });
   expect([200, 201]).toContain(res.status());
   rid2 = (await res.json()).form._id;
  } finally {
   if (rid2) await deleteSubmission(request, rid2);
   if (rid1) await deleteSubmission(request, rid1);
   if (personnel2) await deleteSubmission(request, personnel2.id);
   if (personnel1) await deleteSubmission(request, personnel1.id);
  }
 });
});
