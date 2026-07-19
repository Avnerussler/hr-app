import mongoose from 'mongoose'
import dotenv from 'dotenv'
import connectDB from '../../config/db'
import logger from '../../config/logger'
import { PersonnelModel } from '../../models/Personnel'
import { ProjectModel } from '../../models/Project'
import { ReserveDayModel } from '../../models/ReserveDay'
import { migratePersonnel, fixupPersonnelAssignedProjects } from './migratePersonnel'
import { migrateProjects } from './migrateProjects'
import { migrateReserveDays, checkNoOverlapInvariant } from './migrateReserveDays'
import { printReport } from './report'
import { verifyCounts } from './verify'

dotenv.config()

async function run() {
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run')
    const force = args.includes('--force')

    await connectDB()

    if (force && !dryRun) {
        logger.warn('--force: dropping existing personnel/projects/reserve_days collections')
        await Promise.all([
            PersonnelModel.collection.deleteMany({}),
            ProjectModel.collection.deleteMany({}),
            ReserveDayModel.collection.deleteMany({}),
        ])
    }

    if (!dryRun && !force) {
        const existingCount = await PersonnelModel.countDocuments({})
        if (existingCount > 0) {
            logger.error(
                `personnel collection already has ${existingCount} documents. Re-run with --force to drop and recreate, or --dry-run to preview only.`
            )
            await mongoose.disconnect()
            process.exit(1)
        }
    }

    // Order matters: personnel has no FK dependencies, projects/reserveDays depend on personnel.
    const personnelResult = await migratePersonnel(dryRun)
    const migratedPersonnelIds = new Set(personnelResult.docs.map((d) => String(d._id)))

    const projectsResult = await migrateProjects(dryRun, migratedPersonnelIds)
    const migratedProjectIds = new Set(projectsResult.docs.map((d) => String(d._id)))

    const reserveDaysResult = await migrateReserveDays(dryRun, migratedPersonnelIds)

    // Second pass: fix up personnel.assignedProjects now that projects exist with stable _ids.
    // Must run before the personnel report is printed/inserted-checked, and (in a real run)
    // after personnel was already inserted — so this issues its own update for dangling refs.
    await fixupPersonnelAssignedProjects(dryRun, personnelResult.report, personnelResult.docs, migratedProjectIds)

    printReport(personnelResult.report, dryRun)
    printReport(projectsResult.report, dryRun)
    printReport(reserveDaysResult.report, dryRun)

    if (personnelResult.report.droppedOrphanRefs.length > 0) {
        logger.warn(
            `personnel.assignedProjects: dropped ${personnelResult.report.droppedOrphanRefs.length} dangling refs`
        )
    }

    checkNoOverlapInvariant(reserveDaysResult.docs)

    if (!dryRun) {
        await verifyCounts()
    } else {
        logger.info('Dry run complete — no writes were made. Re-run without --dry-run to perform the migration.')
    }

    await mongoose.disconnect()
}

run().catch((error) => {
    logger.error('Migration failed:', error)
    process.exit(1)
})
