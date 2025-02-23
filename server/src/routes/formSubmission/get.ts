import { FormSubmissions } from '../../models'
import { Request, Response, Router } from 'express'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
    try {
        const forms = await FormSubmissions.find()
        res.status(200).json({ forms })
    } catch (error) {
        console.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})

router.get('/:id', async (req: Request, res: Response) => {
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
