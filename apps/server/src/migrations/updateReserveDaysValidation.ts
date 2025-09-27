import { FormFields } from '../models/FormFields'
import logger from '../config/logger'

export const updateReserveDaysValidation = async () => {
    try {
        logger.info('Starting Reserve Days Management validation update...')

        // Find the Reserve Days Management form
        const reserveDaysForm = await FormFields.findOne({ 
            formName: 'Reserve Days Management' 
        })

        if (!reserveDaysForm) {
            logger.warn('Reserve Days Management form not found')
            return
        }

        // Add business rule for preventing duplicate employee reservations
        const businessRule = {
            id: 'reserveDaysOverlap',
            name: 'Prevent Overlapping Reserve Days',
            description: 'Prevents the same employee from being reserved for overlapping date periods',
            ruleType: 'custom' as const,
            config: {
                employeeField: 'employeeName',
                startDateField: 'startDate',
                endDateField: 'endDate'
            },
            errorMessage: 'This employee already has reserve days scheduled for overlapping dates',
            enabled: true
        }

        // Update the form to include business rules if it doesn't exist
        if (!reserveDaysForm.businessRules) {
            reserveDaysForm.businessRules = []
        }

        // Check if the rule already exists
        const existingRule = reserveDaysForm.businessRules.find(
            (rule: any) => rule.id === 'reserveDaysOverlap'
        )

        if (!existingRule) {
            reserveDaysForm.businessRules.push(businessRule)
            await reserveDaysForm.save()
            logger.info('Successfully added Reserve Days overlap validation rule')
        } else {
            logger.info('Reserve Days overlap validation rule already exists')
        }

        // Also add field-level validation for date range
        reserveDaysForm.sections?.forEach((section: any) => {
            section.fields?.forEach((field: any) => {
                if (field.name === 'startDate' || field.name === 'endDate') {
                    if (!field.validation) {
                        field.validation = {}
                    }
                    // Ensure dates are not in the past
                    field.validation.customValidation = 'futureDate'
                }
                
                if (field.name === 'orderNumber' && field.type === 'text') {
                    if (!field.validation) {
                        field.validation = {}
                    }
                    field.validation.pattern = '^[A-Za-z0-9-]+$'
                    field.errorMessage = 'Order number can only contain letters, numbers, and hyphens'
                }
            })
        })

        await reserveDaysForm.save()
        logger.info('Reserve Days Management form validation updated successfully')

    } catch (error) {
        logger.error('Error updating Reserve Days Management validation:', error)
        throw error
    }
}

// Run migration if called directly
if (require.main === module) {
    updateReserveDaysValidation()
        .then(() => {
            logger.info('Migration completed successfully')
            process.exit(0)
        })
        .catch((error) => {
            logger.error('Migration failed:', error)
            process.exit(1)
        })
}