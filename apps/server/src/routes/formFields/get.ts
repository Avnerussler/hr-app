import express, { Request, Response } from 'express'
import { FormFields } from '../../models'
import mongoose from 'mongoose'
const router = express.Router()

router.get('/partialData', async (req: Request, res: Response) => {
    try {
        const forms = await FormFields.find().select([
            'formName',
            '_id',
            'description',
            'icon',
        ])
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
        console.log('id:', id)

        const pipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(id) } },

            // Unwind sections
            { $unwind: '$sections' },

            // Unwind fields in each section
            { $unwind: '$sections.fields' },

            // Lookup for foreign data (for dynamic select options)
            {
                $lookup: {
                    from: 'form_submissions',
                    let: { foreignFormId: '$sections.fields.foreignFormId' },
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

            // Dynamically set options
            {
                $addFields: {
                    'sections.fields.options': {
                        $cond: {
                            if: {
                                $and: [
                                    {
                                        $eq: [
                                            '$sections.fields.type',
                                            'select',
                                        ],
                                    },
                                    {
                                        $ne: [
                                            '$sections.fields.foreignFormId',
                                            null,
                                        ],
                                    },
                                    {
                                        $ne: [
                                            '$sections.fields.foreignField',
                                            null,
                                        ],
                                    },
                                ],
                            },
                            then: {
                                $cond: {
                                    if: { $gt: [{ $size: '$foreignData' }, 0] },
                                    then: {
                                        $map: {
                                            input: '$foreignData',
                                            as: 'doc',
                                            in: {
                                                value: {
                                                    $toString: '$$doc._id',
                                                },
                                                label: {
                                                    $getField: {
                                                        field: '$sections.fields.foreignField',
                                                        input: '$$doc.formData',
                                                    },
                                                },
                                                name: '$sections.fields.name',
                                            },
                                        },
                                    },
                                    else: '$sections.fields.options',
                                },
                            },
                            else: '$sections.fields.options',
                        },
                    },
                },
            },

            // Group fields back per section
            {
                $group: {
                    _id: {
                        sectionId: '$sections.id',
                        sectionName: '$sections.name',
                    },
                    fields: {
                        $push: {
                            _id: {
                                $ifNull: [
                                    '$sections.fields._id',
                                    {
                                        $concat: [
                                            { $toString: '$_id' },
                                            '_',
                                            '$sections.id',
                                            '_',
                                            '$sections.fields.name',
                                        ],
                                    },
                                ],
                            },
                            name: '$sections.fields.name',
                            type: '$sections.fields.type',
                            label: '$sections.fields.label',
                            placeholder: '$sections.fields.placeholder',
                            required: '$sections.fields.required',
                            defaultValue: '$sections.fields.defaultValue',
                            options: {
                                $ifNull: ['$sections.fields.options', []],
                            },
                            items: { $ifNull: ['$sections.fields.items', []] },
                            errorMessages: {
                                $ifNull: ['$sections.fields.errorMessages', ''],
                            },
                            foreignFormId: '$sections.fields.foreignFormId',
                            foreignField: '$sections.fields.foreignField',
                        },
                    },
                    formName: { $first: '$formName' },
                    metrics: { $first: '$metrics' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },

            // Group sections back into array
            {
                $group: {
                    _id: null,
                    formName: { $first: '$formName' },
                    metrics: { $first: '$metrics' },
                    sections: {
                        $push: {
                            id: '$_id.sectionId',
                            name: '$_id.sectionName',
                            fields: '$fields',
                        },
                    },
                },
            },

            // Final projection to match IForm interface
            {
                $project: {
                    _id: 0,
                    formName: 1,
                    sections: 1,
                    metrics: 1,
                },
            },
        ]

        const form = await FormFields.aggregate(pipeline)

        if (!form.length) {
            res.status(204).json({ message: 'Form not found' })
            return
        }

        res.status(200).send(form[0])
    } catch (error) {
        console.error('Error getting form:', error)
        res.status(500).json({ message: 'Error getting form', error })
    }
})

export { router as GetFormFieldsRouter }
