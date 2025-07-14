import { useMemo } from 'react'
import {
    MetricConfig,
    MetricCalculation,
    CalculatedMetric,
} from '@/types/metricsType'

/**
 * Custom hook to calculate metrics from form data
 */
export const useMetrics = (
    data: Record<string, any>[] | undefined,
    metricsConfig?: MetricConfig[]
): CalculatedMetric[] => {
    return useMemo(() => {
        if (!metricsConfig || metricsConfig.length === 0) {
            console.log('No metrics config provided')
            return []
        }

        // If no data, return metrics with 0 values
        if (!data || data.length === 0) {
            console.log('No data provided, returning metrics with 0 values')
            return metricsConfig.map((metric) => ({
                id: metric.id,
                title: metric.title,
                value: 0,
                icon: metric.icon,
                color: metric.color,
            }))
        }

        return metricsConfig.map((metric) => {
            const value = calculateMetric(data, metric.calculation)
            console.log(`Calculated metric "${metric.title}": ${value}`)
            return {
                id: metric.id,
                title: metric.title,
                value,
                icon: metric.icon,
                color: metric.color,
            }
        })
    }, [data, metricsConfig])
}

/**
 * Calculate a single metric based on its configuration
 */
const calculateMetric = (
    data: Record<string, any>[],
    calculation: MetricCalculation
): number => {
    switch (calculation.type) {
        case 'total':
            return data.length

        case 'filtered':
            if (!calculation.field || calculation.value === undefined) return 0

            return data.filter((item) => {
                const fieldValue = getNestedValue(item, calculation.field!)
                return compareValues(
                    fieldValue,
                    calculation.value!,
                    calculation.operator || '='
                )
            }).length

        case 'aggregated':
            if (!calculation.aggregateField) return 0

            return data.reduce((sum, item) => {
                const fieldValue = getNestedValue(
                    item,
                    calculation.aggregateField!
                )
                const numValue =
                    typeof fieldValue === 'number'
                        ? fieldValue
                        : parseFloat(fieldValue) || 0
                return sum + numValue
            }, 0)

        default:
            return 0
    }
}

/**
 * Get nested value from object using dot notation (e.g., 'user.profile.name')
 */
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Compare two values based on operator
 */
const compareValues = (
    fieldValue: any,
    targetValue: any,
    operator: string
): boolean => {
    switch (operator) {
        case '=':
            return fieldValue === targetValue
        case '!=':
            return fieldValue !== targetValue
        case '>':
            return Number(fieldValue) > Number(targetValue)
        case '<':
            return Number(fieldValue) < Number(targetValue)
        case '>=':
            return Number(fieldValue) >= Number(targetValue)
        case '<=':
            return Number(fieldValue) <= Number(targetValue)
        case 'includes':
            return String(fieldValue)
                .toLowerCase()
                .includes(String(targetValue).toLowerCase())
        case 'excludes':
            return !String(fieldValue)
                .toLowerCase()
                .includes(String(targetValue).toLowerCase())
        default:
            return fieldValue === targetValue
    }
}

/**
 * Get default metrics configuration if none provided
 */
export const getDefaultMetrics = (formName: string): MetricConfig[] => {
    const baseName = formName.toLowerCase()

    return [
        {
            id: 'total',
            title: `Total ${formName}`,
            icon: 'FaList',
            color: 'blue.500',
            type: 'count',
            calculation: { type: 'total' },
        },
        {
            id: 'active',
            title: 'Active',
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
            title: 'Inactive',
            icon: 'FaTimes',
            color: 'red.500',
            type: 'count',
            calculation: {
                type: 'filtered',
                field: 'status',
                value: 'inactive',
                operator: '=',
            },
        },
    ]
}
