import { Router } from 'express'
import { GetStatisticsRouter } from './get'

const statisticsRouter = Router()

statisticsRouter.use('/', GetStatisticsRouter)

export { statisticsRouter }
