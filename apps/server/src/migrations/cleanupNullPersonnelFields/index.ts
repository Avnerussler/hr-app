import mongoose from 'mongoose'
import dotenv from 'dotenv'
import connectDB from '../../config/db'
import logger from '../../config/logger'
import { PersonnelModel } from '../../models/Personnel'

dotenv.config()

// Legacy/migrated Personnel documents store unset optional fields as explicit `null`
// instead of omitting the key. The Zod schema now accepts `null` too (see
// packages/shared-types/src/personnel.ts), but this backfill removes the null keys
// from existing documents for data cleanliness — `assignedProjects` is excluded since
// `null` is its valid "unassigned" value there.
const NULLABLE_OPTIONAL_FIELDS = [
    'userId',
    'phone',
    'email',
    'city',
    'linkedin',
    'vehicleNumber',
    'note',
    'details',
    'layer',
    'reserveUnit',
    'studioRole',
    'reserveRole',
    'directBoss',
    'rank',
    'classificationClass',
    'canBeRecited',
    'reserveCategory',
    'entryStartDate',
    'entryEndDate',
    'hasVehicleApproval',
    'degree',
    'university',
    'studyArea',
    'yearOfGradation',
    'workExperience',
    'talentAndSkills',
    'referralSource',
    'fieldOfExpertise',
    'experience',
    'workPlace',
    'currentPosition',
    'resumeFileUrl',
]

async function run() {
    const dryRun = process.argv.includes('--dry-run')

    await connectDB()

    // `{ field: null }` matches both explicit null AND missing fields — use `$type: 'null'`
    // to match only documents where the field is truly present and set to null.
    const query = { $or: NULLABLE_OPTIONAL_FIELDS.map((field) => ({ [field]: { $type: 'null' } })) }
    const affectedCount = await PersonnelModel.countDocuments(query)

    if (dryRun) {
        logger.info(
            `[dry-run] ${affectedCount} personnel document(s) have at least one null-valued optional field and would be updated.`
        )
    } else {
        const unsetFields = Object.fromEntries(NULLABLE_OPTIONAL_FIELDS.map((field) => [field, '']))
        const result = await PersonnelModel.updateMany(query, { $unset: unsetFields })
        logger.info(`Matched ${result.matchedCount}, modified ${result.modifiedCount} personnel document(s).`)
    }

    await mongoose.disconnect()
}

run().catch((error) => {
    logger.error('cleanupNullPersonnelFields migration failed:', error)
    process.exit(1)
})
