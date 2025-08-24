import { Request, Response, Router } from 'express'
import { FormSubmissions, FormFields } from '../../models'
import logger from '../../config/logger'
import mongoose from 'mongoose'

const router = Router()

import { validate, commonSchemas, asyncHandler } from '../../middleware'

const transformFormData = async (formData: any, formId: string) => {
    try {
        logger.info(`Transforming form data for formId: ${formId}`)

        // Validate inputs
        if (!formData || typeof formData !== 'object') {
            logger.warn('Invalid formData provided')
            return formData
        }

        if (!formId || !mongoose.Types.ObjectId.isValid(formId)) {
            logger.warn(`Invalid formId provided: ${formId}`)
            return formData
        }

        // Get form field definitions
        const formDefinition = await FormFields.findById(formId)
        if (!formDefinition) {
            logger.warn(`Form definition not found for formId: ${formId}`)
            return formData
        }

        logger.info(`Found form definition: ${formDefinition.formName}`)

        // Skip transformation if no sections
        if (!formDefinition.sections || formDefinition.sections.length === 0) {
            logger.info('No sections found in form definition')
            return formData
        }

        const transformedData = { ...formData }

        // Flatten all fields from all sections
        const allFields = formDefinition.sections.flatMap(
            (section) => section.fields || []
        )

        logger.info(`Found ${allFields.length} total fields`)

        // Filter only fields with foreign relationships that have values
        const foreignFields = allFields.filter(
            (field) =>
                field &&
                field.foreignFormName &&
                field.foreignField &&
                field.name &&
                formData[field.name] !== undefined &&
                formData[field.name] !== null &&
                formData[field.name] !== ''
        )

        logger.info(`Found ${foreignFields.length} foreign fields with values`)

        if (foreignFields.length === 0) {
            logger.info('No foreign fields to transform')
            return formData
        }

        // Process each foreign field
        for (const field of foreignFields) {
            try {
                logger.info(`Processing field: ${field.name} (${field.type})`)
                const fieldValue = formData[field.name]

                if (
                    field.type === 'select' ||
                    field.type === 'selectAutocomplete'
                ) {
                    // Single selection
                    if (
                        typeof fieldValue === 'string' &&
                        mongoose.Types.ObjectId.isValid(fieldValue)
                    ) {
                        logger.info(
                            `Looking up single value for ${field.name}: ${fieldValue}`
                        )
                        const doc = await FormSubmissions.findOne({
                            _id: fieldValue,
                            formName: field.foreignFormName,
                        }).lean()

                        const foreignField = field.foreignField
                        if (
                            doc?.formData &&
                            foreignField &&
                            doc.formData[foreignField]
                        ) {
                            transformedData[field.name] = {
                                _id: fieldValue,
                                display: doc.formData[foreignField],
                            }
                            logger.info(
                                `Transformed ${field.name}: ${doc.formData[foreignField]}`
                            )
                        } else {
                            logger.warn(
                                `No data found for ${field.name} with id ${fieldValue}`
                            )
                        }
                    }
                } else if (field.type === 'multipleSelect') {
                    // Multiple selection
                    if (Array.isArray(fieldValue)) {
                        const validIds = fieldValue.filter(
                            (id) =>
                                typeof id === 'string' &&
                                mongoose.Types.ObjectId.isValid(id)
                        )

                        if (validIds.length > 0) {
                            logger.info(
                                `Looking up multiple values for ${field.name}: ${validIds}`
                            )
                            const docs = await FormSubmissions.find({
                                _id: { $in: validIds },
                                formName: field.foreignFormName,
                            }).lean()

                            const foreignField = field.foreignField
                            transformedData[field.name] = validIds.map((id) => {
                                const doc = docs.find(
                                    (d) => d._id.toString() === id
                                )
                                return {
                                    _id: id,
                                    display:
                                        (doc?.formData &&
                                            foreignField &&
                                            doc.formData[foreignField]) ||
                                        id,
                                }
                            })
                            logger.info(
                                `Transformed ${field.name} with ${docs.length} matches`
                            )
                        }
                    }
                } else if (field.type === 'radio') {
                    // Radio selection
                    if (
                        typeof fieldValue === 'string' &&
                        mongoose.Types.ObjectId.isValid(fieldValue)
                    ) {
                        logger.info(
                            `Looking up radio value for ${field.name}: ${fieldValue}`
                        )
                        const doc = await FormSubmissions.findOne({
                            _id: fieldValue,
                            formName: field.foreignFormName,
                        }).lean()

                        const foreignField = field.foreignField
                        if (
                            doc?.formData &&
                            foreignField &&
                            doc.formData[foreignField]
                        ) {
                            transformedData[field.name] = {
                                _id: fieldValue,
                                display: doc.formData[foreignField],
                            }
                            logger.info(
                                `Transformed ${field.name}: ${doc.formData[foreignField]}`
                            )
                        } else {
                            logger.warn(
                                `No data found for radio ${field.name} with id ${fieldValue}`
                            )
                        }
                    }
                }
            } catch (fieldError) {
                logger.error(
                    `Error processing field ${field.name}:`,
                    fieldError
                )
                // Continue with other fields
            }
        }

        logger.info('Form data transformation completed successfully')
        return transformedData
    } catch (error) {
        logger.error('Error transforming form data:', error)
        return formData
    }
}

router.post('/', 
    validate(commonSchemas.formSubmission),
    asyncHandler(async (req: Request, res: Response) => {
        const { formData, formId, formName } = req.body

        logger.info(`Received form data:`, { formData, formId, formName })

        // Transform the form data to include both reference and display values
        let transformedFormData = formData
        try {
            transformedFormData = await transformFormData(formData, formId)
            logger.info('Transformation completed successfully')
        } catch (transformError) {
            logger.error(
                'Transformation failed, using original data:',
                transformError
            )
            transformedFormData = formData
        }

        logger.info('Creating form submission with data:', transformedFormData)

        const form = await FormSubmissions.create({
            formData: transformedFormData,
            formId,
            formName,
        })

        await form.save()
        logger.info('Form submission saved successfully')
        res.status(201).json({ form })
    })
)

export { router as CreateFormSubmissionRouter }
