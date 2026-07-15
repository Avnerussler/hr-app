import { Request, Response, NextFunction } from 'express'
import { FormFields } from '../models'
import mongoose from 'mongoose'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/

/**
 * Middleware for form submission routes.
 * Requires req.body.formId to be present (set by the route before calling this,
 * or sent directly by the client on create).
 * Coerces req.body.formData field values to their correct types:
 *   - date fields: ISO string → Date
 *   - radio/switch with boolean items: "true"/"false" → boolean
 */
export const coerceFormData = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
        const formId: string = req.body.formId
        const formData: Record<string, unknown> = req.body.formData

        if (!formData || !formId || !mongoose.Types.ObjectId.isValid(formId)) {
            return next()
        }

        const formDef = await FormFields.findById(formId).lean()
        if (!formDef) return next()

        const allFields = formDef.sections?.flatMap((s: any) => s.fields ?? []) ?? []

        for (const field of allFields) {
            const value = formData[field.name]
            if (value === undefined || value === null || value === '') continue

            if (field.type === 'date' && typeof value === 'string' && ISO_DATE_RE.test(value)) {
                const d = new Date(value)
                if (!isNaN(d.getTime())) formData[field.name] = d
            }

            if ((field.type === 'radio' || field.type === 'switch') && (value === 'true' || value === 'false')) {
                const items: { value: unknown }[] = field.items ?? []
                if (items.some((i) => i.value === 'true' || i.value === 'false')) {
                    formData[field.name] = value === 'true'
                }
            }
        }

        next()
    } catch {
        next()
    }
}
