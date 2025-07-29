import { FormSubmissions } from '../../models'
import { Request, Response, Router } from 'express'
import logger from '../../config/logger'

const router = Router()

router.delete('/:id', async (req: Request, res: Response) => {
    logger.info(`DELETE /formSubmission/${req.params.id} - Request received`)
    try {
        const id = req.params.id
        const forms = await FormSubmissions.findOneAndDelete({ _id: id })
        res.status(200).json({ forms })
    } catch (error) {
        logger.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})
export { router as DeleteFormSubmissionsRouter }
