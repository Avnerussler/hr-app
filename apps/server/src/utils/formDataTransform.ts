import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import mongoose from 'mongoose'

// ISO date string pattern: "YYYY-MM-DDTHH:mm:ss.sssZ" or "YYYY-MM-DD"
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/

/**
 * Coerce form field values to their correct DB types after JSON deserialization.
 * JSON.stringify turns Date objects into ISO strings — this converts them back.
 * Also coerces boolean strings for radio/switch fields.
 */
export const coerceFormDataTypes = async (
    formData: Record<string, unknown>,
    formId: string
): Promise<Record<string, unknown>> => {
    if (!mongoose.Types.ObjectId.isValid(formId)) return formData
    const formDef = await FormFields.findById(formId).lean()
    if (!formDef) return formData
    const allFields = formDef.sections?.flatMap((s: any) => s.fields ?? []) ?? []
    const result = { ...formData }
    for (const field of allFields) {
        const value = result[field.name]
        if (value === undefined || value === null || value === '') continue
        if (field.type === 'date' && typeof value === 'string' && ISO_DATE_RE.test(value)) {
            const d = new Date(value)
            if (!isNaN(d.getTime())) result[field.name] = d
        }
        if ((field.type === 'radio' || field.type === 'switch') && (value === 'true' || value === 'false')) {
            const items: { value: unknown }[] = field.items ?? []
            if (items.some((i) => i.value === 'true' || i.value === 'false')) {
                result[field.name] = value === 'true'
            }
        }
    }
    return result
}

/**
 * Transform form data to include display values for foreign references
 * Handles various field types: select, multipleSelect, enhancedSelect, enhancedMultipleSelect, radio
 *
 * @param formData - Raw form data with IDs
 * @param formId - Form definition ID
 * @returns Transformed form data with display values and metadata
 */
export const transformFormData = async (formData: any, formId: string) => {
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
                (field.foreignField || field.foreignFields) &&
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
                } else if (field.type === 'enhancedSelect') {
                    // Enhanced single selection with multiple foreign fields
                    if (
                        typeof fieldValue === 'string' &&
                        mongoose.Types.ObjectId.isValid(fieldValue)
                    ) {
                        logger.info(
                            `Looking up enhanced select value for ${field.name}: ${fieldValue}`
                        )
                        const doc = await FormSubmissions.findOne({
                            _id: fieldValue,
                            formName: field.foreignFormName,
                        }).lean()

                        if (doc?.formData && field.foreignFields) {
                            // Build metadata object
                            const metadata: any = {}
                            field.foreignFields.forEach((fieldName: string) => {
                                metadata[fieldName] = doc.formData[fieldName]
                            })

                            // Build display string from all foreign fields, filtering out booleans and empty values
                            const displayParts = field.foreignFields
                                .map((fieldName) => doc.formData[fieldName])
                                .filter(
                                    (value) =>
                                        value !== null &&
                                        value !== undefined &&
                                        value !== '' &&
                                        typeof value !== 'boolean'
                                )
                                .map((value) => String(value))

                            if (displayParts.length > 0) {
                                transformedData[field.name] = {
                                    _id: fieldValue,
                                    display: displayParts.join(' '),
                                    metadata,
                                }
                                logger.info(
                                    `Transformed ${
                                        field.name
                                    }: ${displayParts.join(' ')}`
                                )
                            }
                        } else {
                            logger.warn(
                                `No data found for enhanced select ${field.name} with id ${fieldValue}`
                            )
                        }
                    }
                } else if (field.type === 'enhancedMultipleSelect') {
                    // Enhanced multiple selection with multiple foreign fields
                    if (Array.isArray(fieldValue)) {
                        const validIds = fieldValue.filter(
                            (id) =>
                                typeof id === 'string' &&
                                mongoose.Types.ObjectId.isValid(id)
                        )

                        if (validIds.length > 0) {
                            logger.info(
                                `Looking up enhanced multiple select values for ${field.name}: ${validIds}`
                            )
                            const docs = await FormSubmissions.find({
                                _id: { $in: validIds },
                                formName: field.foreignFormName,
                            }).lean()

                            transformedData[field.name] = validIds.map((id) => {
                                const doc = docs.find(
                                    (d) => d._id.toString() === id
                                )
                                if (doc?.formData && field.foreignFields) {
                                    const displayParts = field.foreignFields
                                        .map(
                                            (fieldName) =>
                                                doc.formData[fieldName]
                                        )
                                        .filter(
                                            (value) =>
                                                value !== null &&
                                                value !== undefined &&
                                                value !== '' &&
                                                typeof value !== 'boolean'
                                        )
                                        .map((value) => String(value))

                                    return {
                                        _id: id,
                                        display:
                                            displayParts.length > 0
                                                ? displayParts.join(' ')
                                                : id,
                                    }
                                }
                                return {
                                    _id: id,
                                    display: id,
                                }
                            })
                            logger.info(
                                `Transformed ${field.name} with ${docs.length} matches`
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
