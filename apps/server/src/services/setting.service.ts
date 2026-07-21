import { SettingModel } from '../models/Setting'
import { SettingSchema, SettingUpdateSchema } from '@hr-app/shared-types'
import { NotFoundError, ValidationError } from '../middleware/errorHandler'

export async function listSettings() {
    const items = await SettingModel.find().sort({ category: 1, label: 1 }).lean()
    return items
}

export async function getSettingById(id: string) {
    const doc = await SettingModel.findById(id).lean()
    if (!doc) throw new NotFoundError('Setting')
    return doc
}

export async function getSettingByKey(key: string) {
    const doc = await SettingModel.findOne({ key }).lean()
    if (!doc) throw new NotFoundError('Setting')
    return doc
}

export async function createSetting(body: unknown) {
    const validated = SettingSchema.parse(body)
    const existing = await SettingModel.findOne({ key: validated.key })
    if (existing) throw new ValidationError(`Setting with key "${validated.key}" already exists`)
    const created = await SettingModel.create(validated)
    return created.toObject()
}

export async function updateSetting(id: string, body: unknown) {
    const existing = await SettingModel.findById(id)
    if (!existing) throw new NotFoundError('Setting')

    const validated = SettingUpdateSchema.parse(body)
    Object.assign(existing, validated)
    await existing.save()

    return existing.toObject()
}

export async function deleteSetting(id: string) {
    const doc = await SettingModel.findByIdAndDelete(id)
    if (!doc) throw new NotFoundError('Setting')
    return doc.toObject()
}

/**
 * Rejects `value` if it isn't one of the active options stored for `key` in the settings
 * collection. Fields stay nullish, so undefined/null values are allowed through.
 */
export async function validateSelectField(key: string, value: unknown): Promise<void> {
    if (value === undefined || value === null || value === '') return

    const setting = await SettingModel.findOne({ key }).lean()
    if (!setting || !setting.isActive) {
        throw new ValidationError(`No active setting found for "${key}"`)
    }

    const allowedValues = setting.options.filter((o) => o.isActive).map((o) => o.value)
    if (!allowedValues.includes(value as string)) {
        throw new ValidationError(`Invalid value "${value}" for "${key}"`)
    }
}
