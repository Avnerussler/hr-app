import express, { Request, Response } from 'express'
import { FormFields } from '../../models'

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
    try {
        const forms = await FormFields.find()
        console.log('Got all forms')
        res.status(200).json({ forms })
    } catch (error) {
        console.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})

router.get('/partialData', async (req: Request, res: Response) => {
    try {
        const forms = await FormFields.find().select(['formName', '_id'])
        console.log('Got partialData of forms')
        res.status(200).json({ forms })
    } catch (error) {
        console.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        const form = await FormFields.findById(id)
        res.status(200).json({ form })
    } catch (error) {
        console.error('Error getting form:', error)
        res.status(500).json({ message: 'Error getting form', error })
    }
})

export { router as GetFormFieldsRouter }
