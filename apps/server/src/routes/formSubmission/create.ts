import { Request, Response, Router } from 'express'
import { FormSubmissions } from '../../models'
import logger from '../../config/logger'
import mongoose from 'mongoose'
import { bidirectionalSyncService } from '../../services/bidirectionalSync'
import { transformFormData } from '../../utils'

const router = Router()

import { validate, commonSchemas, asyncHandler } from '../../middleware'

router.post(
    '/',
    validate(commonSchemas.formSubmission),
    asyncHandler(async (req: Request, res: Response) => {
        const { formData, formId, formName } = req.body

        logger.info(`Received form data:`, { formData, formId, formName })

        // Validate form data using the generic validation service
        // const validationResult = await formValidationService.validateFormSubmission(
        //     formData,
        //     formId,
        //     formName
        // )

        // if (!validationResult.isValid) {
        //     logger.warn('Form validation failed:', validationResult.errors)
        //     return res.status(400).json({
        //         error: 'Validation failed',
        //         errors: validationResult.errors
        //     })
        // }

        logger.info('Creating form submission with data:', formData)

        // Store formData as-is (raw IDs) - transformation happens only when reading
        const form = (await FormSubmissions.create({
            formData: formData,
            formId,
            formName,
        })) as mongoose.Document & { _id: mongoose.Types.ObjectId }

        await form.save()
        logger.info('Form submission saved successfully')

        // Handle bidirectional sync after successful creation
        await bidirectionalSyncService.handleBidirectionalSyncOnCreate(
            formId,
            formName,
            form._id.toString(),
            formData  // Use raw formData
        )

        // Transform the data for the response to the frontend
        let transformedFormData = formData
        try {
            transformedFormData = await transformFormData(form.toObject().formData, formId)
            logger.info('Transformation completed successfully')
        } catch (transformError) {
            logger.error(
                'Transformation failed, using original data:',
                transformError
            )
            transformedFormData = formData
        }

        res.status(201).json({
            form: {
                ...form.toObject(),
                formData: transformedFormData
            }
        })
    })
)

export { router as CreateFormSubmissionRouter }
