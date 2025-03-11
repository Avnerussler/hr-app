import express, { Request, Response } from 'express'
import { FormFields } from '../../models'
import mongoose from 'mongoose'
const router = express.Router()

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
        console.log(' id:', id)
        const form = await FormFields.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId.createFromHexString(id),
                },
            },
            {
                $unwind: '$formFields', // Unwind formFields array
            },
            {
                $lookup: {
                    from: 'form_submissions',
                    let: { foreignFormId: '$formFields.foreignFormId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$formId', '$$foreignFormId'] },
                            },
                        },
                    ],
                    as: 'foreignData',
                },
            },
            {
                $addFields: {
                    'formFields.options': {
                        $cond: {
                            if: {
                                $and: [
                                    { $eq: ['$formFields.type', 'select'] },
                                    {
                                        $ne: [
                                            '$formFields.foreignFormId',
                                            null,
                                        ],
                                    },
                                    { $ne: ['$formFields.foreignField', null] },
                                ],
                            },
                            then: {
                                $sortArray: {
                                    input: {
                                        $map: {
                                            input: '$foreignData',
                                            as: 'doc',
                                            in: {
                                                value: '$$doc._id',
                                                label: {
                                                    $getField: {
                                                        field: '$formFields.foreignField',
                                                        input: '$$doc.formData',
                                                    },
                                                },
                                                name: '$formFields.name',
                                            },
                                        },
                                    },
                                    sortBy: { label: 1 }, // Sort ascending (A-Z)
                                },
                            },
                            else: '$formFields.options',
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$_id',
                    formName: { $first: '$formName' },
                    formFields: { $push: '$formFields' }, // Reconstruct the array
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },
        ])

        console.log(' form:', form[0].formFields)
        res.status(200).json({ form: form[0] })
    } catch (error) {
        console.error('Error getting form:', error)
        res.status(500).json({ message: 'Error getting form', error })
    }
})

export { router as GetFormFieldsRouter }
