import { FormFields, FormSubmissions } from '../models'
import logger from '../config/logger'
import mongoose, { Document } from 'mongoose'
import type {
    IForm,
    BusinessRule,
    UniqueConstraintConfig,
    DateRangeConfig,
    ConditionalConfig,
    NoOverlapConfig,
} from '../types'

export interface ValidationError {
    field?: string
    message: string
    code: string
    statusCode?: number
}

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
}

type FormDefinition = IForm & Document

class FormValidationService {
    async validateFormSubmission(
        formData: Record<string, unknown>,
        formId: string,
        _formName: string,
        excludeId?: string
    ): Promise<ValidationResult> {
        try {
            const formDefinition = await FormFields.findById(formId) as FormDefinition | null
            if (!formDefinition) {
                return {
                    isValid: false,
                    errors: [{ message: 'Form definition not found', code: 'FORM_NOT_FOUND' }],
                }
            }

            const errors: ValidationError[] = []
            await this.validateFields(formData, formDefinition, errors)
            await this.validateBusinessRules(formData, formDefinition, errors, excludeId)

            return { isValid: errors.length === 0, errors }
        } catch (error) {
            logger.error('Form validation error:', error)
            return {
                isValid: false,
                errors: [{ message: 'Validation service error', code: 'VALIDATION_ERROR' }],
            }
        }
    }

    private async validateFields(
        formData: Record<string, unknown>,
        formDefinition: FormDefinition,
        errors: ValidationError[]
    ): Promise<void> {
        const allFields = formDefinition.sections?.flatMap(s => s.fields ?? []) ?? []

        for (const field of allFields) {
            const value = formData[field.name]

            if (field.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field: field.name,
                    message: field.errorMessages || `${field.label || field.name} is required`,
                    code: 'REQUIRED_FIELD',
                })
                continue
            }

            if (value === undefined || value === null || value === '') continue

            if (field.validation) {
                this.validateFieldConstraints(field.name, field.label ?? field.name, field.validation, value, errors)
            }
        }
    }

    private validateFieldConstraints(
        fieldName: string,
        fieldLabel: string,
        validation: IForm['sections'][0]['fields'][0]['validation'],
        value: unknown,
        errors: ValidationError[]
    ): void {
        if (!validation) return

        if (typeof value === 'string') {
            if (validation.minLength && value.length < validation.minLength) {
                errors.push({ field: fieldName, message: `${fieldLabel} must be at least ${validation.minLength} characters`, code: 'MIN_LENGTH' })
            }
            if (validation.maxLength && value.length > validation.maxLength) {
                errors.push({ field: fieldName, message: `${fieldLabel} must be at most ${validation.maxLength} characters`, code: 'MAX_LENGTH' })
            }
            if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
                errors.push({ field: fieldName, message: `${fieldLabel} format is invalid`, code: 'PATTERN_MISMATCH' })
            }
        }

        if (typeof value === 'number') {
            if (validation.min !== undefined && value < validation.min) {
                errors.push({ field: fieldName, message: `${fieldLabel} must be at least ${validation.min}`, code: 'MIN_VALUE' })
            }
            if (validation.max !== undefined && value > validation.max) {
                errors.push({ field: fieldName, message: `${fieldLabel} must be at most ${validation.max}`, code: 'MAX_VALUE' })
            }
        }
    }

    private async validateBusinessRules(
        formData: Record<string, unknown>,
        formDefinition: FormDefinition,
        errors: ValidationError[],
        excludeId?: string
    ): Promise<void> {
        const businessRules: BusinessRule[] = formDefinition.businessRules ?? []

        for (const rule of businessRules) {
            if (!rule.enabled) continue

            try {
                const isValid = await this.validateBusinessRule(formData, rule, formDefinition, excludeId)
                if (!isValid) {
                    errors.push({
                        message: rule.errorMessage,
                        code: rule.ruleType.toUpperCase(),
                        ...(rule.statusCode && { statusCode: rule.statusCode }),
                    })
                }
            } catch (error) {
                logger.error(`Business rule validation error for rule ${rule.id}:`, error)
                errors.push({ message: 'Business rule validation failed', code: 'BUSINESS_RULE_ERROR' })
            }
        }
    }

    private async validateBusinessRule(
        formData: Record<string, unknown>,
        rule: BusinessRule,
        formDefinition: FormDefinition,
        excludeId?: string
    ): Promise<boolean> {
        switch (rule.ruleType) {
            case 'uniqueConstraint':
                return this.validateUniqueConstraint(formData, rule.config as UniqueConstraintConfig, formDefinition, excludeId)
            case 'dateRange':
                return this.validateDateRange(formData, rule.config as DateRangeConfig)
            case 'conditional':
                return this.validateConditional(formData, rule.config as ConditionalConfig)
            case 'noOverlap':
                return this.validateNoOverlap(formData, rule.config as NoOverlapConfig, formDefinition, excludeId)
            case 'custom':
                logger.warn(`Custom rule type not implemented: ${rule.id}`)
                return true
            default:
                logger.warn(`Unknown business rule type: ${rule.ruleType}`)
                return true
        }
    }

    private async validateUniqueConstraint(
        formData: Record<string, unknown>,
        config: UniqueConstraintConfig,
        formDefinition: FormDefinition,
        excludeId?: string
    ): Promise<boolean> {
        const { fields, query } = config

        if (!fields?.length) {
            logger.warn('uniqueConstraint rule missing fields configuration')
            return true
        }

        const conditions: Record<string, unknown> = { formName: formDefinition.formName }

        for (const fieldPath of fields) {
            const value = this.getNestedValue(formData, fieldPath)
            if (value !== undefined) {
                if (value !== null && typeof value === 'object' && '_id' in value) {
                    conditions[`formData.${fieldPath}`] = (value as { _id: unknown })._id
                } else {
                    conditions[`formData.${fieldPath}`] = value
                }
            }
        }

        if (query) Object.assign(conditions, query)

        const andClauses: Record<string, unknown>[] = [
            conditions,
            { isDeleted: false },
            ...fields.map(fieldPath => {
                const value = this.getNestedValue(formData, fieldPath)
                if (value !== null && typeof value === 'object' && '_id' in value) {
                    const id = (value as { _id: unknown })._id
                    return { $or: [{ [`formData.${fieldPath}._id`]: id }, { [`formData.${fieldPath}`]: id }] }
                }
                return { [`formData.${fieldPath}`]: value }
            }),
        ]

        if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
            andClauses.push({ _id: { $ne: new mongoose.Types.ObjectId(excludeId) } })
        }

        const existing = await FormSubmissions.findOne({ $and: andClauses })
        return existing === null
    }

    private validateDateRange(
        formData: Record<string, unknown>,
        config: DateRangeConfig
    ): boolean {
        const { startDateField, endDateField, maxDays, minDays } = config

        const startDate = formData[startDateField] as Date
        const endDate = formData[endDateField] as Date

        if (!(startDate instanceof Date) || !(endDate instanceof Date)) return false
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false
        if (startDate > endDate) return false

        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)
        if (maxDays !== undefined && daysDiff > maxDays) return false
        if (minDays !== undefined && daysDiff < minDays) return false

        return true
    }

    private validateConditional(
        formData: Record<string, unknown>,
        config: ConditionalConfig
    ): boolean {
        if (this.evaluateCondition(formData, config.condition)) {
            return this.evaluateCondition(formData, config.then)
        }
        return true
    }

    /**
     * Generic no-overlap validator — field names come from rule.config in the DB.
     * Prevents two submissions on the same form from having overlapping date ranges
     * for the same entity (e.g. same employee).
     */
    private async validateNoOverlap(
        formData: Record<string, unknown>,
        config: NoOverlapConfig,
        formDefinition: FormDefinition,
        excludeId?: string
    ): Promise<boolean> {
        const { entityField, startDateField, endDateField } = config

        const entityValue = formData[entityField]
        const startDate = formData[startDateField] as Date | undefined
        const endDate = (formData[endDateField] as Date | undefined) ?? startDate

        if (!entityValue || !startDate) return true

        const entityId =
            entityValue !== null && typeof entityValue === 'object' && '_id' in entityValue
                ? (entityValue as { _id: string })._id
                : (entityValue as string)

        if (!entityId) return true

        const query: Record<string, unknown> = {
            formName: formDefinition.formName,
            isDeleted: false,
            $or: [
                { [`formData.${entityField}._id`]: entityId },
                { [`formData.${entityField}`]: entityId },
            ],
            [`formData.${startDateField}`]: { $lte: endDate },
            [`formData.${endDateField}`]: { $gte: startDate },
        }

        if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
            query._id = { $ne: new mongoose.Types.ObjectId(excludeId) }
        }

        const overlap = await FormSubmissions.findOne(query)
        return overlap === null
    }

    private evaluateCondition(
        formData: Record<string, unknown>,
        condition: { field: string; operator: string; value: unknown }
    ): boolean {
        const { field, operator, value } = condition
        const fieldValue = this.getNestedValue(formData, field)

        switch (operator) {
            case '=': return fieldValue === value
            case '!=': return fieldValue !== value
            case '>': return (fieldValue as number) > (value as number)
            case '<': return (fieldValue as number) < (value as number)
            case '>=': return (fieldValue as number) >= (value as number)
            case '<=': return (fieldValue as number) <= (value as number)
            case 'includes': return Array.isArray(fieldValue) && fieldValue.includes(value)
            case 'exists': return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
            default: return true
        }
    }

    private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce<unknown>((current, key) => {
            if (current !== null && typeof current === 'object') {
                return (current as Record<string, unknown>)[key]
            }
            return undefined
        }, obj)
    }
}

export const formValidationService = new FormValidationService()
