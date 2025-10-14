import { FormSubmissions, FormFields } from '../models'
import logger from '../config/logger'
import mongoose from 'mongoose'

/**
 * Service to handle bidirectional synchronization between related form fields
 *
 * When a field has bidirectionalSync enabled, any changes to that field will
 * automatically update the corresponding field in the target form.
 *
 * Example:
 * - Project Management form has 'projectPersonnel' (array of personnel IDs)
 * - Personnel form has 'assignedProjects' (array of project IDs)
 * - When adding personnel to a project, they're automatically added to the personnel's assignedProjects
 */

/**
 * Get all fields with bidirectional sync configuration from a form definition
 */
async function getBidirectionalSyncFields(formId: string) {
    try {
        const formDefinition = await FormFields.findById(formId)
        if (!formDefinition) return []

        const allFields =
            formDefinition.sections?.flatMap((section) => section.fields) || []
        return allFields.filter(
            (field) =>
                field.bidirectionalSync?.enabled &&
                field.bidirectionalSync.targetFormName &&
                field.bidirectionalSync.targetFieldName
        )
    } catch (error) {
        logger.error('Error getting bidirectional sync fields:', error)
        return []
    }
}

/**
 * Handle bidirectional sync on create
 * This is called when a new form submission is created
 */
export async function handleBidirectionalSyncOnCreate(
    formId: string,
    formName: string,
    submissionId: string,
    formData: any
) {
    try {
        const syncFields = await getBidirectionalSyncFields(formId)
        if (syncFields.length === 0) return

        logger.info(
            `Processing ${syncFields.length} bidirectional sync fields on create`
        )

        for (const field of syncFields) {
            const fieldValue = formData[field.name]
            if (!fieldValue) continue

            const { targetFormName, targetFieldName } = field.bidirectionalSync!

            // Handle both single and multiple select fields
            const targetIds = Array.isArray(fieldValue)
                ? fieldValue
                : [fieldValue]

            // Filter valid IDs
            const validIds = targetIds.filter(
                (id) =>
                    typeof id === 'string' &&
                    mongoose.Types.ObjectId.isValid(id)
            )

            if (validIds.length === 0) continue

            logger.info(
                `Syncing field ${field.name} -> ${targetFormName}.${targetFieldName}`
            )

            // Update each target document
            for (const targetId of validIds) {
                await addToTargetField(
                    targetFormName,
                    targetId,
                    targetFieldName,
                    submissionId
                )
            }
        }
    } catch (error) {
        logger.error('Error in handleBidirectionalSyncOnCreate:', error)
        // Don't throw - we don't want to fail the create operation
    }
}

/**
 * Handle bidirectional sync on update
 * This is called when an existing form submission is updated
 */
export async function handleBidirectionalSyncOnUpdate(
    formId: string,
    formName: string,
    submissionId: string,
    oldFormData: any,
    newFormData: any
) {
    try {
        const syncFields = await getBidirectionalSyncFields(formId)
        if (syncFields.length === 0) return

        logger.info(
            `Processing ${syncFields.length} bidirectional sync fields on update`
        )

        for (const field of syncFields) {
            const oldValue = oldFormData[field.name]
            const newValue = newFormData[field.name]

            // Normalize to arrays for easier processing
            const oldIds = normalizeToArray(oldValue)
            const newIds = normalizeToArray(newValue)

            // Skip if values are the same after normalization
            if (
                JSON.stringify(oldIds.sort()) === JSON.stringify(newIds.sort())
            ) {
                continue
            }

            const { targetFormName, targetFieldName } = field.bidirectionalSync!

            // Find IDs to add and remove
            const idsToAdd = newIds.filter((id) => !oldIds.includes(id))
            const idsToRemove = oldIds.filter((id) => !newIds.includes(id))

            logger.info(
                `Field ${field.name}: adding ${idsToAdd.length}, removing ${idsToRemove.length}`
            )

            // Add to new targets
            for (const targetId of idsToAdd) {
                await addToTargetField(
                    targetFormName,
                    targetId,
                    targetFieldName,
                    submissionId
                )
            }

            // Remove from old targets
            for (const targetId of idsToRemove) {
                await removeFromTargetField(
                    targetFormName,
                    targetId,
                    targetFieldName,
                    submissionId
                )
            }
        }
    } catch (error) {
        logger.error('Error in handleBidirectionalSyncOnUpdate:', error)
        // Don't throw - we don't want to fail the update operation
    }
}

/**
 * Handle bidirectional sync on delete
 * This is called when a form submission is deleted
 */
export async function handleBidirectionalSyncOnDelete(
    formId: string,
    formName: string,
    submissionId: string,
    formData: any
) {
    try {
        const syncFields = await getBidirectionalSyncFields(formId)
        if (syncFields.length === 0) return

        logger.info(
            `Processing ${syncFields.length} bidirectional sync fields on delete`
        )

        for (const field of syncFields) {
            const fieldValue = formData[field.name]
            if (!fieldValue) continue

            const { targetFormName, targetFieldName } = field.bidirectionalSync!

            const targetIds = normalizeToArray(fieldValue)

            logger.info(
                `Removing ${submissionId} from ${targetIds.length} target documents`
            )

            // Remove from all target documents
            for (const targetId of targetIds) {
                await removeFromTargetField(
                    targetFormName,
                    targetId,
                    targetFieldName,
                    submissionId
                )
            }
        }
    } catch (error) {
        logger.error('Error in handleBidirectionalSyncOnDelete:', error)
        // Don't throw - we don't want to fail the delete operation
    }
}

/**
 * Add a reference to the target field
 */
async function addToTargetField(
    targetFormName: string,
    targetDocumentId: string,
    targetFieldName: string,
    valueToAdd: string
) {
    try {
        if (!mongoose.Types.ObjectId.isValid(targetDocumentId)) {
            logger.warn(`Invalid target document ID: ${targetDocumentId}`)
            return
        }

        const targetDoc = await FormSubmissions.findOne({
            _id: targetDocumentId,
            formName: targetFormName,
            isDeleted: false,
        })

        if (!targetDoc) {
            logger.warn(
                `Target document not found: ${targetFormName}/${targetDocumentId}`
            )
            return
        }

        // Get current value
        const currentValue = targetDoc.formData[targetFieldName]

        // Check if field expects array or single value
        let newValue: any

        if (Array.isArray(currentValue)) {
            // Array field - check if value already exists (handle both plain IDs and objects)
            const alreadyExists = currentValue.some((item) => {
                if (typeof item === 'object' && item._id) {
                    return item._id === valueToAdd
                }
                return item === valueToAdd
            })

            if (!alreadyExists) {
                newValue = [...currentValue, valueToAdd]
            } else {
                // Already present, no update needed
                return
            }
        } else {
            // Single value field - replace
            newValue = valueToAdd
        }

        // Update the document
        await FormSubmissions.updateOne(
            { _id: targetDocumentId },
            { $set: { [`formData.${targetFieldName}`]: newValue } }
        )

        logger.info(
            `Added ${valueToAdd} to ${targetFormName}.${targetFieldName}`
        )
    } catch (error) {
        logger.error(`Error adding to target field:`, error)
    }
}

/**
 * Remove a reference from the target field
 */
async function removeFromTargetField(
    targetFormName: string,
    targetDocumentId: string,
    targetFieldName: string,
    valueToRemove: string
) {
    try {
        if (!mongoose.Types.ObjectId.isValid(targetDocumentId)) {
            logger.warn(`Invalid target document ID: ${targetDocumentId}`)
            return
        }

        const targetDoc = await FormSubmissions.findOne({
            _id: targetDocumentId,
            formName: targetFormName,
            isDeleted: false,
        })

        if (!targetDoc) {
            logger.warn(
                `Target document not found: ${targetFormName}/${targetDocumentId}`
            )
            return
        }

        // Get current value
        const currentValue = targetDoc.formData[targetFieldName]

        // Check if field expects array or single value
        let newValue: any

        if (Array.isArray(currentValue)) {
            // Array field - need to handle both plain IDs and objects with _id
            newValue = currentValue.filter((item) => {
                // If item is an object with _id, compare the _id
                if (typeof item === 'object' && item._id) {
                    return item._id !== valueToRemove
                }
                // If item is a plain string, compare directly
                return item !== valueToRemove
            })
        } else if (currentValue === valueToRemove) {
            // Single value field - clear if it matches
            newValue = ''
        } else if (
            typeof currentValue === 'object' &&
            currentValue._id === valueToRemove
        ) {
            // Single value field with object format
            newValue = ''
        } else {
            // Value doesn't match, no update needed
            return
        }

        // Update the document
        await FormSubmissions.updateOne(
            { _id: targetDocumentId },
            { $set: { [`formData.${targetFieldName}`]: newValue } }
        )

        logger.info(
            `Removed ${valueToRemove} from ${targetFormName}.${targetFieldName}`
        )
    } catch (error) {
        logger.error(`Error removing from target field:`, error)
    }
}

/**
 * Normalize a value to an array of valid IDs
 * Handles both plain string IDs and objects with _id field (from enhanced selects)
 */
function normalizeToArray(value: any): string[] {
    if (!value) return []

    const arr = Array.isArray(value) ? value : [value]

    return arr
        .map((item) => {
            // If item is an object with _id field (from enhanced select), extract the _id
            if (typeof item === 'object' && item._id) {
                return item._id
            }
            // If item is already a string, use it directly
            return item
        })
        .filter(
            (id) =>
                typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)
        )
}

export const bidirectionalSyncService = {
    handleBidirectionalSyncOnCreate,
    handleBidirectionalSyncOnUpdate,
    handleBidirectionalSyncOnDelete,
}
