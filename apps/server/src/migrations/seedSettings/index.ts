import mongoose from 'mongoose'
import dotenv from 'dotenv'
import connectDB from '../../config/db'
import logger from '../../config/logger'
import { SettingModel } from '../../models/Setting'
import {
    STUDIO_ROLE_LABELS,
    CLASSIFICATION_CLASS_LABELS,
    LAYER_LABELS,
    RESERVE_CATEGORY_LABELS,
    FIELD_OF_EXPERTISE_LABELS,
    EXPERIENCE_LABELS,
    FUNDING_SOURCE_LABELS,
    ORDER_TYPE_LABELS,
    REQUEST_STATUS_LABELS,
    BASE_ACCESS_APPROVAL_LABELS,
    PROJECT_STATUS_LABELS,
} from '@hr-app/shared-types'

dotenv.config()

interface SeedDefinition {
    key: string
    label: string
    category: string
    labels: Record<string, string>
}

const CATEGORY_PERSONNEL = 'משאבי אנוש'
const CATEGORY_RESERVE_DAYS = 'ימי מילואים'
const CATEGORY_PROJECT = 'פרויקטים'

const SEED_DEFINITIONS: SeedDefinition[] = [
    { key: 'studioRole', label: 'תפקיד בסטודיו', category: CATEGORY_PERSONNEL, labels: STUDIO_ROLE_LABELS },
    { key: 'classificationClass', label: 'רמת סיווג', category: CATEGORY_PERSONNEL, labels: CLASSIFICATION_CLASS_LABELS },
    { key: 'layer', label: 'שכבה', category: CATEGORY_PERSONNEL, labels: LAYER_LABELS },
    { key: 'reserveCategory', label: 'סוג העסקה', category: CATEGORY_PERSONNEL, labels: RESERVE_CATEGORY_LABELS },
    { key: 'fieldOfExpertise', label: 'תחום מקצועי', category: CATEGORY_PERSONNEL, labels: FIELD_OF_EXPERTISE_LABELS },
    { key: 'experience', label: 'שנות ניסיון', category: CATEGORY_PERSONNEL, labels: EXPERIENCE_LABELS },
    { key: 'fundingSource', label: 'מקור מימון', category: CATEGORY_RESERVE_DAYS, labels: FUNDING_SOURCE_LABELS },
    { key: 'orderType', label: 'סוג צו', category: CATEGORY_RESERVE_DAYS, labels: ORDER_TYPE_LABELS },
    { key: 'requestStatus', label: 'סטטוס בקשה', category: CATEGORY_RESERVE_DAYS, labels: REQUEST_STATUS_LABELS },
    { key: 'baseAccessApproval', label: 'אישור כניסה לבסיס', category: CATEGORY_RESERVE_DAYS, labels: BASE_ACCESS_APPROVAL_LABELS },
    { key: 'projectStatus', label: 'סטטוס פרויקט', category: CATEGORY_PROJECT, labels: PROJECT_STATUS_LABELS },
]

async function run() {
    const dryRun = process.argv.includes('--dry-run')

    await connectDB()

    for (const def of SEED_DEFINITIONS) {
        const options = Object.entries(def.labels).map(([value, label], index) => ({
            value,
            label,
            order: index,
            isActive: true,
        }))

        const doc = {
            key: def.key,
            label: def.label,
            category: def.category,
            type: 'select',
            isActive: true,
            options,
        }

        if (dryRun) {
            logger.info(`[dry-run] would upsert setting "${def.key}" with ${options.length} option(s).`)
        } else {
            await SettingModel.findOneAndUpdate({ key: def.key }, { $set: doc }, { upsert: true })
            logger.info(`Upserted setting "${def.key}" with ${options.length} option(s).`)
        }
    }

    await mongoose.disconnect()
}

run().catch((error) => {
    logger.error('seedSettings migration failed:', error)
    process.exit(1)
})
