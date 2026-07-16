import {
    computeOrderType,
    findOverlappingReserveRecord,
    createOrUpdateReserveDayRecord,
} from './importReserveDaysFromExcel'
import { FormSubmissions } from '../models'

jest.mock('../models', () => ({
    FormSubmissions: {
        find: jest.fn(),
        updateOne: jest.fn(),
    },
}))

jest.mock('../config/logger', () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    return { __esModule: true, default: logger }
})

const mockFind = FormSubmissions.find as jest.Mock
const mockUpdateOne = FormSubmissions.updateOne as jest.Mock

const personnelData = {
    firstName: 'Yossi',
    lastName: 'Cohen',
    personalNumber: '1234567',
}

const makeReserve = (attendance: Record<string, boolean>, id = 'rec1') => ({
    _id: { toString: () => id },
    formData: {
        employeeName: 'p1',
        startDate: Object.keys(attendance).sort()[0],
        endDate: Object.keys(attendance).sort().at(-1),
        attendance,
        orderType: '8daily',
        fundingSource: 'internal',
    },
})

beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateOne.mockResolvedValue({})
})

// ─── computeOrderType ────────────────────────────────────────────────────────

describe('computeOrderType', () => {
    it('returns 8daily for fewer than 4 dates', () => {
        expect(computeOrderType(['2025-03-01', '2025-03-02', '2025-03-03'])).toBe('8daily')
    })

    it('returns 8open for 4+ consecutive dates', () => {
        expect(
            computeOrderType(['2025-03-01', '2025-03-02', '2025-03-03', '2025-03-04'])
        ).toBe('8open')
    })

    it('returns 8daily for 4+ dates with a gap', () => {
        expect(
            computeOrderType(['2025-03-01', '2025-03-02', '2025-03-04', '2025-03-05'])
        ).toBe('8daily')
    })

    it('returns 8open for a long consecutive range spanning months', () => {
        expect(
            computeOrderType([
                '2025-04-29',
                '2025-04-30',
                '2025-05-01',
                '2025-05-02',
                '2025-05-03',
            ])
        ).toBe('8open')
    })
})

// ─── findOverlappingReserveRecord ────────────────────────────────────────────

describe('findOverlappingReserveRecord', () => {
    it('returns null when no records exist', async () => {
        mockFind.mockReturnValue({ lean: () => Promise.resolve([]) })

        const result = await findOverlappingReserveRecord('p1', ['2025-05-04'])
        expect(result).toBeNull()
    })

    it('returns null when existing record has no overlapping date', async () => {
        mockFind.mockReturnValue({
            lean: () =>
                Promise.resolve([
                    makeReserve({ '2025-03-01': true, '2025-03-02': true }),
                ]),
        })

        const result = await findOverlappingReserveRecord('p1', ['2025-05-04'])
        expect(result).toBeNull()
    })

    it('returns the matching record when one date overlaps', async () => {
        const reserve = makeReserve({
            '2025-03-01': true,
            '2025-05-04': true,
        })
        mockFind.mockReturnValue({ lean: () => Promise.resolve([reserve]) })

        const result = await findOverlappingReserveRecord('p1', ['2025-05-04', '2025-05-05'])
        expect(result).not.toBeNull()
        expect(result!.id).toBe('rec1')
    })

    it('returns the first matching record when multiple records exist', async () => {
        const r1 = makeReserve({ '2025-03-01': true }, 'rec1')
        const r2 = makeReserve({ '2025-05-04': true }, 'rec2')
        mockFind.mockReturnValue({ lean: () => Promise.resolve([r1, r2]) })

        const result = await findOverlappingReserveRecord('p1', ['2025-05-04'])
        expect(result!.id).toBe('rec2')
    })
})

// ─── createOrUpdateReserveDayRecord ─────────────────────────────────────────

describe('createOrUpdateReserveDayRecord — scenario: two imports sharing a boundary date', () => {
    it('creates a new record when no overlap exists (first import 1.3–4.5)', async () => {
        mockFind.mockReturnValue({ lean: () => Promise.resolve([]) })

        const { action, formData } = await createOrUpdateReserveDayRecord(
            'p1',
            personnelData,
            null,
            {
                dates: ['2025-03-01', '2025-03-02', '2025-05-04'],
                fundingSource: 'internal',
            }
        )

        expect(action).toBe('created')
        expect(formData.startDate).toEqual(new Date('2025-03-01'))
        expect(formData.endDate).toEqual(new Date('2025-05-04'))
        expect(formData.attendance['2025-05-04']).toBe(true)
    })

    it('merges new dates into existing record when boundary date (4.5) already exists', async () => {
        const existing = makeReserve({
            '2025-03-01': true,
            '2025-03-02': true,
            '2025-05-04': true,
        })
        mockFind.mockReturnValue({ lean: () => Promise.resolve([existing]) })

        const { action, formData } = await createOrUpdateReserveDayRecord(
            'p1',
            personnelData,
            null,
            {
                dates: ['2025-05-04', '2025-05-05', '2025-12-20'],
                fundingSource: 'internal',
            }
        )

        expect(action).toBe('updated')
        // Existing dates preserved
        expect(formData.attendance['2025-03-01']).toBe(true)
        expect(formData.attendance['2025-05-04']).toBe(true)
        // New dates added
        expect(formData.attendance['2025-05-05']).toBe(true)
        expect(formData.attendance['2025-12-20']).toBe(true)
        // startDate/endDate recalculated as Date objects
        expect(formData.startDate).toEqual(new Date('2025-03-01'))
        expect(formData.endDate).toEqual(new Date('2025-12-20'))
    })

    it('calls FormSubmissions.updateOne when merging', async () => {
        const existing = makeReserve({ '2025-05-04': true })
        mockFind.mockReturnValue({ lean: () => Promise.resolve([existing]) })

        await createOrUpdateReserveDayRecord('p1', personnelData, null, {
            dates: ['2025-05-04', '2025-05-05'],
            fundingSource: 'internal',
        })

        expect(mockUpdateOne).toHaveBeenCalledWith(
            { _id: 'rec1' },
            expect.objectContaining({ $set: expect.any(Object) })
        )
    })

    it('skips when all incoming dates already exist in the record', async () => {
        const existing = makeReserve({
            '2025-05-04': true,
            '2025-05-05': true,
        })
        mockFind.mockReturnValue({ lean: () => Promise.resolve([existing]) })

        const { action, formData } = await createOrUpdateReserveDayRecord(
            'p1',
            personnelData,
            null,
            {
                dates: ['2025-05-04', '2025-05-05'],
                fundingSource: 'internal',
            }
        )

        expect(action).toBe('skipped')
        expect(formData).toBeNull()
        expect(mockUpdateOne).not.toHaveBeenCalled()
    })

    it('returns skipped for empty dates array', async () => {
        const { action, formData } = await createOrUpdateReserveDayRecord(
            'p1',
            personnelData,
            null,
            { dates: [], fundingSource: 'internal' }
        )

        expect(action).toBe('skipped')
        expect(formData).toBeNull()
    })

    it('sets correct orderType when merged range becomes 4+ consecutive days', async () => {
        const existing = makeReserve({
            '2025-05-01': true,
            '2025-05-02': true,
            '2025-05-03': true,
        })
        mockFind.mockReturnValue({ lean: () => Promise.resolve([existing]) })

        const { formData } = await createOrUpdateReserveDayRecord(
            'p1',
            personnelData,
            null,
            {
                dates: ['2025-05-03', '2025-05-04', '2025-05-05'],
                fundingSource: 'internal',
            }
        )

        // 5 consecutive days after merge → 8open
        expect(formData.orderType).toBe('8open')
    })
})
