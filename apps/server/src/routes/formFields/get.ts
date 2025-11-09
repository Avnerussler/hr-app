import express, { Request, Response } from 'express'
import { FormFields, FormSubmissions } from '../../models'
import mongoose from 'mongoose'
import logger from '../../config/logger'
const router = express.Router()

router.get('/partialData', async (req: Request, res: Response) => {
    try {
        logger.info('Getting partialData of forms')
        const forms = await FormFields.find().select([
            'formName',
            '_id',
            'description',
            'icon',
            'overviewFields',
            'displayName',
        ])
        logger.info('Got partialData of forms')
        res.status(200).json({ forms })
    } catch (error) {
        logger.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})

// New endpoint for fetching specific options by IDs
router.post(
    '/options/:formId/:fieldName/byIds',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { formId, fieldName } = req.params
            const { ids } = req.body

            if (!Array.isArray(ids) || ids.length === 0) {
                res.status(200).json({ options: [] })
                return
            }

            logger.info(
                `Getting specific options for field ${fieldName}, ids: ${ids.length}`
            )

            // Get the form field configuration
            const formConfig = await FormFields.findById(formId)
            if (!formConfig) {
                res.status(404).json({ message: 'Form not found' })
                return
            }

            // Find the field configuration
            let fieldConfig: any = null
            for (const section of formConfig.sections) {
                const field = section.fields.find(
                    (f: any) => f.name === fieldName
                )
                if (field) {
                    fieldConfig = field
                    break
                }
            }

            if (!fieldConfig || !fieldConfig.foreignFormName) {
                res.status(404).json({
                    message: 'Field not found or not a foreign field',
                })
                return
            }

            // Convert string IDs to ObjectIds
            const objectIds = ids
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id))

            // Fetch the documents
            const results = await FormSubmissions.find({
                _id: { $in: objectIds },
                formName: fieldConfig.foreignFormName,
                isDeleted: false,
            })
                .select('_id formData')
                .lean()

            // Format options based on field type
            const options = results.map((doc: any) => {
                if (
                    (fieldConfig.type === 'enhancedMultipleSelect' ||
                        fieldConfig.type === 'enhancedSelect') &&
                    fieldConfig.foreignFields
                ) {
                    // Build label from multiple fields
                    const label = fieldConfig.foreignFields
                        .map((field: string) => doc.formData[field])
                        .filter(Boolean)
                        .join(' ')

                    // Build metadata object
                    const metadata: any = {}
                    fieldConfig.foreignFields.forEach((field: string) => {
                        metadata[field] = doc.formData[field]
                    })

                    return {
                        value: doc._id.toString(),
                        label,
                        name: fieldName,
                        metadata,
                    }
                } else {
                    // Standard select/multipleSelect
                    return {
                        value: doc._id.toString(),
                        label: doc.formData[fieldConfig.foreignField] || '',
                        name: fieldName,
                    }
                }
            })

            res.status(200).json({ options })
        } catch (error) {
            logger.error('Error getting options by IDs:', error)
            res.status(500).json({
                message: 'Error getting options by IDs',
                error,
            })
        }
    }
)

// New endpoint for searching and paginating options for a specific field
router.get(
    '/options/:formId/:fieldName',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { formId, fieldName } = req.params
            const {
                page = '1',
                limit = '100',
                search: searchParam = '',
            } = req.query
            const search = String(searchParam)

            const pageNum = parseInt(page as string)
            const limitNum = parseInt(limit as string)
            const skip = (pageNum - 1) * limitNum

            logger.info(
                `Getting paginated options for field ${fieldName}, page: ${pageNum}, limit: ${limitNum}, search: "${search}"`
            )

            // First, get the form field configuration
            const formConfig = await FormFields.findById(formId)
            if (!formConfig) {
                res.status(404).json({ message: 'Form not found' })
                return
            }

            // Find the field configuration
            let fieldConfig: any = null
            for (const section of formConfig.sections) {
                const field = section.fields.find(
                    (f: any) => f.name === fieldName
                )
                if (field) {
                    fieldConfig = field
                    break
                }
            }

            if (!fieldConfig || !fieldConfig.foreignFormName) {
                res.status(404).json({
                    message: 'Field not found or not a foreign field',
                })
                return
            }

            // Build search query dynamically based on foreignFields
            const searchQuery: any = {
                formName: fieldConfig.foreignFormName,
                isDeleted: false,
            }

            if (
                search &&
                fieldConfig.foreignFields &&
                fieldConfig.foreignFields.length > 0
            ) {
                // Search across all foreign fields (both string and numeric)
                const searchConditions = fieldConfig.foreignFields.flatMap(
                    (fieldName: string) => {
                        const conditions: any[] = [
                            // String regex search (case-insensitive)
                            {
                                [`formData.${fieldName}`]: {
                                    $regex: search,
                                    $options: 'i',
                                },
                            },
                        ]

                        // If search term is numeric, also search for partial matches in numeric fields
                        const numericSearch = Number(search)
                        if (!isNaN(numericSearch) && search.trim() !== '') {
                            // Use $expr with $toString to search numeric fields as strings for partial matches
                            conditions.push({
                                $expr: {
                                    $regexMatch: {
                                        input: {
                                            $toString: `$formData.${fieldName}`,
                                        },
                                        regex: search,
                                        options: 'i',
                                    },
                                },
                            })
                        }

                        // If search term is boolean-like, also search as boolean
                        if (search.toLowerCase() === 'true') {
                            conditions.push({
                                [`formData.${fieldName}`]: true,
                            })
                            conditions.push({
                                [`formData.${fieldName}`]: 'true',
                            })
                        } else if (search.toLowerCase() === 'false') {
                            conditions.push({
                                [`formData.${fieldName}`]: false,
                            })
                            conditions.push({
                                [`formData.${fieldName}`]: 'false',
                            })
                        }

                        return conditions
                    }
                )

                searchQuery.$or = searchConditions
            } else if (search && fieldConfig.foreignField) {
                // Fallback to single foreignField
                const conditions: any[] = [
                    {
                        [`formData.${fieldConfig.foreignField}`]: {
                            $regex: search,
                            $options: 'i',
                        },
                    },
                ]

                // If search term is numeric, also search for partial matches in numeric fields
                const numericSearch = Number(search)
                if (!isNaN(numericSearch) && search.trim() !== '') {
                    conditions.push({
                        $expr: {
                            $regexMatch: {
                                input: {
                                    $toString: `$formData.${fieldConfig.foreignField}`,
                                },
                                regex: search,
                                options: 'i',
                            },
                        },
                    })
                }

                // If search term is boolean-like, also search as boolean
                if (search.toLowerCase() === 'true') {
                    conditions.push({
                        [`formData.${fieldConfig.foreignField}`]: true,
                    })
                    conditions.push({
                        [`formData.${fieldConfig.foreignField}`]: 'true',
                    })
                } else if (search.toLowerCase() === 'false') {
                    conditions.push({
                        [`formData.${fieldConfig.foreignField}`]: false,
                    })
                    conditions.push({
                        [`formData.${fieldConfig.foreignField}`]: 'false',
                    })
                }

                if (conditions.length > 1) {
                    searchQuery.$or = conditions
                } else {
                    Object.assign(searchQuery, conditions[0])
                }
            }

            // Get total count
            const total = await FormSubmissions.countDocuments(searchQuery)

            // Get paginated results
            const results = await FormSubmissions.find(searchQuery)
                .select('_id formData')
                .skip(skip)
                .limit(limitNum)
                .lean()

            // Format options based on field type
            const options = results.map((doc: any) => {
                if (
                    (fieldConfig.type === 'enhancedMultipleSelect' ||
                        fieldConfig.type === 'enhancedSelect') &&
                    fieldConfig.foreignFields
                ) {
                    // Build label from multiple fields
                    const label = fieldConfig.foreignFields
                        .map((field: string) => doc.formData[field])
                        .filter(Boolean)
                        .join(' ')

                    // Build metadata object
                    const metadata: any = {}
                    fieldConfig.foreignFields.forEach((field: string) => {
                        metadata[field] = doc.formData[field]
                    })

                    return {
                        value: doc._id.toString(),
                        label,
                        name: fieldName,
                        metadata,
                    }
                } else {
                    // Standard select/multipleSelect
                    return {
                        value: doc._id.toString(),
                        label: doc.formData[fieldConfig.foreignField] || '',
                        name: fieldName,
                    }
                }
            })

            res.status(200).json({
                options,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    hasMore: pageNum * limitNum < total,
                },
            })
        } catch (error) {
            logger.error('Error getting paginated options:', error)
            res.status(500).json({
                message: 'Error getting paginated options',
                error,
            })
        }
    }
)

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { limit = '100' } = req.query // Default to 100 options per field
        const optionsLimit = parseInt(limit as string)

        logger.info(
            `Getting form with ID: ${id}, options limit: ${optionsLimit}`
        )
        // Simplified pipeline - fetch form and process options in JavaScript
        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            { $unwind: '$sections' },
            { $unwind: '$sections.fields' },

            // Lookup for foreign data
            {
                $lookup: {
                    from: 'form_submissions',
                    let: {
                        foreignFormName: '$sections.fields.foreignFormName',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                '$formName',
                                                '$$foreignFormName',
                                            ],
                                        },
                                        { $eq: ['$isDeleted', false] },
                                    ],
                                },
                            },
                        },
                        { $limit: optionsLimit },
                    ],
                    as: 'foreignData',
                },
            },

            // Get total count
            {
                $lookup: {
                    from: 'form_submissions',
                    let: {
                        foreignFormName: '$sections.fields.foreignFormName',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: [
                                                '$formName',
                                                '$$foreignFormName',
                                            ],
                                        },
                                        { $eq: ['$isDeleted', false] },
                                    ],
                                },
                            },
                        },
                        { $count: 'total' },
                    ],
                    as: 'foreignDataCount',
                },
            },

            // Group fields back per section
            {
                $group: {
                    _id: {
                        sectionId: '$sections.id',
                        sectionName: '$sections.name',
                    },
                    fields: {
                        $push: {
                            _id: {
                                $ifNull: [
                                    '$sections.fields._id',
                                    {
                                        $concat: [
                                            { $toString: '$_id' },
                                            '_',
                                            '$sections.id',
                                            '_',
                                            '$sections.fields.name',
                                        ],
                                    },
                                ],
                            },
                            name: '$sections.fields.name',
                            type: '$sections.fields.type',
                            label: '$sections.fields.label',
                            placeholder: '$sections.fields.placeholder',
                            required: '$sections.fields.required',
                            defaultValue: '$sections.fields.defaultValue',
                            options: '$sections.fields.options',
                            items: { $ifNull: ['$sections.fields.items', []] },
                            errorMessage: {
                                $ifNull: ['$sections.fields.errorMessage', ''],
                            },
                            foreignFormName: '$sections.fields.foreignFormName',
                            foreignField: '$sections.fields.foreignField',
                            foreignFields: '$sections.fields.foreignFields',
                            foreignData: '$foreignData',
                            foreignDataCount: '$foreignDataCount',
                        },
                    },
                    formName: { $first: '$formName' },
                    metrics: { $first: '$metrics' },
                    overviewFields: { $first: '$overviewFields' },
                    filters: { $first: '$filters' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },

            // Group sections back into array
            {
                $group: {
                    _id: null,
                    formName: { $first: '$formName' },
                    metrics: { $first: '$metrics' },
                    overviewFields: { $first: '$overviewFields' },
                    filters: { $first: '$filters' },
                    sections: {
                        $push: {
                            id: '$_id.sectionId',
                            name: '$_id.sectionName',
                            fields: '$fields',
                        },
                    },
                },
            },

            {
                $project: {
                    _id: 0,
                    formName: 1,
                    sections: 1,
                    metrics: 1,
                    overviewFields: 1,
                    filters: 1,
                },
            },
        ]

        const result = await FormFields.aggregate(pipeline)

        if (!result.length) {
            res.status(204).json({ message: 'Form not found' })
            return
        }

        // Post-process options in JavaScript (more reliable than complex aggregation)
        const form = result[0]
        for (const section of form.sections) {
            for (const field of section.fields) {
                // Check if this is a select field with foreign data
                const isSelectType = [
                    'select',
                    'selectAutocomplete',
                    'multipleSelect',
                    'enhancedMultipleSelect',
                ].includes(field.type)

                if (
                    isSelectType &&
                    field.foreignFormName &&
                    field.foreignData &&
                    field.foreignData.length > 0
                ) {
                    // Process foreign data into options
                    if (
                        field.type === 'enhancedMultipleSelect' &&
                        field.foreignFields
                    ) {
                        // Enhanced select with multiple fields
                        field.options = field.foreignData.map((doc: any) => {
                            const label = field.foreignFields
                                .map((fieldName: string) => doc.formData[fieldName])
                                .filter(Boolean)
                                .join(' ')

                            const metadata: any = {}
                            field.foreignFields.forEach((fieldName: string) => {
                                metadata[fieldName] = doc.formData[fieldName]
                            })

                            return {
                                value: doc._id.toString(),
                                label,
                                name: field.name,
                                metadata,
                            }
                        })
                    } else if (field.foreignField) {
                        // Standard select with single field
                        field.options = field.foreignData.map((doc: any) => ({
                            value: doc._id.toString(),
                            label: doc.formData[field.foreignField] || '',
                            name: field.name,
                        }))
                    }

                    // Set pagination info
                    if (
                        field.foreignDataCount &&
                        field.foreignDataCount.length > 0
                    ) {
                        const total = field.foreignDataCount[0].total
                        field.optionsPagination = {
                            total,
                            limit: optionsLimit,
                            hasMore: total > optionsLimit,
                        }
                    }
                }

                // Ensure options is always an array
                if (!field.options) {
                    field.options = []
                }

                // Clean up temporary fields
                delete field.foreignData
                delete field.foreignDataCount
            }
        }

        res.status(200).send(form)
    } catch (error) {
        logger.error('Error getting form:', error)
        res.status(500).json({ message: 'Error getting form', error })
    }
})

export { router as GetFormFieldsRouter }
