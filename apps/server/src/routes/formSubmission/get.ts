import { FormSubmissions } from '../../models'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'

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
        res.status(200).json({ forms })
    } catch (error) {
        logger.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})
export { router as GetFormSubmissionsRouter }
