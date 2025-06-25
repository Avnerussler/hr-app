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
        const { id } = req.params

        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            { $unwind: '$formFields' },
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
                                $cond: {
                                    if: { $gt: [{ $size: '$foreignData' }, 0] }, // If foreignData exists
                                    then: {
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
                                    else: '$formFields.options', // Keep existing options if no foreignData
                                },
                            },
                            else: '$formFields.options', // Preserve static options
                        },
                    },
                },
            },
            {
                $group: {
                    _id: '$_id',
                    formName: { $first: '$formName' },
                    formFields: { $push: '$formFields' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },
        ]

        const form = await FormFields.aggregate(pipeline)

        if (!form.length) {
            res.status(404).json({ message: 'Form not found' })
            return
        }

        res.status(200).json({ form: form[0] })
    } catch (error) {
        console.error('Error getting form:', error)
        res.status(500).json({ message: 'Error getting form', error })
    }
})

export { router as GetFormFieldsRouter }
