import { FormFields } from '../models'
import { MetricConfig } from '../types'

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
            field: 'status',
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
            field: 'status',
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
            field: 'status',
            value: 'pending',
            operator: '=',
        },
    },
    {
        id: 'byTypeFullTime',
        title: 'Full-Time Type',
        icon: 'FaUserTie',
        color: 'cyan.600',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'type',
            value: 'full',
            operator: '=',
        },
    },
    {
        id: 'byTypePartTime',
        title: 'Part-Time Type',
        icon: 'FaUserClock',
        color: 'teal.600',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'type',
            value: 'part',
            operator: '=',
        },
    },
    {
        id: 'byTypeContract',
        title: 'Contractor Type',
        icon: 'FaUserSecret',
        color: 'purple.600',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'type',
            value: 'contract',
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
            field: 'personnelStatus',
            value: 'active',
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
            field: 'personnelStatus',
            value: 'notActive',
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
            aggregateField: 'personnelStatus',
        },
    },
]

export const addMetricsToProjectForm = async () => {
    try {
        console.log(
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
            console.log('Project Management form not found')
            return
        }

        console.log('✅ Successfully added metrics to Project Management form')
    } catch (error) {
        console.error(
            '❌ Error adding metrics to Project Management form:',
            error
        )
    }
}

export const addMetricsToPersonnelForm = async () => {
    try {
        console.log('Adding metrics configuration to Personnel form...')

        const result = await FormFields.updateOne(
            { formName: 'Recruitment Form' }, // Hebrew name for Personnel
            {
                $set: {
                    metrics: personnelMetricsConfig,
                    updatedAt: new Date(),
                },
            }
        )

        if (result.matchedCount === 0) {
            console.log('Personnel form not found')
            return
        }

        console.log('✅ Successfully added metrics to Personnel form')
    } catch (error) {
        console.error('❌ Error adding metrics to Personnel form:', error)
    }
}

export const addMetricsToAllForms = async () => {
    try {
        console.log('🚀 Starting metrics configuration migration...')

        await addMetricsToProjectForm()
        await addMetricsToPersonnelForm()

        console.log(
            '✅ Metrics configuration migration completed successfully!'
        )
    } catch (error) {
        console.error('❌ Migration failed:', error)
    }
}
