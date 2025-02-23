import { FormSubmissions } from '../../models'
import { Request, Response, Router } from 'express'

const router = Router()

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        const newFirstName = req.body

        console.log(' :11 ~ newFirstName:', newFirstName)

        console.log(' :10 ~ id:', id)

        // const forms = await FormSubmissions.findByIdAndUpdate({
        //     _id: id,
        //     FirstName: 'avner',
        // })

        const updatedForm = await FormSubmissions.findByIdAndUpdate(
            id,
            { $set: { 'formFields.FirstName': 'blblbl' } },
            { new: true } // Return the updated document
        )

        // if (!updatedForm) {
        //     return res.status(404).json({ message: 'Form not found' })
        // }
        res.status(200).json({ updatedForm })
    } catch (error) {
        console.error('Error getting forms:', error)
        res.status(500).json({ message: 'Error getting forms', error })
    }
})
export { router as UpdateFormSubmissionsRouter }
