import { FormFields, FormSubmissions } from '../models'
import logger from '../config/logger'
import mongoose from 'mongoose'

export interface ValidationError {
    field?: string
    message: string
    code: string
}

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
}

class FormValidationService {
    async validateFormSubmission(
        formData: any,
        formId: string,
        formName: string
    ): Promise<ValidationResult> {
        try {
            const formDefinition = await FormFields.findById(formId)
            if (!formDefinition) {
                return {
                    isValid: false,
                    errors: [{ message: 'Form definition not found', code: 'FORM_NOT_FOUND' }]
                }
            }

            const errors: ValidationError[] = []

            // 1. Field-level validation
            await this.validateFields(formData, formDefinition, errors)

            // 2. Business rules validation
            await this.validateBusinessRules(formData, formDefinition, errors)

            return {
                isValid: errors.length === 0,
                errors
            }
        } catch (error) {
            logger.error('Form validation error:', error)
            return {
                isValid: false,
                errors: [{ message: 'Validation service error', code: 'VALIDATION_ERROR' }]
            }
        }
    }

    private async validateFields(
        formData: any,
        formDefinition: any,
        errors: ValidationError[]
    ): Promise<void> {
        const allFields = formDefinition.sections?.flatMap((section: any) => section.fields || []) || []

        for (const field of allFields) {
            const value = formData[field.name]
            
            // Required field validation
            if (field.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field: field.name,
                    message: field.errorMessage || `${field.label || field.name} is required`,
                    code: 'REQUIRED_FIELD'
                })
                continue
            }

            // Skip further validation if field is empty and not required
            if (value === undefined || value === null || value === '') {
                continue
            }

            // Field-specific validation
            if (field.validation) {
                this.validateFieldConstraints(field, value, errors)
            }
        }
    }

    private validateFieldConstraints(field: any, value: any, errors: ValidationError[]): void {
        const validation = field.validation
        
        // String length validation
        if (typeof value === 'string') {
            if (validation.minLength && value.length < validation.minLength) {
                errors.push({
                    field: field.name,
                    message: `${field.label} must be at least ${validation.minLength} characters`,
                    code: 'MIN_LENGTH'
                })
            }
            if (validation.maxLength && value.length > validation.maxLength) {
                errors.push({
                    field: field.name,
                    message: `${field.label} must be at most ${validation.maxLength} characters`,
                    code: 'MAX_LENGTH'
                })
            }
            if (validation.pattern) {
                const regex = new RegExp(validation.pattern)
                if (!regex.test(value)) {
                    errors.push({
                        field: field.name,
                        message: field.errorMessage || `${field.label} format is invalid`,
                        code: 'PATTERN_MISMATCH'
                    })
                }
            }
        }

        // Numeric validation
        if (typeof value === 'number') {
            if (validation.min !== undefined && value < validation.min) {
                errors.push({
                    field: field.name,
                    message: `${field.label} must be at least ${validation.min}`,
                    code: 'MIN_VALUE'
                })
            }
            if (validation.max !== undefined && value > validation.max) {
                errors.push({
                    field: field.name,
                    message: `${field.label} must be at most ${validation.max}`,
                    code: 'MAX_VALUE'
                })
            }
        }
    }

    private async validateBusinessRules(
        formData: any,
        formDefinition: any,
        errors: ValidationError[]
    ): Promise<void> {
        const businessRules = formDefinition.businessRules || []

        for (const rule of businessRules) {
            if (!rule.enabled) continue

            try {
                const isValid = await this.validateBusinessRule(formData, rule, formDefinition)
                if (!isValid) {
                    errors.push({
                        message: rule.errorMessage,
                        code: rule.ruleType.toUpperCase()
                    })
                }
            } catch (error) {
                logger.error(`Business rule validation error for rule ${rule.id}:`, error)
                errors.push({
                    message: 'Business rule validation failed',
                    code: 'BUSINESS_RULE_ERROR'
                })
            }
        }
    }

    private async validateBusinessRule(
        formData: any,
        rule: any,
        formDefinition: any
    ): Promise<boolean> {
        switch (rule.ruleType) {
            case 'uniqueConstraint':
                return await this.validateUniqueConstraint(formData, rule, formDefinition)
            case 'dateRange':
                return this.validateDateRange(formData, rule)
            case 'conditional':
                return this.validateConditional(formData, rule)
            case 'custom':
                return await this.validateCustomRule(formData, rule, formDefinition)
            default:
                logger.warn(`Unknown business rule type: ${rule.ruleType}`)
                return true
        }
    }

    private async validateUniqueConstraint(
        formData: any,
        rule: any,
        formDefinition: any
    ): Promise<boolean> {
        const { fields, query } = rule.config
        
        if (!fields || !Array.isArray(fields)) {
            logger.warn('uniqueConstraint rule missing fields configuration')
            return true
        }

        // Build query conditions
        const conditions: any = { formName: formDefinition.formName }
        
        for (const fieldPath of fields) {
            const value = this.getNestedValue(formData, fieldPath)
            if (value !== undefined) {
                // Handle both object references and direct values
                if (typeof value === 'object' && value._id) {
                    conditions[`formData.${fieldPath}._id`] = value._id
                    conditions[`formData.${fieldPath}`] = value._id
                } else {
                    conditions[`formData.${fieldPath}`] = value
                }
            }
        }

        // Add any additional query conditions from config
        if (query) {
            Object.assign(conditions, query)
        }

        const existingSubmissions = await FormSubmissions.find({
            $and: [
                conditions,
                // Add OR conditions for object vs direct value matching
                ...fields.map((fieldPath: string) => {
                    const value = this.getNestedValue(formData, fieldPath)
                    if (typeof value === 'object' && value._id) {
                        return {
                            $or: [
                                { [`formData.${fieldPath}._id`]: value._id },
                                { [`formData.${fieldPath}`]: value._id }
                            ]
                        }
                    }
                    return { [`formData.${fieldPath}`]: value }
                })
            ]
        })

        return existingSubmissions.length === 0
    }

    private validateDateRange(formData: any, rule: any): boolean {
        const { startDateField, endDateField, maxDays, minDays } = rule.config
        
        const startDate = new Date(formData[startDateField])
        const endDate = new Date(formData[endDateField])
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return false
        }
        
        if (startDate > endDate) {
            return false
        }
        
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (maxDays !== undefined && daysDiff > maxDays) {
            return false
        }
        
        if (minDays !== undefined && daysDiff < minDays) {
            return false
        }
        
        return true
    }

    private validateConditional(formData: any, rule: any): boolean {
        const { condition, then } = rule.config
        
        // Evaluate condition
        if (this.evaluateCondition(formData, condition)) {
            // If condition is true, validate the "then" rules
            return this.evaluateCondition(formData, then)
        }
        
        return true
    }

    private async validateCustomRule(
        formData: any,
        rule: any,
        formDefinition: any
    ): Promise<boolean> {
        // For custom rules, we can implement specific business logic
        // This is where you'd add the Reserve Days overlap validation
        if (rule.id === 'reserveDaysOverlap') {
            return await this.validateReserveDaysOverlap(formData, formDefinition)
        }
        
        logger.warn(`Unknown custom rule: ${rule.id}`)
        return true
    }

    private async validateReserveDaysOverlap(formData: any, formDefinition: any): Promise<boolean> {
        if (formDefinition.formName !== 'Reserve Days Management') {
            return true
        }

        const { employeeName, startDate, endDate } = formData
        
        if (!employeeName || !startDate || !endDate) {
            return true
        }

        const employeeId = typeof employeeName === 'object' ? employeeName._id : employeeName

        if (!employeeId) {
            return true
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return true
        }

        const existingReservations = await FormSubmissions.find({
            formName: 'Reserve Days Management',
            $and: [
                {
                    $or: [
                        { 'formData.employeeName._id': employeeId },
                        { 'formData.employeeName': employeeId }
                    ]
                },
                {
                    $or: [
                        // New period overlaps with existing
                        {
                            'formData.startDate': { $lte: endDate },
                            'formData.endDate': { $gte: startDate }
                        }
                    ]
                }
            ]
        })

        return existingReservations.length === 0
    }

    private evaluateCondition(formData: any, condition: any): boolean {
        // Simple condition evaluation - can be extended
        const { field, operator, value } = condition
        const fieldValue = this.getNestedValue(formData, field)
        
        switch (operator) {
            case '=':
                return fieldValue === value
            case '!=':
                return fieldValue !== value
            case '>':
                return fieldValue > value
            case '<':
                return fieldValue < value
            case '>=':
                return fieldValue >= value
            case '<=':
                return fieldValue <= value
            case 'includes':
                return Array.isArray(fieldValue) && fieldValue.includes(value)
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
            default:
                return true
        }
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj)
    }
}

export const formValidationService = new FormValidationService()