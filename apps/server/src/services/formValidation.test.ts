import mongoose from 'mongoose'

// Mock DB models before importing the service
jest.mock('../models', () => ({
    FormFields: { findById: jest.fn() },
    FormSubmissions: { findOne: jest.fn() },
}))
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
jest.mock('../config/logger', () => ({ __esModule: true, default: mockLogger }))

import { FormFields, FormSubmissions } from '../models'
import { formValidationService } from './formValidation'

const mockFindById = FormFields.findById as jest.Mock
const mockFindOne = FormSubmissions.findOne as jest.Mock

// Minimal form definition builder
const makeForm = (overrides: Record<string, unknown> = {}) => ({
    formName: 'test_form',
    sections: [],
    businessRules: [],
    ...overrides,
})

const makeField = (overrides: Record<string, unknown> = {}) => ({
    name: 'field1',
    label: 'Field 1',
    type: 'text',
    required: false,
    ...overrides,
})

beforeEach(() => {
    jest.clearAllMocks()
})

// ─── Form not found ────────────────────────────────────────────────────────────

describe('validateFormSubmission — form not found', () => {
    it('returns FORM_NOT_FOUND error when formId does not exist', async () => {
        mockFindById.mockResolvedValue(null)
        const result = await formValidationService.validateFormSubmission({}, 'bad-id', 'test_form')
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('FORM_NOT_FOUND')
    })
})

// ─── Field validation ──────────────────────────────────────────────────────────

describe('field validation', () => {
    it('passes when all required fields are present', async () => {
        mockFindById.mockResolvedValue(makeForm({
            sections: [{ fields: [makeField({ required: true })] }],
        }))
        const result = await formValidationService.validateFormSubmission(
            { field1: 'value' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
    })

    it('fails with REQUIRED_FIELD when required field is missing', async () => {
        mockFindById.mockResolvedValue(makeForm({
            sections: [{ fields: [makeField({ required: true })] }],
        }))
        const result = await formValidationService.validateFormSubmission(
            {}, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('REQUIRED_FIELD')
        expect(result.errors[0].field).toBe('field1')
    })

    it('fails with REQUIRED_FIELD when required field is empty string', async () => {
        mockFindById.mockResolvedValue(makeForm({
            sections: [{ fields: [makeField({ required: true })] }],
        }))
        const result = await formValidationService.validateFormSubmission(
            { field1: '' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('REQUIRED_FIELD')
    })

    describe('string constraints', () => {
        it('fails MIN_LENGTH when value is too short', async () => {
            mockFindById.mockResolvedValue(makeForm({
                sections: [{ fields: [makeField({ validation: { minLength: 5 } })] }],
            }))
            const result = await formValidationService.validateFormSubmission(
                { field1: 'hi' }, 'form-id', 'test_form'
            )
            expect(result.errors[0].code).toBe('MIN_LENGTH')
        })

        it('fails MAX_LENGTH when value is too long', async () => {
            mockFindById.mockResolvedValue(makeForm({
                sections: [{ fields: [makeField({ validation: { maxLength: 3 } })] }],
            }))
            const result = await formValidationService.validateFormSubmission(
                { field1: 'toolong' }, 'form-id', 'test_form'
            )
            expect(result.errors[0].code).toBe('MAX_LENGTH')
        })

        it('fails PATTERN_MISMATCH when value does not match pattern', async () => {
            mockFindById.mockResolvedValue(makeForm({
                sections: [{ fields: [makeField({ validation: { pattern: '^[0-9]+$' } })] }],
            }))
            const result = await formValidationService.validateFormSubmission(
                { field1: 'abc' }, 'form-id', 'test_form'
            )
            expect(result.errors[0].code).toBe('PATTERN_MISMATCH')
        })

        it('passes PATTERN when value matches', async () => {
            mockFindById.mockResolvedValue(makeForm({
                sections: [{ fields: [makeField({ validation: { pattern: '^[0-9]+$' } })] }],
            }))
            const result = await formValidationService.validateFormSubmission(
                { field1: '123' }, 'form-id', 'test_form'
            )
            expect(result.isValid).toBe(true)
        })
    })

    describe('number constraints', () => {
        it('fails MIN_VALUE when number is below min', async () => {
            mockFindById.mockResolvedValue(makeForm({
                sections: [{ fields: [makeField({ type: 'number', validation: { min: 10 } })] }],
            }))
            const result = await formValidationService.validateFormSubmission(
                { field1: 5 }, 'form-id', 'test_form'
            )
            expect(result.errors[0].code).toBe('MIN_VALUE')
        })

        it('fails MAX_VALUE when number exceeds max', async () => {
            mockFindById.mockResolvedValue(makeForm({
                sections: [{ fields: [makeField({ type: 'number', validation: { max: 10 } })] }],
            }))
            const result = await formValidationService.validateFormSubmission(
                { field1: 99 }, 'form-id', 'test_form'
            )
            expect(result.errors[0].code).toBe('MAX_VALUE')
        })
    })
})

// ─── Business rules — disabled ─────────────────────────────────────────────────

describe('business rules — disabled rule is skipped', () => {
    it('does not run rule when enabled is false', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [{
                id: 'rule1',
                ruleType: 'uniqueConstraint',
                enabled: false,
                errorMessage: 'Duplicate',
                config: { fields: ['field1'] },
            }],
        }))
        mockFindOne.mockResolvedValue({ _id: 'existing' }) // would fail if run
        const result = await formValidationService.validateFormSubmission(
            { field1: 'value' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
        expect(mockFindOne).not.toHaveBeenCalled()
    })
})

// ─── Business rules — statusCode propagation ───────────────────────────────────

describe('business rules — statusCode', () => {
    it('includes statusCode from rule when rule fails', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [{
                id: 'overlapRule',
                ruleType: 'noOverlap',
                enabled: true,
                statusCode: 409,
                errorMessage: 'Overlap error',
                config: { entityField: 'employee', startDateField: 'startDate', endDateField: 'endDate' },
            }],
        }))
        mockFindOne.mockResolvedValue({ _id: 'existing' }) // overlap found
        const result = await formValidationService.validateFormSubmission(
            { employee: 'emp1', startDate: '2026-07-01', endDate: '2026-07-05' },
            'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].statusCode).toBe(409)
        expect(result.errors[0].code).toBe('NOOVERLAP')
    })

    it('omits statusCode from error when rule has no statusCode', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [{
                id: 'uniqueRule',
                ruleType: 'uniqueConstraint',
                enabled: true,
                errorMessage: 'Duplicate',
                config: { fields: ['field1'] },
            }],
        }))
        mockFindOne.mockResolvedValue({ _id: 'existing' })
        const result = await formValidationService.validateFormSubmission(
            { field1: 'duplicate' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].statusCode).toBeUndefined()
    })
})

// ─── uniqueConstraint ──────────────────────────────────────────────────────────

describe('uniqueConstraint rule', () => {
    const rule = {
        id: 'r1',
        ruleType: 'uniqueConstraint',
        enabled: true,
        errorMessage: 'Duplicate',
        config: { fields: ['email'] },
    }

    it('passes when no duplicate exists', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        mockFindOne.mockResolvedValue(null)
        const result = await formValidationService.validateFormSubmission(
            { email: 'test@test.com' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
    })

    it('fails when duplicate exists', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        mockFindOne.mockResolvedValue({ _id: 'existing' })
        const result = await formValidationService.validateFormSubmission(
            { email: 'test@test.com' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('UNIQUECONSTRAINT')
    })

    it('excludes self when excludeId is provided (update scenario)', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        mockFindOne.mockResolvedValue(null)
        const excludeId = new mongoose.Types.ObjectId().toString()
        const result = await formValidationService.validateFormSubmission(
            { email: 'test@test.com' }, 'form-id', 'test_form', excludeId
        )
        expect(result.isValid).toBe(true)
        // Verify excludeId was passed into the query
        const queryArg = mockFindOne.mock.calls[0][0]
        const andClauses = queryArg.$and as Array<Record<string, unknown>>
        const excludeClause = andClauses.find(c => c._id !== undefined)
        expect(excludeClause).toBeDefined()
    })

    it('passes when fields config is empty (misconfigured rule)', async () => {
        const badRule = { ...rule, config: { fields: [] } }
        mockFindById.mockResolvedValue(makeForm({ businessRules: [badRule] }))
        const result = await formValidationService.validateFormSubmission(
            { email: 'x' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
        expect(mockFindOne).not.toHaveBeenCalled()
    })
})

// ─── dateRange ─────────────────────────────────────────────────────────────────

describe('dateRange rule', () => {
    const makeRule = (config: Record<string, unknown>) => ({
        id: 'dr1',
        ruleType: 'dateRange',
        enabled: true,
        errorMessage: 'Invalid date range',
        config,
    })

    it('passes for valid date range', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [makeRule({ startDateField: 'start', endDateField: 'end' })],
        }))
        const result = await formValidationService.validateFormSubmission(
            { start: new Date('2026-07-01'), end: new Date('2026-07-05') }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
    })

    it('fails when start is after end', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [makeRule({ startDateField: 'start', endDateField: 'end' })],
        }))
        const result = await formValidationService.validateFormSubmission(
            { start: new Date('2026-07-10'), end: new Date('2026-07-01') }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('DATERANGE')
    })

    it('fails when duration exceeds maxDays', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [makeRule({ startDateField: 'start', endDateField: 'end', maxDays: 3 })],
        }))
        const result = await formValidationService.validateFormSubmission(
            { start: new Date('2026-07-01'), end: new Date('2026-07-10') }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
    })

    it('fails when duration is below minDays', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [makeRule({ startDateField: 'start', endDateField: 'end', minDays: 5 })],
        }))
        const result = await formValidationService.validateFormSubmission(
            { start: new Date('2026-07-01'), end: new Date('2026-07-02') }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
    })

    it('fails when dates are invalid', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [makeRule({ startDateField: 'start', endDateField: 'end' })],
        }))
        const result = await formValidationService.validateFormSubmission(
            { start: 'not-a-date', end: new Date('2026-07-05') }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
    })
})

// ─── conditional ───────────────────────────────────────────────────────────────

describe('conditional rule', () => {
    const makeRule = (condition: Record<string, unknown>, then: Record<string, unknown>) => ({
        id: 'cond1',
        ruleType: 'conditional',
        enabled: true,
        errorMessage: 'Conditional failed',
        config: { condition, then },
    })

    it('passes when condition is false (rule does not apply)', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [makeRule(
                { field: 'type', operator: '=', value: 'special' },
                { field: 'extra', operator: 'exists', value: null }
            )],
        }))
        const result = await formValidationService.validateFormSubmission(
            { type: 'normal' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
    })

    it('passes when condition is true and then is satisfied', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [makeRule(
                { field: 'type', operator: '=', value: 'special' },
                { field: 'extra', operator: 'exists', value: null }
            )],
        }))
        const result = await formValidationService.validateFormSubmission(
            { type: 'special', extra: 'present' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
    })

    it('fails when condition is true and then is not satisfied', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [makeRule(
                { field: 'type', operator: '=', value: 'special' },
                { field: 'extra', operator: 'exists', value: null }
            )],
        }))
        const result = await formValidationService.validateFormSubmission(
            { type: 'special' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('CONDITIONAL')
    })

    describe('operator coverage', () => {
        const testOp = async (
            formData: Record<string, unknown>,
            operator: string,
            value: unknown,
            expectValid: boolean
        ) => {
            mockFindById.mockResolvedValue(makeForm({
                businessRules: [makeRule(
                    { field: 'x', operator, value },
                    { field: 'x', operator: '=', value: formData.x } // always true when condition fires
                )],
            }))
            const result = await formValidationService.validateFormSubmission(formData, 'form-id', 'test_form')
            // condition fires → then is always true → isValid = true when condition matches expectation
            return result.isValid
        }

        it('!= operator — condition fires when field differs', async () => {
            mockFindById.mockResolvedValue(makeForm({
                businessRules: [makeRule(
                    { field: 'x', operator: '!=', value: 'a' },
                    { field: 'x', operator: 'exists', value: null }
                )],
            }))
            // x = 'b' → condition (x != 'a') is true → then (x exists) is true → valid
            const r1 = await formValidationService.validateFormSubmission({ x: 'b' }, 'form-id', 'test_form')
            expect(r1.isValid).toBe(true)
            // x = 'a' → condition is false → rule skipped → valid
            const r2 = await formValidationService.validateFormSubmission({ x: 'a' }, 'form-id', 'test_form')
            expect(r2.isValid).toBe(true)
        })

        it('> operator', async () => {
            mockFindById.mockResolvedValue(makeForm({
                businessRules: [makeRule(
                    { field: 'age', operator: '>', value: 18 },
                    { field: 'consent', operator: 'exists', value: null }
                )],
            }))
            // age > 18 but no consent → fails
            const r = await formValidationService.validateFormSubmission({ age: 25 }, 'form-id', 'test_form')
            expect(r.isValid).toBe(false)
        })

        it('includes operator', async () => {
            mockFindById.mockResolvedValue(makeForm({
                businessRules: [makeRule(
                    { field: 'roles', operator: 'includes', value: 'admin' },
                    { field: 'pin', operator: 'exists', value: null }
                )],
            }))
            // roles includes 'admin' but no pin → fails
            const r = await formValidationService.validateFormSubmission(
                { roles: ['admin', 'user'] }, 'form-id', 'test_form'
            )
            expect(r.isValid).toBe(false)
        })
    })
})

// ─── noOverlap ─────────────────────────────────────────────────────────────────

describe('noOverlap rule', () => {
    const rule = {
        id: 'overlapRule',
        ruleType: 'noOverlap',
        enabled: true,
        statusCode: 409,
        errorMessage: 'Overlap detected',
        config: { entityField: 'employee', startDateField: 'startDate', endDateField: 'endDate' },
    }

    it('passes when no overlap exists', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        mockFindOne.mockResolvedValue(null)
        const result = await formValidationService.validateFormSubmission(
            { employee: 'emp1', startDate: '2026-07-01', endDate: '2026-07-05' },
            'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
    })

    it('fails with 409 when overlap exists', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        mockFindOne.mockResolvedValue({ _id: 'conflict' })
        const result = await formValidationService.validateFormSubmission(
            { employee: 'emp1', startDate: '2026-07-03', endDate: '2026-07-08' },
            'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].statusCode).toBe(409)
        expect(result.errors[0].code).toBe('NOOVERLAP')
    })

    it('accepts entity as object with _id', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        mockFindOne.mockResolvedValue(null)
        const result = await formValidationService.validateFormSubmission(
            { employee: { _id: 'emp1', display: 'John Doe' }, startDate: '2026-07-01', endDate: '2026-07-05' },
            'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
        const queryArg = mockFindOne.mock.calls[0][0]
        const orClauses = queryArg.$or as Array<Record<string, unknown>>
        expect(orClauses.some(c => c['formData.employee._id'] === 'emp1')).toBe(true)
    })

    it('skips validation when entity is missing', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        const result = await formValidationService.validateFormSubmission(
            { startDate: '2026-07-01', endDate: '2026-07-05' },
            'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
        expect(mockFindOne).not.toHaveBeenCalled()
    })

    it('skips validation when startDate is missing', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        const result = await formValidationService.validateFormSubmission(
            { employee: 'emp1', endDate: '2026-07-05' },
            'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
        expect(mockFindOne).not.toHaveBeenCalled()
    })

    it('uses startDate as endDate fallback when endDate is missing', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        mockFindOne.mockResolvedValue(null)
        await formValidationService.validateFormSubmission(
            { employee: 'emp1', startDate: '2026-07-01' },
            'form-id', 'test_form'
        )
        const queryArg = mockFindOne.mock.calls[0][0]
        expect(queryArg['formData.startDate']).toEqual({ $lte: '2026-07-01' })
        expect(queryArg['formData.endDate']).toEqual({ $gte: '2026-07-01' })
    })

    it('excludes self from overlap check when excludeId is provided', async () => {
        mockFindById.mockResolvedValue(makeForm({ businessRules: [rule] }))
        mockFindOne.mockResolvedValue(null)
        const excludeId = new mongoose.Types.ObjectId().toString()
        await formValidationService.validateFormSubmission(
            { employee: 'emp1', startDate: '2026-07-01', endDate: '2026-07-05' },
            'form-id', 'test_form', excludeId
        )
        const queryArg = mockFindOne.mock.calls[0][0]
        expect(queryArg._id).toBeDefined()
        expect((queryArg._id as Record<string, unknown>).$ne).toBeDefined()
    })
})

// ─── custom rule ───────────────────────────────────────────────────────────────

describe('custom rule', () => {
    it('always passes and does not throw', async () => {
        mockFindById.mockResolvedValue(makeForm({
            businessRules: [{
                id: 'customRule',
                ruleType: 'custom',
                enabled: true,
                errorMessage: 'Custom error',
                config: {},
            }],
        }))
        const result = await formValidationService.validateFormSubmission(
            { field1: 'value' }, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(true)
    })
})

// ─── error handling ────────────────────────────────────────────────────────────

describe('error handling', () => {
    it('returns VALIDATION_ERROR when an exception is thrown', async () => {
        mockFindById.mockRejectedValue(new Error('DB connection failed'))
        const result = await formValidationService.validateFormSubmission(
            {}, 'form-id', 'test_form'
        )
        expect(result.isValid).toBe(false)
        expect(result.errors[0].code).toBe('VALIDATION_ERROR')
    })
})
