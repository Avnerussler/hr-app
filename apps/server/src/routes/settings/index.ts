import { Router } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import * as settingController from '../../controllers/setting.controller'

const router = Router()

router.get('/key/:key', asyncHandler(settingController.getByKey))
router.get('/:id', asyncHandler(settingController.getById))
router.get('/', asyncHandler(settingController.list))
router.post('/', asyncHandler(settingController.create))
router.patch('/:id', asyncHandler(settingController.update))
router.delete('/:id', asyncHandler(settingController.remove))

export { router as settingsRouter }
