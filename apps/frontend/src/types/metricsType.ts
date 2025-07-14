export interface MetricConfig {
    id: string
    title: string
    icon?: string
    color?: string
    type: 'count' | 'sum' | 'average' | 'percentage'
    calculation: MetricCalculation
}

export interface MetricCalculation {
    type: 'total' | 'filtered' | 'aggregated'
    field?: string // Field to filter on (for filtered type)
    value?: string | number // Value to filter by (for filtered type)
    aggregateField?: string // Field to aggregate (for aggregated type)
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'includes' | 'excludes'
}

export interface FormMetrics {
    formId: string
    formName: string
    metrics: MetricConfig[]
}

export interface CalculatedMetric {
    id: string
    title: string
    value: number
    icon?: string
    color?: string
}
