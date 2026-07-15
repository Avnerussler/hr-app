import { Request, Response, Router } from 'express'
import { FormSubmissions } from '../../models'
import logger from '../../config/logger'
import mongoose from 'mongoose'
import { bidirectionalSyncService } from '../../services/bidirectionalSync'
import { transformFormData } from '../../utils'
import { formValidationService } from '../../services/formValidation'
import { validate, commonSchemas, asyncHandler, coerceFormData } from '../../middleware'

const router = Router()

router.post(
    '/',
    validate(commonSchemas.formSubmission),
    coerceFormData,
    asyncHandler(async (req: Request, res: Response) => {
        const { formData, formId, formName } = req.body

        logger.info(`Received form data:`, { formData, formId, formName })

        const validationResult = await formValidationService.validateFormSubmission(
            formData,
            formId,
            formName
        )

        if (!validationResult.isValid) {
            logger.warn('Form validation failed:', validationResult.errors)
            const firstError = validationResult.errors[0]
            const httpStatus = firstError?.statusCode ?? 400
            return res.status(httpStatus).json({
                error: 'Validation failed',
                message: firstError?.message,
                errors: validationResult.errors,
            })
        }

        const form = (await FormSubmissions.create({
            formData,
            formId,
            formName,
        })) as mongoose.Document & { _id: mongoose.Types.ObjectId }

        await form.save()
        logger.info('Form submission saved successfully')

        await bidirectionalSyncService.handleBidirectionalSyncOnCreate(
            formId,
            formName,
            form._id.toString(),
            formData
        )

        let transformedFormData = formData
        try {
            transformedFormData = await transformFormData(form.toObject().formData, formId)
        } catch (transformError) {
            logger.error('Transformation failed, using original data:', transformError)
        }

        res.status(201).json({
            form: {
                ...form.toObject(),
                formData: transformedFormData,
            }
        })
    })
)

export { router as CreateFormSubmissionRouter }
