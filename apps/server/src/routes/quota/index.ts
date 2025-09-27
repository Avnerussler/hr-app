import { Router } from 'express'
import { GetQuotaRouter } from './get'
import { CreateQuotaRouter } from './create'
import { UpdateQuotaRouter } from './update'
import { DeleteQuotaRouter } from './delete'
import { AttendanceRouter } from './attendance'

const quotaRouter = Router()

// Mount all routes at root level
quotaRouter.use('/', GetQuotaRouter)
quotaRouter.use('/', CreateQuotaRouter)
quotaRouter.use('/', UpdateQuotaRouter)
quotaRouter.use('/', DeleteQuotaRouter)
quotaRouter.use('/', AttendanceRouter)

export { quotaRouter }