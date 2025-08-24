import { Router } from 'express'
import { GetWorkHoursRouter } from './get'
import { CreateWorkHoursRouter } from './create'
import { UpdateWorkHoursRouter } from './update'
import { DeleteWorkHoursRouter } from './delete'

const workHoursRouter = Router()

// Mount all work hours routes
workHoursRouter.use('/', GetWorkHoursRouter)
workHoursRouter.use('/', CreateWorkHoursRouter)
workHoursRouter.use('/', UpdateWorkHoursRouter)
workHoursRouter.use('/', DeleteWorkHoursRouter)

export { workHoursRouter }