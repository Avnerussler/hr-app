import { Router } from 'express'
import { asyncHandler } from '../../middleware/errorHandler'
import * as projectController from '../../controllers/project.controller'

const router = Router()

router.get('/options', asyncHandler(projectController.options))
router.post('/options/byIds', asyncHandler(projectController.optionsByIds))
router.get('/metrics', asyncHandler(projectController.metrics))
router.get('/:id', asyncHandler(projectController.getById))
router.get('/', asyncHandler(projectController.list))
router.post('/', asyncHandler(projectController.create))
router.patch('/:id', asyncHandler(projectController.update))
router.delete('/:id', asyncHandler(projectController.remove))

export { router as projectsRouter }
