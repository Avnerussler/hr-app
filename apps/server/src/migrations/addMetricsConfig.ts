import { FormFields } from '../models'
import { MetricConfig } from '../types'
import logger from '../config/logger'

const projectMetricsConfig: MetricConfig[] = [
    {
        id: 'total',
        title: 'Total Projects',
        icon: 'FaList',
        color: 'blue.500',
        type: 'count',
        calculation: {
            type: 'total',
        },
    },
    {
        id: 'active',
        title: 'Active Projects',
        icon: 'FaCheck',
        color: 'green.500',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'projectStatus',
            value: 'active',
            operator: '=',
        },
    },
    {
        id: 'inactive',
        title: 'Inactive Projects',
        icon: 'FaUserTimes',
        color: 'red.500',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'projectStatus',
            value: 'inactive',
            operator: '=',
        },
    },
    {
        id: 'pending',
        title: 'Pending Records',
        icon: 'FaHourglassHalf',
        color: 'orange.500',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'projectStatus',
            value: 'pending',
            operator: '=',
        },
    },
]

const reserveDaysMetricsConfig: MetricConfig[] = [
    {
        id: 'total',
        title: 'סה"כ צווים',
        icon: 'FaList',
        color: 'blue.500',
        type: 'count',
        calculation: {
            type: 'total',
        },
    },
    {
        id: 'pending',
        title: 'ממתינים לאישור',
        icon: 'FaHourglassHalf',
        color: 'orange.500',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'requestStatus',
            value: 'pending',
            operator: '=',
        },
    },
    {
        id: 'approved',
        title: 'אושרו',
        icon: 'FaCheck',
        color: 'green.500',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'requestStatus',
            value: 'approved',
            operator: '=',
        },
    },

    {
        id: 'denied',
        title: 'נדחו',
        icon: 'FaTimes',
        color: 'red.600',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'requestStatus',
            value: 'denied',
            operator: '=',
        },
    },
]

const personnelMetricsConfig: MetricConfig[] = [
    {
        id: 'active',
        title: 'Active Personnel',
        icon: 'FaUserCheck',
        color: 'green.500',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'isActive',
            value: 'true',
            operator: '=',
        },
    },
    {
        id: 'notActive',
        title: 'Inactive Personnel',
        icon: 'FaUserCheck',
        color: 'red.500',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'isActive',
            value: 'false',
            operator: '=',
        },
    },
    {
        id: 'TotalPersonnel',
        title: 'Total Personnel',
        icon: 'FaUserCheck',
        color: 'blue.500',
        type: 'sum',
        calculation: {
            type: 'total',
            aggregateField: 'isActive',
        },
    },
]

export const addMetricsToProjectForm = async () => {
    try {
        logger.info(
            'Adding metrics configuration to Project Management form...'
        )

        const result = await FormFields.updateOne(
            { formName: 'Project Management' },
            {
                $set: {
                    metrics: projectMetricsConfig,
                    updatedAt: new Date(),
                },
            }
        )

        if (result.matchedCount === 0) {
            logger.info('Project Management form not found')
            return
        }

        logger.info('✅ Successfully added metrics to Project Management form')
    } catch (error) {
        logger.error(
            '❌ Error adding metrics to Project Management form:',
            error
        )
    }
}

export const addMetricsToPersonnelForm = async () => {
    try {
        logger.info('Adding metrics configuration to Personnel form...')

        const result = await FormFields.updateOne(
            { formName: 'Personnel' }, // Hebrew name for Personnel
            {
                $set: {
                    metrics: personnelMetricsConfig,
                    updatedAt: new Date(),
                },
            }
        )

        if (result.matchedCount === 0) {
            logger.info('Personnel form not found')
            return
        }

        logger.info('✅ Successfully added metrics to Personnel form')
    } catch (error) {
        logger.error('❌ Error adding metrics to Personnel form:', error)
    }
}

export const addMetricsToReserveDaysForm = async () => {
    try {
        logger.info(
            'Adding metrics configuration to Reserve Days Management form...'
        )

        const result = await FormFields.updateOne(
            { formName: 'reserve_days_management' },
            {
                $set: {
                    metrics: reserveDaysMetricsConfig,
                    updatedAt: new Date(),
                },
            }
        )

        if (result.matchedCount === 0) {
            logger.info('Reserve Days Management form not found')
            return
        }

        logger.info(
            '✅ Successfully added metrics to Reserve Days Management form'
        )
    } catch (error) {
        logger.error(
            '❌ Error adding metrics to Reserve Days Management form:',
            error
        )
    }
}

export const addMetricsToAllForms = async () => {
    try {
        logger.info('🚀 Starting metrics configuration migration...')

        await addMetricsToProjectForm()
        await addMetricsToPersonnelForm()
        await addMetricsToReserveDaysForm()

        logger.info(
            '✅ Metrics configuration migration completed successfully!'
        )
    } catch (error) {
        logger.error('❌ Migration failed:', error)
    }
}
