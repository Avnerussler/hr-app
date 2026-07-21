import { Router } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import * as reserveDayController from '../../controllers/reserveDay.controller'

const router = Router()

router.patch('/attendance', asyncHandler(reserveDayController.updateAttendance))
router.get('/metrics', asyncHandler(reserveDayController.metrics))
router.get('/:id', asyncHandler(reserveDayController.getById))
router.get('/', asyncHandler(reserveDayController.list))
router.post('/', asyncHandler(reserveDayController.create))
router.patch('/:id', asyncHandler(reserveDayController.update))
router.delete('/:id', asyncHandler(reserveDayController.remove))

export { router as reserveDaysRouter }
