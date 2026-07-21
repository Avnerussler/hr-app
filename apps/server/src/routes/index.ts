import { Router } from 'express'
import { fileUploadRouter } from './file'
import { quotaRouter } from './quota'
import { statisticsRouter } from './statistics'
import { personnelRouter } from './personnel'
import { projectsRouter } from './projects'
import { reserveDaysRouter } from './reserveDays'
import { settingsRouter } from './settings'
const router = Router()

router.use('/file', fileUploadRouter)
router.use('/quotas', quotaRouter)
router.use('/statistics', statisticsRouter)
router.use('/personnel', personnelRouter)
router.use('/projects', projectsRouter)
router.use('/reserve-days', reserveDaysRouter)
router.use('/settings', settingsRouter)

export default router
