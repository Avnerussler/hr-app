import { buildLabelSortKeyExpr } from './labelSortKey'

describe('buildLabelSortKeyExpr', () => {
    it('returns undefined when there are no choices', () => {
        expect(buildLabelSortKeyExpr('formData.reserveCategory', [])).toBeUndefined()
    })

    it('builds a $switch mapping each value to its label', () => {
        const choices = [
            { value: 'reserves', label: 'מילואים' },
            { value: 'consultant', label: 'יועץ' },
        ]
        expect(buildLabelSortKeyExpr('formData.reserveCategory', choices)).toEqual({
            $switch: {
                branches: [
                    { case: { $eq: ['$formData.reserveCategory', 'reserves'] }, then: 'מילואים' },
                    { case: { $eq: ['$formData.reserveCategory', 'consultant'] }, then: 'יועץ' },
                ],
                default: '$formData.reserveCategory',
            },
        })
    })

    it('skips choices with no label', () => {
        const choices = [{ value: 'x', label: undefined }, { value: 'reserves', label: 'מילואים' }]
        const result = buildLabelSortKeyExpr('formData.reserveCategory', choices)
        expect(result?.$switch).toMatchObject({
            branches: [{ case: { $eq: ['$formData.reserveCategory', 'reserves'] }, then: 'מילואים' }],
        })
    })

    it('returns undefined when all choices lack labels', () => {
        const choices = [{ value: 'x', label: undefined }]
        expect(buildLabelSortKeyExpr('formData.reserveCategory', choices)).toBeUndefined()
    })

    it('falls back to the raw field value as the default branch', () => {
        const choices = [{ value: 'reserves', label: 'מילואים' }]
        const result = buildLabelSortKeyExpr('formData.reserveCategory', choices)
        expect((result?.$switch as any).default).toBe('$formData.reserveCategory')
    })
})
