import { FormSubmissions, FormFields } from '../../models'
import { Request, Response, Router } from 'express'
import mongoose from 'mongoose'
import logger from '../../config/logger'
import { buildDateSearchClauses, buildLabelSearchClauses, buildSortSpec, transformFormData } from '../../utils'

const router = Router()
router.get('/select', async (req: Request, res: Response) => {
    logger.info('GET /formSubmission/select - Request received')
    try {
        const { fieldName, formId } = req.body
        const result = await FormSubmissions.aggregate([
            {
                $match: {
                    formId,
                    isDeleted: false,
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
        const { formName, formId, limit = 10, page = 1, search, searchFields, filters, sortField, sortOrder } = req.query

        const query: Record<string, unknown> = { isDeleted: false }

        if (formName) {
            query.formName = formName
        }

        if (formId) {
            query.formId = formId
        }

        const andClauses: Record<string, unknown>[] = []

        if (search && searchFields) {
            const fields = (searchFields as string).split(',').filter(Boolean)
            if (fields.length > 0) {
                // Fetch form definition once to identify foreign fields
                const formDef = formId
                    ? await FormFields.findById(formId as string).lean()
                    : null
                const allFormFields = formDef?.sections?.flatMap((s: any) => s.fields) ?? []

                const orClauses: Record<string, unknown>[] = []

                for (const f of fields) {
                    const fieldDef = allFormFields.find((fd: any) => fd.name === f)
                    const isForeign = !!(fieldDef?.foreignFormName && (fieldDef?.foreignField || fieldDef?.foreignFields))

                    // Always search .display and each .metadata.* sub-field — covers enhancedSelect/enhancedMultipleSelect
                    // fields stored as { _id, display, metadata } objects in MongoDB
                    orClauses.push({ [`formData.${f}.display`]: { $regex: search, $options: 'i' } })

                    // Search each metadata key (e.g. firstName, lastName, personalNumber)
                    // Also search each metadata sub-field for object-stored values
                    const metadataFields: string[] = fieldDef?.foreignFields ?? (fieldDef?.foreignField ? [fieldDef.foreignField] : [])
                    for (const mf of metadataFields) {
                        // String fields: regex; numeric fields: $toString cast happens server-side via aggregation above
                        orClauses.push({ [`formData.${f}.metadata.${mf}`]: { $regex: search, $options: 'i' } })
                    }

                    if (isForeign) {
                        // Also resolve raw IDs for fields stored as plain ObjectId strings:
                        // find referenced submissions whose foreign field matches, then $in their IDs
                        const referencedFields: string[] = fieldDef.foreignFields?.length
                            ? fieldDef.foreignFields
                            : fieldDef.foreignField
                                ? [fieldDef.foreignField]
                                : []

                        if (referencedFields.length > 0) {
                            // Use aggregation to cast numeric fields to string for partial regex match
                            const addFieldsStage: Record<string, unknown> = {}
                            for (const rf of referencedFields) {
                                addFieldsStage[`__str_${rf}`] = { $toString: `$formData.${rf}` }
                            }
                            // Concatenate all referenced fields into one string so multi-word
                            // searches like "לאה גרינברג" (firstName + lastName) match
                            addFieldsStage['__concat'] = {
                                $toLower: {
                                    $trim: {
                                        input: {
                                            $reduce: {
                                                input: referencedFields.map((rf: string) => ({ $toString: `$formData.${rf}` })),
                                                initialValue: '',
                                                in: { $concat: ['$$value', ' ', '$$this'] },
                                            },
                                        },
                                    },
                                },
                            }
                            const tokens = (search as string).trim().split(/\s+/).filter(Boolean)
                            const tokenMatchStage = tokens.length > 1
                                ? { $and: tokens.map((t: string) => ({ __concat: { $regex: t, $options: 'i' } })) }
                                : { $or: referencedFields.map((rf: string) => ({ [`__str_${rf}`]: { $regex: search, $options: 'i' } })) }
                            const matchingRefs = await FormSubmissions.aggregate([
                                { $match: { formName: fieldDef.foreignFormName, isDeleted: false } },
                                { $addFields: addFieldsStage },
                                { $match: tokenMatchStage },
                                { $project: { _id: 1 } },
                            ])

                            if (matchingRefs.length > 0) {
                                const refIds = matchingRefs.map((r: any) => r._id.toString())
                                orClauses.push({ [`formData.${f}`]: { $in: refIds } })
                                orClauses.push({ [`formData.${f}._id`]: { $in: refIds } })
                            }
                        }
                    } else {
                        if (fieldDef?.type === 'date') {
                            const dateClauses = buildDateSearchClauses(`formData.${f}`, search as string)
                            orClauses.push(...dateClauses)
                        } else if (fieldDef?.type === 'number') {
                            // Numeric fields are stored as numbers — cast to string for regex match
                            orClauses.push({
                                $expr: {
                                    $regexMatch: {
                                        input: { $toString: `$formData.${f}` },
                                        regex: search,
                                        options: 'i',
                                    },
                                },
                            })
                        } else {
                            // Plain text field — regex on the raw value
                            orClauses.push({ [`formData.${f}`]: { $regex: search, $options: 'i' } })

                            // For select/radio fields with options or items, also match by label
                            const choices: { value: unknown; label?: string }[] = [
                                ...(fieldDef?.options ?? []),
                                ...(fieldDef?.items ?? []),
                            ]
                            orClauses.push(...buildLabelSearchClauses(`formData.${f}`, search as string, choices))
                        }
                    }
                }

                // Multi-token search across plain text fields (e.g. "אבנר דויד רוסלר" spanning firstName + lastName)
                const tokens = (search as string).trim().split(/\s+/).filter(Boolean)
                if (tokens.length > 1) {
                    const plainTextFields = fields.filter((f) => {
                        const fd = allFormFields.find((fd: any) => fd.name === f)
                        return !fd?.foreignFormName && fd?.type !== 'date' && fd?.type !== 'number'
                    })
                    if (plainTextFields.length > 1) {
                        // Build a concatenated string of all plain text fields and match each token against it
                        const concatExpr = {
                            $toLower: {
                                $trim: {
                                    input: {
                                        $reduce: {
                                            input: plainTextFields.map((f: string) => ({
                                                $ifNull: [{ $toString: `$formData.${f}` }, ''],
                                            })),
                                            initialValue: '',
                                            in: { $concat: ['$$value', ' ', '$$this'] },
                                        },
                                    },
                                },
                            },
                        }
                        orClauses.push({
                            $expr: {
                                $and: tokens.map((t: string) => ({
                                    $regexMatch: {
                                        input: concatExpr,
                                        regex: t,
                                        options: 'i',
                                    },
                                })),
                            },
                        })
                    }
                }

                if (orClauses.length > 0) {
                    andClauses.push({ $or: orClauses })
                }
            }
        }

        if (filters) {
            const parsed = JSON.parse(filters as string) as Record<string, unknown>
            for (const [fieldName, value] of Object.entries(parsed)) {
                if (value === undefined || value === 'all' || value === '') continue
                if (Array.isArray(value) && value.length === 0) continue

                if (Array.isArray(value)) {
                    andClauses.push({ [`formData.${fieldName}`]: { $in: value } })
                } else if (typeof value === 'boolean') {
                    andClauses.push({ [`formData.${fieldName}`]: value })
                } else {
                    andClauses.push({
                        [`formData.${fieldName}`]: {
                            $regex: `^${value}$`,
                            $options: 'i',
                        },
                    })
                }
            }
        }

        if (andClauses.length > 0) {
            query.$and = andClauses
        }

        logger.info('Query filters:', { formName, formId, search, searchFields, filters })
        const skip = (Number(page) - 1) * Number(limit)

        const sortSpec = buildSortSpec(sortField as string | undefined, sortOrder as string | undefined)

        const [rawForms, totalCount] = await Promise.all([
            FormSubmissions.find(query)
                .sort(sortSpec)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            FormSubmissions.countDocuments(query),
        ])

        const forms = await Promise.all(
            rawForms.map(async (form) => ({
                ...form,
                formData: await transformFormData(form.formData, String(form.formId)),
            }))
        )

        const totalPages = Math.ceil(totalCount / Number(limit)) || 1
        const actualPage = Math.min(Number(page), totalPages)

        res.status(200).json({
            forms,
            pagination: {
                page: actualPage,
                limit: Number(limit),
                total: totalCount,
                pages: totalPages,
            },
        })
    } catch (error) {
        logger.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})

router.get('/metrics/:formId', async (req: Request, res: Response) => {
    logger.info(`GET /formSubmission/metrics/${req.params.formId} - Request received`)
    try {
        const { formId } = req.params

        const formDefinition = await FormFields.findById(formId)
        if (!formDefinition || !formDefinition.metrics?.length) {
            return void res.status(200).json([])
        }

        const baseMatch = { formId: new mongoose.Types.ObjectId(formId), isDeleted: false }
        const totalCount = await FormSubmissions.countDocuments(baseMatch)

        const results = await Promise.all(
            formDefinition.metrics.map(async (metric) => {
                const { calculation } = metric
                let value = 0

                if (calculation.type === 'total') {
                    value = totalCount
                } else if (calculation.type === 'filtered' && calculation.field) {
                    const fieldPath = `formData.${calculation.field}`
                    let matchValue: unknown = calculation.value

                    // Coerce string booleans to actual booleans for switch fields
                    if (matchValue === 'true') matchValue = true
                    else if (matchValue === 'false') matchValue = false

                    const op = calculation.operator ?? '='
                    let fieldMatch: Record<string, unknown>

                    if (op === '=') fieldMatch = { [fieldPath]: matchValue }
                    else if (op === '!=') fieldMatch = { [fieldPath]: { $ne: matchValue } }
                    else if (op === '>') fieldMatch = { [fieldPath]: { $gt: matchValue } }
                    else if (op === '<') fieldMatch = { [fieldPath]: { $lt: matchValue } }
                    else if (op === '>=') fieldMatch = { [fieldPath]: { $gte: matchValue } }
                    else if (op === '<=') fieldMatch = { [fieldPath]: { $lte: matchValue } }
                    else if (op === 'includes') fieldMatch = { [fieldPath]: { $in: [matchValue] } }
                    else if (op === 'excludes') fieldMatch = { [fieldPath]: { $nin: [matchValue] } }
                    else fieldMatch = { [fieldPath]: matchValue }

                    value = await FormSubmissions.countDocuments({ ...baseMatch, ...fieldMatch })
                } else if (calculation.type === 'aggregated' && calculation.aggregateField) {
                    value = totalCount
                }

                return {
                    id: metric.id,
                    title: metric.title,
                    value,
                    icon: metric.icon,
                    color: metric.color,
                }
            })
        )

        res.status(200).json(results)
    } catch (error) {
        logger.error('Error calculating metrics:', error)
        res.status(500).json({ message: 'Error calculating metrics', error })
    }
})

router.get('/detail/:submissionId', async (req: Request, res: Response) => {
    logger.info(`GET /formSubmission/detail/${req.params.submissionId} - Request received`)
    try {
        const { submissionId } = req.params

        const form = await FormSubmissions.findOne({ _id: submissionId, isDeleted: false }).lean() as (Record<string, unknown> & { createdAt: Date; updatedAt: Date }) | null
        if (!form) {
            return void res.status(404).json({ message: 'Submission not found' })
        }

        const transformedFormData = await transformFormData(form.formData, String(form.formId))

        res.status(200).json({
            _id: form._id,
            formId: form.formId,
            formName: form.formName,
            formData: transformedFormData,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
        })
    } catch (error) {
        logger.error('Error getting submission detail:', error)
        res.status(500).json({ message: 'Error getting submission detail', error })
    }
})

router.get('/:id', async (req: Request, res: Response) => {
    logger.info(`GET /formSubmission/${req.params.id} - Request received`)
    try {
        const id = req.params.id

        const forms = await FormSubmissions.find({ formId: id, isDeleted: false })

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
