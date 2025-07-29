import { FormSubmissions } from '../../models'
import { Request, Response, Router } from 'express'

const router = Router()

router.delete('/:id', async (req: Request, res: Response) => {
    console.log(`DELETE /formSubmission/${req.params.id} - Request received`)
    try {
        const id = req.params.id
        const forms = await FormSubmissions.findOneAndDelete({ _id: id })
        res.status(200).json({ forms })
    } catch (error) {
        console.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})
export { router as DeleteFormSubmissionsRouter }
