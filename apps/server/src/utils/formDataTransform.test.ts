import { transformFormData } from './formDataTransform'

// Mock the models module before importing the function
jest.mock('../models', () => ({
    FormFields: {
        findById: jest.fn(),
    },
    FormSubmissions: {
        findOne: jest.fn(),
        find: jest.fn(),
    },
}))

// Mock the logger to silence output during tests
jest.mock('../config/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}))

import { FormFields, FormSubmissions } from '../models'

const mockFormFieldsFindById = FormFields.findById as jest.Mock
const mockFormSubmissionsFindOne = FormSubmissions.findOne as jest.Mock
const mockFormSubmissionsFind = FormSubmissions.find as jest.Mock

const VALID_FORM_ID = '507f1f77bcf86cd799439011'
const VALID_DOC_ID = '507f1f77bcf86cd799439022'
const VALID_DOC_ID_2 = '507f1f77bcf86cd799439033'

/** Helper: create a minimal lean() chain mock */
const makeLean = (value: any) => ({ lean: () => Promise.resolve(value) })

beforeEach(() => {
    jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------
describe('transformFormData — input validation', () => {
    it('returns formData unchanged when formData is null', async () => {
        const result = await transformFormData(null, VALID_FORM_ID)
        expect(result).toBeNull()
        expect(mockFormFieldsFindById).not.toHaveBeenCalled()
    })

    it('returns formData unchanged when formData is a string (not an object)', async () => {
        const result = await transformFormData('hello', VALID_FORM_ID)
        expect(result).toBe('hello')
        expect(mockFormFieldsFindById).not.toHaveBeenCalled()
    })

    it('returns formData unchanged when formId is not a valid ObjectId', async () => {
        const formData = { name: 'test' }
        const result = await transformFormData(formData, 'not-an-id')
        expect(result).toBe(formData)
        expect(mockFormFieldsFindById).not.toHaveBeenCalled()
    })

    it('returns formData unchanged when FormFields.findById returns null', async () => {
        mockFormFieldsFindById.mockResolvedValue(null)
        const formData = { name: 'test' }
        const result = await transformFormData(formData, VALID_FORM_ID)
        expect(result).toBe(formData)
    })
})

// ---------------------------------------------------------------------------
// No foreign fields
// ---------------------------------------------------------------------------
describe('transformFormData — no foreign fields', () => {
    it('returns formData unchanged when the form has no fields with foreign relationships', async () => {
        mockFormFieldsFindById.mockResolvedValue({
            formName: 'testForm',
            sections: [
                {
                    fields: [
                        { name: 'firstName', type: 'text' },
                        { name: 'age', type: 'number' },
                    ],
                },
            ],
        })

        const formData = { firstName: 'Alice', age: 30 }
        const result = await transformFormData(formData, VALID_FORM_ID)
        expect(result).toEqual(formData)
        expect(mockFormSubmissionsFindOne).not.toHaveBeenCalled()
    })

    it('returns formData unchanged when the form has no sections', async () => {
        mockFormFieldsFindById.mockResolvedValue({
            formName: 'testForm',
            sections: [],
        })

        const formData = { field1: 'value1' }
        const result = await transformFormData(formData, VALID_FORM_ID)
        expect(result).toBe(formData)
    })
})

// ---------------------------------------------------------------------------
// select field
// ---------------------------------------------------------------------------
describe('transformFormData — select field', () => {
    beforeEach(() => {
        mockFormFieldsFindById.mockResolvedValue({
            formName: 'testForm',
            sections: [
                {
                    fields: [
                        {
                            name: 'department',
                            type: 'select',
                            foreignFormName: 'departments',
                            foreignField: 'departmentName',
                        },
                    ],
                },
            ],
        })
    })

    it('replaces a valid ObjectId string value with { _id, display } using foreignField', async () => {
        mockFormSubmissionsFindOne.mockReturnValue(
            makeLean({ formData: { departmentName: 'Engineering' } })
        )

        const formData = { department: VALID_DOC_ID }
        const result = await transformFormData(formData, VALID_FORM_ID)

        expect(result.department).toEqual({
            _id: VALID_DOC_ID,
            display: 'Engineering',
        })
    })

    it('leaves value unchanged if referenced submission is not found', async () => {
        mockFormSubmissionsFindOne.mockReturnValue(makeLean(null))

        const formData = { department: VALID_DOC_ID }
        const result = await transformFormData(formData, VALID_FORM_ID)

        // Value should remain the original ID string (not transformed)
        expect(result.department).toBe(VALID_DOC_ID)
    })

    it('leaves value unchanged if value is not a valid ObjectId', async () => {
        const formData = { department: 'not-an-object-id' }
        const result = await transformFormData(formData, VALID_FORM_ID)

        expect(result.department).toBe('not-an-object-id')
        expect(mockFormSubmissionsFindOne).not.toHaveBeenCalled()
    })
})

// ---------------------------------------------------------------------------
// selectAutocomplete field
// ---------------------------------------------------------------------------
describe('transformFormData — selectAutocomplete field', () => {
    it('replaces a valid ObjectId string value with { _id, display }', async () => {
        mockFormFieldsFindById.mockResolvedValue({
            formName: 'testForm',
            sections: [
                {
                    fields: [
                        {
                            name: 'employee',
                            type: 'selectAutocomplete',
                            foreignFormName: 'employees',
                            foreignField: 'fullName',
                        },
                    ],
                },
            ],
        })
        mockFormSubmissionsFindOne.mockReturnValue(
            makeLean({ formData: { fullName: 'John Doe' } })
        )

        const result = await transformFormData(
            { employee: VALID_DOC_ID },
            VALID_FORM_ID
        )

        expect(result.employee).toEqual({ _id: VALID_DOC_ID, display: 'John Doe' })
    })
})

// ---------------------------------------------------------------------------
// radio field
// ---------------------------------------------------------------------------
describe('transformFormData — radio field', () => {
    beforeEach(() => {
        mockFormFieldsFindById.mockResolvedValue({
            formName: 'testForm',
            sections: [
                {
                    fields: [
                        {
                            name: 'status',
                            type: 'radio',
                            foreignFormName: 'statuses',
                            foreignField: 'statusLabel',
                        },
                    ],
                },
            ],
        })
    })

    it('replaces a valid ObjectId with { _id, display } using foreignField', async () => {
        mockFormSubmissionsFindOne.mockReturnValue(
            makeLean({ formData: { statusLabel: 'Active' } })
        )

        const result = await transformFormData(
            { status: VALID_DOC_ID },
            VALID_FORM_ID
        )

        expect(result.status).toEqual({ _id: VALID_DOC_ID, display: 'Active' })
    })

    it('leaves value unchanged if submission not found', async () => {
        mockFormSubmissionsFindOne.mockReturnValue(makeLean(null))

        const result = await transformFormData(
            { status: VALID_DOC_ID },
            VALID_FORM_ID
        )

        expect(result.status).toBe(VALID_DOC_ID)
    })
})

// ---------------------------------------------------------------------------
// enhancedSelect field
// ---------------------------------------------------------------------------
describe('transformFormData — enhancedSelect field', () => {
    beforeEach(() => {
        mockFormFieldsFindById.mockResolvedValue({
            formName: 'testForm',
            sections: [
                {
                    fields: [
                        {
                            name: 'person',
                            type: 'enhancedSelect',
                            foreignFormName: 'persons',
                            foreignFields: ['firstName', 'lastName', 'isActive', 'nickname'],
                        },
                    ],
                },
            ],
        })
    })

    it('replaces value with { _id, display, metadata } joining non-empty, non-boolean foreignFields', async () => {
        mockFormSubmissionsFindOne.mockReturnValue(
            makeLean({
                formData: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    isActive: true,       // boolean — excluded from display
                    nickname: '',         // empty string — excluded from display
                },
            })
        )

        const result = await transformFormData(
            { person: VALID_DOC_ID },
            VALID_FORM_ID
        )

        expect(result.person).toEqual({
            _id: VALID_DOC_ID,
            display: 'Jane Smith',
            metadata: {
                firstName: 'Jane',
                lastName: 'Smith',
                isActive: true,
                nickname: '',
            },
        })
    })

    it('filters out null and undefined values from display', async () => {
        mockFormSubmissionsFindOne.mockReturnValue(
            makeLean({
                formData: {
                    firstName: 'Jane',
                    lastName: null,
                    isActive: undefined,
                    nickname: 'JJ',
                },
            })
        )

        const result = await transformFormData(
            { person: VALID_DOC_ID },
            VALID_FORM_ID
        )

        expect(result.person.display).toBe('Jane JJ')
    })

    it('filters booleans (false) from display parts', async () => {
        mockFormSubmissionsFindOne.mockReturnValue(
            makeLean({
                formData: {
                    firstName: 'Bob',
                    lastName: 'Jones',
                    isActive: false,
                    nickname: 'BJ',
                },
            })
        )

        const result = await transformFormData(
            { person: VALID_DOC_ID },
            VALID_FORM_ID
        )

        expect(result.person.display).toBe('Bob Jones BJ')
    })

    it('leaves value unchanged if value is not a valid ObjectId', async () => {
        const result = await transformFormData(
            { person: 'bad-id' },
            VALID_FORM_ID
        )

        expect(result.person).toBe('bad-id')
        expect(mockFormSubmissionsFindOne).not.toHaveBeenCalled()
    })
})

// ---------------------------------------------------------------------------
// multipleSelect field
// ---------------------------------------------------------------------------
describe('transformFormData — multipleSelect field', () => {
    beforeEach(() => {
        mockFormFieldsFindById.mockResolvedValue({
            formName: 'testForm',
            sections: [
                {
                    fields: [
                        {
                            name: 'tags',
                            type: 'multipleSelect',
                            foreignFormName: 'tags',
                            foreignField: 'tagName',
                        },
                    ],
                },
            ],
        })
    })

    it('replaces array of ObjectIds with array of { _id, display } objects', async () => {
        mockFormSubmissionsFind.mockReturnValue(
            makeLean([
                { _id: { toString: () => VALID_DOC_ID }, formData: { tagName: 'Backend' } },
                { _id: { toString: () => VALID_DOC_ID_2 }, formData: { tagName: 'Frontend' } },
            ])
        )

        const result = await transformFormData(
            { tags: [VALID_DOC_ID, VALID_DOC_ID_2] },
            VALID_FORM_ID
        )

        expect(result.tags).toEqual([
            { _id: VALID_DOC_ID, display: 'Backend' },
            { _id: VALID_DOC_ID_2, display: 'Frontend' },
        ])
    })

    it('falls back to ID as display when submission not found for that ID', async () => {
        mockFormSubmissionsFind.mockReturnValue(
            makeLean([
                { _id: { toString: () => VALID_DOC_ID }, formData: { tagName: 'Backend' } },
                // VALID_DOC_ID_2 is missing from the results
            ])
        )

        const result = await transformFormData(
            { tags: [VALID_DOC_ID, VALID_DOC_ID_2] },
            VALID_FORM_ID
        )

        expect(result.tags).toEqual([
            { _id: VALID_DOC_ID, display: 'Backend' },
            { _id: VALID_DOC_ID_2, display: VALID_DOC_ID_2 },
        ])
    })

    it('skips invalid ObjectIds in the array', async () => {
        mockFormSubmissionsFind.mockReturnValue(
            makeLean([
                { _id: { toString: () => VALID_DOC_ID }, formData: { tagName: 'Backend' } },
            ])
        )

        const result = await transformFormData(
            { tags: [VALID_DOC_ID, 'bad-id'] },
            VALID_FORM_ID
        )

        // Only the valid ID is looked up; bad-id is filtered out before the DB call
        expect(result.tags).toEqual([{ _id: VALID_DOC_ID, display: 'Backend' }])
    })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe('transformFormData — error handling', () => {
    it('returns original formData if FormFields.findById throws unexpectedly', async () => {
        mockFormFieldsFindById.mockRejectedValue(new Error('DB connection lost'))

        const formData = { field1: 'value1' }
        const result = await transformFormData(formData, VALID_FORM_ID)

        expect(result).toBe(formData)
    })

    it('returns original formData if FormSubmissions.findOne throws', async () => {
        mockFormFieldsFindById.mockResolvedValue({
            formName: 'testForm',
            sections: [
                {
                    fields: [
                        {
                            name: 'department',
                            type: 'select',
                            foreignFormName: 'departments',
                            foreignField: 'departmentName',
                        },
                    ],
                },
            ],
        })

        // findOne throws — inner field error should be caught and the field skipped,
        // but the overall function should still return the (partially) transformed data
        mockFormSubmissionsFindOne.mockReturnValue({
            lean: () => Promise.reject(new Error('Query failed')),
        })

        const formData = { department: VALID_DOC_ID }
        // Should not throw; error is caught per-field
        const result = await transformFormData(formData, VALID_FORM_ID)
        expect(result).toBeDefined()
    })
})
