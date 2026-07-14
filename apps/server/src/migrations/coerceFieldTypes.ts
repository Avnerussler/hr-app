import connectDB from '../config/db'
import { FormFields, FormSubmissions } from '../models'
import logger from '../config/logger'

/**
 * One-time migration: convert stored string values to correct types in FormSubmissions.
 *
 * - date fields: "YYYY-MM-DD" strings → Date objects
 * - radio/switch fields with boolean items: "true"/"false" strings → boolean
 */
const coerceFieldTypes = async () => {
    await connectDB()
    logger.info('Starting coerceFieldTypes migration...')

    const allForms = await FormFields.find({}).lean()

    for (const form of allForms) {
        const allFields = form.sections?.flatMap((s: any) => s.fields ?? []) ?? []

        const dateFields: string[] = []
        const booleanFields: string[] = []

        for (const field of allFields) {
            if (field.type === 'date') {
                dateFields.push(field.name)
            }
            if (field.type === 'radio' || field.type === 'switch') {
                const items: { value: unknown }[] = field.items ?? []
                const hasBooleanItems = items.some(
                    (item) => item.value === 'true' || item.value === 'false'
                )
                if (hasBooleanItems) {
                    booleanFields.push(field.name)
                }
            }
        }

        if (dateFields.length === 0 && booleanFields.length === 0) continue

        logger.info(`Form "${form.formName}": date fields [${dateFields}], boolean fields [${booleanFields}]`)

        const submissions = await FormSubmissions.find({ formName: form.formName }).lean()
        let updated = 0

        for (const submission of submissions) {
            const update: Record<string, unknown> = {}

            for (const fieldName of dateFields) {
                const val = submission.formData?.[fieldName]
                if (typeof val === 'string' && val) {
                    const d = new Date(val)
                    if (!isNaN(d.getTime())) {
                        update[`formData.${fieldName}`] = d
                    }
                }
            }

            for (const fieldName of booleanFields) {
                const val = submission.formData?.[fieldName]
                if (val === 'true' || val === 'false') {
                    update[`formData.${fieldName}`] = val === 'true'
                }
            }

            if (Object.keys(update).length > 0) {
                await FormSubmissions.updateOne(
                    { _id: submission._id },
                    { $set: update }
                )
                updated++
            }
        }

        logger.info(`Form "${form.formName}": updated ${updated}/${submissions.length} submissions`)
    }

    logger.info('coerceFieldTypes migration complete.')
    process.exit(0)
}

coerceFieldTypes().catch((err) => {
    logger.error('Migration failed:', err)
    process.exit(1)
})
