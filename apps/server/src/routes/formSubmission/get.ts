import { FormSubmissions } from '../../models'
import { Request, Response, Router } from 'express'

const router = Router()
router.get('/select', async (req: Request, res: Response) => {
    console.log('GET /formSubmission/select - Request received')
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
        console.error('Error getting data:', error)
        res.status(500).json({ message: 'Error getting data', error })
    }
})

router.get('/', async (req: Request, res: Response) => {
    console.log('GET /formSubmission - Request received')
    try {
        const forms = await FormSubmissions.find()
        res.status(200).json({ forms })
    } catch (error) {
        console.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})

router.get('/:id', async (req: Request, res: Response) => {
    console.log(`GET /formSubmission/${req.params.id} - Request received`)
    try {
        const id = req.params.id

        const forms = await FormSubmissions.find({ formId: id })
        res.status(200).json({ forms })
    } catch (error) {
        console.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})
export { router as GetFormSubmissionsRouter }
