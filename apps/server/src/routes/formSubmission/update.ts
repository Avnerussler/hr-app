import { Request, Response, Router } from 'express'
import { FormSubmissions, FormFields } from '../../models'
import mongoose from 'mongoose'
import logger from '../../config/logger'

const transformFormData = async (formData: any, formId: string) => {
    try {
        // Get form field definitions to understand foreign relationships
        const formDefinition = await FormFields.findById(formId)
        if (!formDefinition) return formData

        const transformedData = { ...formData }
        
        // Flatten all fields from all sections using flatMap
        const allFields = formDefinition.sections?.flatMap(section => section.fields) || []
        
        // Filter only fields with foreign relationships that have values
        const foreignFields = allFields.filter(field => 
            field.foreignFormName && 
            field.foreignField && 
            formData[field.name]
        )

        if (foreignFields.length === 0) return formData

        // Process each foreign field
        for (const field of foreignFields) {
            const fieldValue = formData[field.name]
            
            if (field.type === 'select' || field.type === 'selectAutocomplete') {
                // Single selection
                if (typeof fieldValue === 'string' && mongoose.Types.ObjectId.isValid(fieldValue)) {
                    const doc = await FormSubmissions.findOne({
                        _id: fieldValue,
                        formName: field.foreignFormName
                    }).lean()
                    
                    const foreignField = field.foreignField
                    if (doc?.formData && foreignField && doc.formData[foreignField]) {
                        transformedData[field.name] = {
                            _id: fieldValue,
                            display: doc.formData[foreignField]
                        }
                    }
                }
            } else if (field.type === 'multipleSelect') {
                // Multiple selection
                if (Array.isArray(fieldValue)) {
                    const validIds = fieldValue.filter(id => 
                        typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)
                    )
                    
                    if (validIds.length > 0) {
                        const docs = await FormSubmissions.find({
                            _id: { $in: validIds },
                            formName: field.foreignFormName
                        }).lean()
                        
                        transformedData[field.name] = validIds.map(id => {
                            const doc = docs.find(d => d._id.toString() === id)
                            return {
                                _id: id,
                                display: (doc?.formData && field.foreignField && doc.formData[field.foreignField]) || id
                            }
                        })
                    }
                }
            } else if (field.type === 'radio') {
                // Radio selection
                if (typeof fieldValue === 'string' && mongoose.Types.ObjectId.isValid(fieldValue)) {
                    const doc = await FormSubmissions.findOne({
                        _id: fieldValue,
                        formName: field.foreignFormName
                    }).lean()
                    
                    const foreignField = field.foreignField
                    if (doc?.formData && foreignField && doc.formData[foreignField]) {
                        transformedData[field.name] = {
                            _id: fieldValue,
                            display: doc.formData[foreignField]
                        }
                    }
                }
            }
        }
        
        return transformedData
    } catch (error) {
        logger.error('Error transforming form data:', error)
        return formData
    }
}

const router = Router()
router.post('/', async (req: Request, res: Response) => {
    logger.info('POST /formSubmission/update - Request received')
    try {
        const { id, formData } = req.body
        
        // Get the existing form to find its formId
        const existingForm = await FormSubmissions.findById(id)
        if (!existingForm) {
            logger.warn(`Form with ID ${id} not found for update`)
            res.status(404).json({ message: 'Form not found' })
            return
        }

        // Transform the form data to include both reference and display values
        const transformedFormData = await transformFormData(formData, existingForm.formId.toString())

        const updatedForm = await FormSubmissions.findByIdAndUpdate(
            mongoose.Types.ObjectId.createFromHexString(id),
            { $set: { formData: transformedFormData } },
            { new: true } // Return the updated document
        )

        res.status(200).json({ form: updatedForm })
    } catch (error) {
        logger.error('Error updating form:', error)
        res.status(500).json({ message: 'Error updating form', error })
    }
})

export { router as UpdateFormSubmissionsRouter }
