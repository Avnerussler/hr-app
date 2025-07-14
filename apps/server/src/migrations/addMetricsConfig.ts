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
            value: 'Active',
            operator: '=',
        },
    },
    {
        id: 'paused',
        title: 'Paused Projects',
        icon: 'FaUserTimes',
        color: 'orange.500',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'status',
            value: 'Paused',
            operator: '=',
        },
    },
    {
        id: 'done',
        title: 'Done Projects',
        icon: 'FaUserCheck',
        color: 'green.600',
        type: 'count',
        calculation: {
            type: 'filtered',
            field: 'status',
            value: 'Done',
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
            value: 'Inactive',
            operator: '=',
        },
    },
    {
        id: 'totalDays',
        title: 'Total Days Allocated',
        icon: 'FaUsers',
        color: 'purple.500',
        type: 'sum',
        calculation: {
            type: 'aggregated',
            aggregateField: 'daysAllocated',
        },
    },
    {
        id: 'totalPeople',
        title: 'Total People Assigned',
        icon: 'FaUsers',
        color: 'teal.500',
        type: 'sum',
        calculation: {
            type: 'aggregated',
            aggregateField: 'peopleAssigned',
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
            { formName: 'Personnel' }, // Hebrew name for Personnel
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
