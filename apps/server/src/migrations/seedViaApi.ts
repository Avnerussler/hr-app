/**
 * Seeds personnel, projects, and reserve_days_management through the HTTP API
 * so all validation (including overlap checks) runs on every record.
 *
 * Phase 1: Create 100 personnel
 * Phase 2: Create 10 projects, assigning each personnel to 1–3 projects
 * Phase 3: Create ~1000 reservations spread across the current month
 *
 * Run while the server is running:
 *   npx ts-node src/migrations/seedViaApi.ts
 *
 * Rate limit: server allows 100 req/60s. We pace to stay under that.
 */
import { faker } from '@faker-js/faker'
import { addDays, format, eachDayOfInterval, startOfMonth, endOfMonth, differenceInDays } from 'date-fns'
import connectDB from '../config/db'
import { FormFields } from '../models'

const BASE = process.env.API_URL ?? 'http://localhost:3001/api'

const PERSONNEL_COUNT = 100
const PROJECT_COUNT = 10
// Target ~1000 reservations. With overlap guard some will be rejected, so we attempt more.
const RESERVATION_TARGET = 1000
const RESERVATION_ATTEMPTS_PER_PERSON = Math.ceil((RESERVATION_TARGET * 2.5) / PERSONNEL_COUNT)

// Rate limiting: max 100 req/60s → ~800ms between requests to be safe
const RATE_DELAY_MS = 800

const MONTH_START = startOfMonth(new Date())
const MONTH_END = endOfMonth(new Date())
const MONTH_DAYS = differenceInDays(MONTH_END, MONTH_START) + 1

// ─── Hebrew data ────────────────────────────────────────────────────────────

const hebrewFirstNames = [
    'דוד', 'משה', 'יוסף', 'אברהם', 'יעקב', 'שמואל', 'יצחק', 'דניאל', 'אלי', 'נתן',
    'רחל', 'שרה', 'מרים', 'לאה', 'רבקה', 'תמר', 'אסתר', 'רות', 'נועה', 'מיכל',
    'עמית', 'גיל', 'רון', 'יובל', 'אורי', 'ליאת', 'שיר', 'דנה', 'עדי', 'ניר',
    'יונתן', 'איתמר', 'שי', 'אמיר', 'ריקי', 'הדר', 'טל', 'גלית', 'שלמה', 'אביב',
]
const hebrewLastNames = [
    'כהן', 'לוי', 'מילר', 'שמיט', 'פישר', 'וייס', 'שולץ', 'בקר', 'שולמן',
    'רוזן', 'כץ', 'גולד', 'סילבר', 'ברג', 'שטיין', 'קליין', 'רוט', 'גרין', 'בלאו', 'הרצוג',
    'אברמוביץ', 'ברקוביץ', 'גרינברג', 'פרידמן', 'שפירא', 'אדלר', 'גולדשטיין', 'הורוביץ',
]
const projectNames = [
    'פרויקט ענן', 'מערכת פיקוד', 'פרויקט מגן', 'מודיעין שדה', 'ציפור',
    'פרויקט נשר', 'כיפת ברזל', 'רביב', 'גלים', 'ברק',
]
const orderTypes = ['8open', '8daily', 'routineOpen', 'routineDaily']
const fundingUnits = ['יחידה 8200', 'יחידה 81', 'חיל המודיעין', 'מערכות פיקוד', 'חיל האוויר']
const studioRoles = ['backendDeveloper', 'frontendDeveloper', 'fullstackDeveloper', 'devops', 'qa', 'projectManager', 'designer']
const reserveCategories = ['reserves', 'consultant', 'permanentService']

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const randomDateInMonth = (): Date => {
    const offset = faker.number.int({ min: 0, max: MONTH_DAYS - 2 })
    return addDays(MONTH_START, offset)
}

async function apiPost(path: string, body: any, retries = 3): Promise<{ status: number; data: any }> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const res = await fetch(`${BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (res.status === 429 && attempt < retries) {
            const backoff = 15000 + attempt * 5000 // 15s, 20s, 25s
            process.stdout.write(`\n  429 rate limit — waiting ${backoff / 1000}s before retry...\r`)
            await sleep(backoff)
            continue
        }
        return { status: res.status, data }
    }
    return { status: 429, data: { message: 'Too many requests (all retries exhausted)' } }
}

async function getFormId(formName: string): Promise<string> {
    const form = await FormFields.findOne({ formName }).select('_id')
    if (!form?._id) throw new Error(`Form definition not found for: ${formName}`)
    return form._id.toString()
}

// ─── Phase 1: Personnel ───────────────────────────────────────────────────────

async function seedPersonnel(formId: string): Promise<string[]> {
    console.log(`\n[Phase 1] Seeding ${PERSONNEL_COUNT} personnel...`)
    const ids: string[] = []

    for (let i = 0; i < PERSONNEL_COUNT; i++) {
        const formData = {
            firstName: faker.helpers.arrayElement(hebrewFirstNames),
            lastName: faker.helpers.arrayElement(hebrewLastNames),
            personalNumber: faker.number.int({ min: 1000000, max: 9999999 }),
            phone: `05${faker.number.int({ min: 10000000, max: 99999999 })}`,
            email: faker.internet.email(),
            workPlace: faker.company.name(),
            studioRole: faker.helpers.arrayElement(studioRoles),
            reserveCategory: faker.helpers.arrayElement(reserveCategories),
            reserveUnit: faker.helpers.arrayElement(['גדוד 1', 'גדוד 2', 'גדוד 3', 'פלוגה א', 'פלוגה ב']),
            isActive: true,
        }

        const { status, data } = await apiPost('/formSubmission/create', {
            formId,
            formName: 'personnel',
            formData,
        })

        if (status === 201 && data?.form?._id) {
            ids.push(data.form._id)
        } else {
            console.warn(`\n  skipped personnel #${i + 1} (${status}: ${data?.message ?? 'unknown'})`)
        }

        process.stdout.write(`\r  personnel: ${ids.length}/${PERSONNEL_COUNT}`)
        await sleep(RATE_DELAY_MS)
    }

    console.log(`\n  Done: ${ids.length} personnel created`)
    return ids
}

// ─── Phase 2: Projects ────────────────────────────────────────────────────────

async function seedProjects(formId: string, personnelIds: string[]): Promise<string[]> {
    console.log(`\n[Phase 2] Seeding ${PROJECT_COUNT} projects...`)
    const ids: string[] = []

    // Divide personnel evenly across projects, each person appears in 1–3 projects
    const shuffled = faker.helpers.shuffle([...personnelIds])

    for (let p = 0; p < PROJECT_COUNT; p++) {
        // Each project gets ~20–40% of the personnel
        const projectSize = faker.number.int({ min: Math.floor(PERSONNEL_COUNT * 0.15), max: Math.floor(PERSONNEL_COUNT * 0.4) })
        const projectPersonnel = shuffled.slice(
            (p * Math.floor(PERSONNEL_COUNT / PROJECT_COUNT)) % PERSONNEL_COUNT,
            (p * Math.floor(PERSONNEL_COUNT / PROJECT_COUNT)) % PERSONNEL_COUNT + projectSize,
        ).slice(0, projectSize)

        // Ensure no project is empty
        if (projectPersonnel.length === 0) projectPersonnel.push(shuffled[p % shuffled.length])

        const managerId = faker.helpers.arrayElement(projectPersonnel)

        const formData = {
            projectName: projectNames[p] ?? `פרויקט ${p + 1}`,
            projectManager: managerId,
            projectPersonnel,
            projectStatus: faker.helpers.arrayElement(['active', 'active', 'active', 'pending']),
        }

        const { status, data } = await apiPost('/formSubmission/create', {
            formId,
            formName: 'project_management',
            formData,
        })

        if (status === 201 && data?.form?._id) {
            ids.push(data.form._id)
            console.log(`  project "${formData.projectName}" → ${projectPersonnel.length} members`)
        } else {
            console.warn(`\n  skipped project #${p + 1} (${status}: ${data?.message ?? 'unknown'})`)
        }

        await sleep(RATE_DELAY_MS)
    }

    console.log(`  Done: ${ids.length} projects created`)
    return ids
}

// ─── Phase 3: Reservations ────────────────────────────────────────────────────

async function seedReserveDays(formId: string, personnelIds: string[]): Promise<void> {
    const totalAttempts = personnelIds.length * RESERVATION_ATTEMPTS_PER_PERSON
    console.log(`\n[Phase 3] Seeding ~1000 reservations (${totalAttempts} attempts across ${personnelIds.length} personnel)...`)
    console.log(`  Month: ${format(MONTH_START, 'yyyy-MM-dd')} → ${format(MONTH_END, 'yyyy-MM-dd')} (${MONTH_DAYS} days)`)

    let created = 0
    let skipped = 0
    let errors = 0

    // Track used date ranges per employee to reduce overlap attempts
    const usedRanges = new Map<string, Array<{ start: Date; end: Date }>>()

    const hasOverlap = (employeeId: string, start: Date, end: Date): boolean => {
        const ranges = usedRanges.get(employeeId) ?? []
        return ranges.some(r => start <= r.end && end >= r.start)
    }

    const markUsed = (employeeId: string, start: Date, end: Date) => {
        if (!usedRanges.has(employeeId)) usedRanges.set(employeeId, [])
        usedRanges.get(employeeId)!.push({ start, end })
    }

    for (const employeeId of personnelIds) {
        for (let r = 0; r < RESERVATION_ATTEMPTS_PER_PERSON; r++) {
            // Pick a random non-overlapping start date
            let startDate = randomDateInMonth()
            const maxDuration = differenceInDays(MONTH_END, startDate)
            if (maxDuration < 1) continue

            const duration = faker.number.int({ min: 1, max: Math.min(4, maxDuration) })
            const endDate = addDays(startDate, duration)

            // Skip client-side if we already know it overlaps (reduces wasted API calls)
            if (hasOverlap(employeeId, startDate, endDate)) {
                skipped++
                continue
            }

            const fundingSource = faker.helpers.arrayElement(['internal', 'internal', 'internal', 'external'])

            const attendance: Record<string, boolean> = {}
            eachDayOfInterval({ start: startDate, end: endDate }).forEach(d => {
                if (d <= new Date()) {
                    attendance[format(d, 'yyyy-MM-dd')] = faker.datatype.boolean({ probability: 0.85 })
                }
            })

            const formData = {
                employeeName: employeeId,
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                fundingSource,
                fundingName: fundingSource === 'external' ? faker.helpers.arrayElement(fundingUnits) : undefined,
                orderType: faker.helpers.arrayElement(orderTypes),
                requestStatus: faker.helpers.arrayElement(['approved', 'approved', 'approved', 'pending']),
                baseAccessApproval: faker.helpers.arrayElement(['approved', 'approved', 'pending']),
                isActive: true,
                attendance,
            }

            const { status, data } = await apiPost('/formSubmission/create', {
                formId,
                formName: 'reserve_days_management',
                formData,
            })

            if (status === 201) {
                created++
                markUsed(employeeId, startDate, endDate)
            } else if (status === 409) {
                skipped++
                // Mark the range as used so we stop trying it
                markUsed(employeeId, startDate, endDate)
            } else {
                errors++
                console.warn(`\n  unexpected error (${status}): ${data?.message ?? 'unknown'}`)
            }

            process.stdout.write(`\r  reservations: ${created} created, ${skipped} skipped, ${errors} errors`)
            await sleep(RATE_DELAY_MS)
        }
    }

    console.log(`\n  Done: ${created} reservations created, ${skipped} skipped (overlap/client-dedup), ${errors} errors`)

    if (created < 800) {
        console.warn(`  Warning: only ${created} reservations created (target ~1000). Consider re-running or increasing RESERVATION_ATTEMPTS_PER_PERSON.`)
    }
}

// ─── Helpers to fetch existing data ──────────────────────────────────────────

async function fetchExistingPersonnelIds(): Promise<string[]> {
    const res = await fetch(`${BASE}/formSubmission?formName=personnel&page=1&limit=9999`)
    if (!res.ok) throw new Error(`Failed to fetch existing personnel: ${res.status}`)
    const data: any = await res.json()
    return (data.forms ?? []).map((f: any) => f._id)
}

async function fetchExistingCount(formName: string): Promise<number> {
    const res = await fetch(`${BASE}/formSubmission?formName=${formName}&page=1&limit=1`)
    if (!res.ok) return 0
    const data: any = await res.json()
    return data.pagination?.total ?? 0
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function run() {
    console.log(`API seed starting — target: ${BASE}`)
    console.log(`Rate limit: ${RATE_DELAY_MS}ms between requests`)

    try {
        await connectDB()

        const [personnelFormId, projectFormId, reserveDaysFormId] = await Promise.all([
            getFormId('personnel'),
            getFormId('project_management'),
            getFormId('reserve_days_management'),
        ])

        // Check what already exists
        const [existingPersonnelCount, existingProjectCount, existingReservationCount] = await Promise.all([
            fetchExistingCount('personnel'),
            fetchExistingCount('project_management'),
            fetchExistingCount('reserve_days_management'),
        ])
        console.log(`Existing data: ${existingPersonnelCount} personnel, ${existingProjectCount} projects, ${existingReservationCount} reservations`)

        let personnelIds: string[]

        if (existingPersonnelCount >= PERSONNEL_COUNT) {
            console.log('\n[Phase 1] Skipping — personnel already seeded. Fetching existing IDs...')
            personnelIds = await fetchExistingPersonnelIds()
            console.log(`  Loaded ${personnelIds.length} existing personnel IDs`)
        } else {
            personnelIds = await seedPersonnel(personnelFormId)
            if (personnelIds.length === 0) {
                console.error('No personnel created — aborting')
                process.exit(1)
            }
        }

        if (existingProjectCount >= PROJECT_COUNT) {
            console.log('\n[Phase 2] Skipping — projects already seeded.')
        } else {
            await seedProjects(projectFormId, personnelIds)
        }

        if (existingReservationCount >= RESERVATION_TARGET) {
            console.log(`\n[Phase 3] Skipping — ${existingReservationCount} reservations already exist (target: ${RESERVATION_TARGET}).`)
        } else {
            console.log(`\n[Phase 3] ${existingReservationCount} reservations exist, targeting ${RESERVATION_TARGET}...`)
            await seedReserveDays(reserveDaysFormId, personnelIds)
        }

        console.log('\nSeed complete.')
        process.exit(0)
    } catch (err: any) {
        console.error('Seed failed:', err.message)
        process.exit(1)
    }
}

run()
