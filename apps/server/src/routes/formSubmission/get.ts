import { FormSubmissions, FormFields } from '../../models'
import { Request, Response, Router } from 'express'
import mongoose from 'mongoose'
import logger from '../../config/logger'

const transformFormData = async (formData: any, formId: string) => {
    try {
        // Get form field definitions to understand foreign relationships
        const formDefinition = await FormFields.findById(formId)
        if (!formDefinition) return formData

        const transformedData = { ...formData }

        // Flatten all fields from all sections using flatMap
        const allFields = formDefinition.sections?.flatMap(section => section.fields) || []

        // Filter only fields with foreign relationships that have values
        const foreignFields = allFields.filter(field =>
            (field.foreignFormName && field.foreignField && formData[field.name]) ||
            (field.foreignFormName && field.foreignFields && formData[field.name])
        )

        if (foreignFields.length === 0) return formData

        // Process each foreign field
        for (const field of foreignFields) {
            const fieldValue = formData[field.name]

            if (field.type === 'select' || field.type === 'selectAutocomplete') {
                // Single selection
                if (typeof fieldValue === 'string' && mongoose.Types.ObjectId.isValid(fieldValue)) {
                    const doc = await FormSubmissions.findOne({
                        _id: fieldValue,
                        formName: field.foreignFormName
                    }).lean()

                    const foreignField = field.foreignField
                    if (doc?.formData && foreignField && doc.formData[foreignField]) {
                        transformedData[field.name] = {
                            _id: fieldValue,
                            display: doc.formData[foreignField]
                        }
                    }
                }
            } else if (field.type === 'multipleSelect') {
                // Multiple selection
                if (Array.isArray(fieldValue)) {
                    const validIds = fieldValue.filter(id =>
                        typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)
                    )

                    if (validIds.length > 0) {
                        const docs = await FormSubmissions.find({
                            _id: { $in: validIds },
                            formName: field.foreignFormName
                        }).lean()

                        transformedData[field.name] = validIds.map(id => {
                            const doc = docs.find(d => d._id.toString() === id)
                            return {
                                _id: id,
                                display: (doc?.formData && field.foreignField && doc.formData[field.foreignField]) || id
                            }
                        })
                    }
                }
            } else if (field.type === 'radio') {
                // Radio selection
                if (typeof fieldValue === 'string' && mongoose.Types.ObjectId.isValid(fieldValue)) {
                    const doc = await FormSubmissions.findOne({
                        _id: fieldValue,
                        formName: field.foreignFormName
                    }).lean()

                    const foreignField = field.foreignField
                    if (doc?.formData && foreignField && doc.formData[foreignField]) {
                        transformedData[field.name] = {
                            _id: fieldValue,
                            display: doc.formData[foreignField]
                        }
                    }
                }
            } else if (field.type === 'enhancedSelect') {
                // Enhanced single selection with multiple foreign fields
                if (typeof fieldValue === 'string' && mongoose.Types.ObjectId.isValid(fieldValue)) {
                    const doc = await FormSubmissions.findOne({
                        _id: fieldValue,
                        formName: field.foreignFormName
                    }).lean()

                    if (doc?.formData && field.foreignFields) {
                        // Build metadata object
                        const metadata: any = {}
                        field.foreignFields.forEach((fieldName: string) => {
                            metadata[fieldName] = doc.formData[fieldName]
                        })

                        // Build display string from all foreign fields, filtering out booleans and empty values
                        const displayParts = field.foreignFields
                            .map(fieldName => doc.formData[fieldName])
                            .filter(value =>
                                value !== null &&
                                value !== undefined &&
                                value !== '' &&
                                typeof value !== 'boolean'
                            )
                            .map(value => String(value))

                        if (displayParts.length > 0) {
                            transformedData[field.name] = {
                                _id: fieldValue,
                                display: displayParts.join(' '),
                                metadata
                            }
                        }
                    }
                }
            } else if (field.type === 'enhancedMultipleSelect') {
                // Enhanced multiple selection with multiple foreign fields
                if (Array.isArray(fieldValue)) {
                    const validIds = fieldValue.filter(id =>
                        typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)
                    )

                    if (validIds.length > 0) {
                        const docs = await FormSubmissions.find({
                            _id: { $in: validIds },
                            formName: field.foreignFormName
                        }).lean()

                        transformedData[field.name] = validIds.map(id => {
                            const doc = docs.find(d => d._id.toString() === id)
                            if (doc?.formData && field.foreignFields) {
                                const displayParts = field.foreignFields
                                    .map(fieldName => doc.formData[fieldName])
                                    .filter(value =>
                                        value !== null &&
                                        value !== undefined &&
                                        value !== '' &&
                                        typeof value !== 'boolean'
                                    )
                                    .map(value => String(value))

                                return {
                                    _id: id,
                                    display: displayParts.length > 0 ? displayParts.join(' ') : id
                                }
                            }
                            return {
                                _id: id,
                                display: id
                            }
                        })
                    }
                }
            }
        }

        return transformedData
    } catch (error) {
        logger.error('Error transforming form data:', error)
        return formData
    }
}

const router = Router()
router.get('/select', async (req: Request, res: Response) => {
    logger.info('GET /formSubmission/select - Request received')
    try {
        const { fieldName, formId } = req.body
        const result = await FormSubmissions.aggregate([
            {
                $match: {
                    formId,
                },
            },
            {
                $project: {
                    value: { $toString: '$_id' },
                    label: { $ifNull: [`$formData.${fieldName}`, ''] },
                    _id: 0,
                },
            },
            {
                $match: {
                    label: { $ne: '' },
                },
            },
        ])

        res.status(200).json(result)
    } catch (error) {
        logger.error('Error getting data:', error)
        res.status(500).json({ message: 'Error getting data', error })
    }
})

router.get('/', async (req: Request, res: Response) => {
    logger.info('GET /formSubmission - Request received')
    try {
        const { formName, formId, limit = 100, page = 1 } = req.query
        
        // Build query object
        const query: any = {}
        
        if (formName) {
            query.formName = formName
        }
        
        if (formId) {
            query.formId = formId
        }
        
        // Log the query for debugging
        logger.info('Query filters:', { formName, formId, query })
        
        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit)
        
        // Execute query with pagination
        const [forms, totalCount] = await Promise.all([
            FormSubmissions.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            FormSubmissions.countDocuments(query)
        ])
        
        res.status(200).json({ 
            forms,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / Number(limit))
            }
        })
    } catch (error) {
        logger.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})

router.get('/:id', async (req: Request, res: Response) => {
    logger.info(`GET /formSubmission/${req.params.id} - Request received`)
    try {
        const id = req.params.id

        const forms = await FormSubmissions.find({ formId: id })

        // Transform each form's data to include display values for foreign fields
        const transformedForms = await Promise.all(
            forms.map(async (form) => ({
                ...form.toObject(),
                formData: await transformFormData(form.formData, id)
            }))
        )

        res.status(200).json({ forms: transformedForms })
    } catch (error) {
        logger.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})
export { router as GetFormSubmissionsRouter }
