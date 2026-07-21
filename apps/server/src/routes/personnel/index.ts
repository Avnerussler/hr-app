import { Router } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import * as personnelController from '../../controllers/personnel.controller'

const router = Router()

router.get('/options', asyncHandler(personnelController.options))
router.post('/options/byIds', asyncHandler(personnelController.optionsByIds))
router.get('/metrics', asyncHandler(personnelController.metrics))
router.get('/:id', asyncHandler(personnelController.getById))
router.get('/', asyncHandler(personnelController.list))
router.post('/', asyncHandler(personnelController.create))
router.patch('/:id', asyncHandler(personnelController.update))
router.delete('/:id', asyncHandler(personnelController.remove))

export { router as personnelRouter }
