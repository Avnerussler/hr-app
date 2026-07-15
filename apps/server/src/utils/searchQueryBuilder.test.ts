import { buildDateSearchClauses, buildLabelSearchClauses } from './searchQueryBuilder'

describe('buildDateSearchClauses', () => {
    const field = 'formData.startDate'

    describe('YYYY-MM-DD (ISO full date)', () => {
        it('produces a day range for "2026-08-26"', () => {
            const clauses = buildDateSearchClauses(field, '2026-08-26')
            expect(clauses).toHaveLength(1)
            expect(clauses[0]).toEqual({
                [field]: {
                    $gte: new Date('2026-08-26T00:00:00.000Z'),
                    $lte: new Date('2026-08-26T23:59:59.999Z'),
                },
            })
        })
    })

    describe('DD/MM/YYYY (day-first full date)', () => {
        it('produces the same day range for "26/08/2026"', () => {
            const clauses = buildDateSearchClauses(field, '26/08/2026')
            expect(clauses).toHaveLength(1)
            expect(clauses[0]).toEqual({
                [field]: {
                    $gte: new Date('2026-08-26T00:00:00.000Z'),
                    $lte: new Date('2026-08-26T23:59:59.999Z'),
                },
            })
        })
    })

    describe('DD/MM/ (partial day+month, any year)', () => {
        it('produces an $expr $dateToString clause for "26/08/"', () => {
            const clauses = buildDateSearchClauses(field, '26/08/')
            expect(clauses).toHaveLength(1)
            expect(clauses[0]).toEqual({
                $expr: {
                    $eq: [
                        { $dateToString: { format: '%m-%d', date: `$${field}` } },
                        '08-26',
                    ],
                },
            })
        })
    })

    describe('M/YYYY (month + year)', () => {
        it('produces a month range for "8/2026"', () => {
            const clauses = buildDateSearchClauses(field, '8/2026')
            expect(clauses).toHaveLength(1)
            expect(clauses[0]).toEqual({
                [field]: {
                    $gte: new Date('2026-08-01T00:00:00.000Z'),
                    $lt: new Date('2026-09-01T00:00:00.000Z'),
                },
            })
        })

        it('handles December correctly — rolls over to January of next year for "12/2025"', () => {
            const clauses = buildDateSearchClauses(field, '12/2025')
            expect(clauses).toHaveLength(1)
            expect(clauses[0]).toEqual({
                [field]: {
                    $gte: new Date('2025-12-01T00:00:00.000Z'),
                    $lt: new Date('2026-01-01T00:00:00.000Z'),
                },
            })
        })
    })

    describe('YYYY (year only)', () => {
        it('produces a year range for "2026"', () => {
            const clauses = buildDateSearchClauses(field, '2026')
            expect(clauses).toHaveLength(1)
            expect(clauses[0]).toEqual({
                [field]: {
                    $gte: new Date('2026-01-01T00:00:00.000Z'),
                    $lt: new Date('2027-01-01T00:00:00.000Z'),
                },
            })
        })
    })

    describe('unrecognised input', () => {
        it('returns [] for arbitrary text', () => {
            expect(buildDateSearchClauses(field, 'hello')).toEqual([])
        })
    })
})

describe('buildLabelSearchClauses', () => {
    const field = 'formData.isActive'

    const boolChoices = [
        { value: 'true', label: 'פעיל' },
        { value: 'false', label: 'לא פעיל' },
    ]

    it('matches the "true" label and includes both string and boolean in $in', () => {
        // "פעיל" is a substring of both "פעיל" and "לא פעיל", so both choices match.
        // The $in array therefore contains the values for both options.
        const clauses = buildLabelSearchClauses(field, 'פעיל', boolChoices)
        expect(clauses).toEqual([{ [field]: { $in: ['true', true, 'false', false] } }])
    })

    it('matches the "false" label and includes both string and boolean in $in', () => {
        const clauses = buildLabelSearchClauses(field, 'לא פעיל', boolChoices)
        expect(clauses).toEqual([{ [field]: { $in: ['false', false] } }])
    })

    it('matches a plain (non-boolean) label', () => {
        const fundingField = 'formData.fundingSource'
        const choices = [{ value: 'internal', label: 'Internal' }]
        const clauses = buildLabelSearchClauses(fundingField, 'internal', choices)
        expect(clauses).toEqual([{ [fundingField]: { $in: ['internal'] } }])
    })

    it('returns [] when search matches no labels', () => {
        const choices = [{ value: 'a', label: 'Alpha' }]
        expect(buildLabelSearchClauses(field, 'xyz', choices)).toEqual([])
    })

    it('returns [] for an empty choices array', () => {
        expect(buildLabelSearchClauses(field, 'anything', [])).toEqual([])
    })
})
