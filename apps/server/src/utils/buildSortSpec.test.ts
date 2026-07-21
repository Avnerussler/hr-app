import { buildSortSpec } from './buildSortSpec'

describe('buildSortSpec', () => {
    it('defaults to createdAt desc when no sortField is given', () => {
        expect(buildSortSpec(undefined, undefined)).toEqual({ createdAt: -1 })
    })

    it('sorts on createdAt asc when requested', () => {
        expect(buildSortSpec('createdAt', 'asc')).toEqual({ createdAt: 1 })
    })

    it('sorts on createdAt desc when requested', () => {
        expect(buildSortSpec('createdAt', 'desc')).toEqual({ createdAt: -1 })
    })

    it('sorts on formData.<field> for non-createdAt fields', () => {
        expect(buildSortSpec('lastName', 'desc')).toEqual({ 'formData.lastName': -1 })
    })

    it('defaults to ascending when sortOrder is missing', () => {
        expect(buildSortSpec('lastName', undefined)).toEqual({ 'formData.lastName': 1 })
    })

    it('defaults to ascending when sortOrder is an unrecognized value', () => {
        expect(buildSortSpec('lastName', 'bogus')).toEqual({ 'formData.lastName': 1 })
    })
})
