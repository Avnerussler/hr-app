export interface WorkHour {
    _id: string
    employeeId: string
    employeeName: string
    projectId?: string
    projectName?: string
    date: string
    hours: number
    notes?: string
    status: 'draft' | 'submitted' | 'approved' | 'rejected'
    submittedBy: string
    submittedAt?: string
    approvedBy?: string
    approvedAt?: string
    createdAt: string
    updatedAt: string
    weekNumber: number
    yearWeek: string
}

export interface WorkHoursResponse {
    workHours: WorkHour[]
    pagination?: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

export interface WorkHourMetrics {
    totalHours: number
    activeEmployees: number
    totalEntries: number
    avgHoursPerDay: number
    avgHoursPerEmployee: number
}

export interface WorkHourMetricsResponse {
    metrics: WorkHourMetrics
}

export interface CreateWorkHourParams {
    employeeId: string
    employeeName: string
    projectId?: string
    projectName?: string
    date: string
    hours: number
    notes?: string
    submittedBy: string
}

export interface UpdateWorkHourParams {
    id: string
    projectId?: string
    projectName?: string
    hours?: number
    notes?: string
    status?: 'draft' | 'submitted' | 'approved' | 'rejected'
}

export interface BulkCreateWorkHourParams {
    entries: CreateWorkHourParams[]
    submittedBy: string
}

export interface WeeklyWorkHourParams {
    weekStart: string
    submittedBy: string
    employees: {
        id: string
        name: string
        weekHours: {
            hours: number
            projectId?: string
            projectName?: string
            notes?: string
        }[]
    }[]
}

export interface WorkHourQueryParams {
    startDate?: string
    endDate?: string
    employeeId?: string
    projectId?: string
    status?: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected'
    page?: number
    limit?: number
}

export interface BulkUpdateWorkHourParams {
    updates: {
        id: string
        projectId?: string
        projectName?: string
        hours?: number
        notes?: string
        status?: 'draft' | 'submitted' | 'approved' | 'rejected'
    }[]
}

export interface SubmitWorkHoursParams {
    workHourIds: string[]
}

export interface ApproveWorkHoursParams {
    workHourIds: string[]
    approvedBy: string
}

// Re-export types for components (already exported above)

// Quota Management Types
export interface DailyQuota {
    _id: string
    date: string
    quota: number
    createdAt: string
    updatedAt: string
    createdBy: string
    notes?: string
}

export interface QuotaRange {
    startDate: string
    endDate?: string
    quota: number
    notes?: string
}

export interface CreateQuotaParams {
    startDate: string
    endDate?: string
    quota: number
    notes?: string
    createdBy: string
}

export interface UpdateQuotaParams {
    id: string
    quota?: number
    notes?: string
}

export interface QuotaQueryParams {
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
}

export interface QuotaResponse {
    data: { quotas: DailyQuota[] }
    pagination?: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

// Calendar View Types
export type CalendarView = 'weekly' | 'monthly'

export interface CalendarDay {
    date: string
    isToday: boolean
    isCurrentMonth: boolean
    quota?: number
    currentOccupancy: number
    isWeekend?: boolean
}

export interface CalendarWeek {
    days: CalendarDay[]
    weekNumber: number
}

export interface CalendarMonth {
    weeks: CalendarWeek[]
    monthName: string
    year: number
    month: number
}

// Additional interfaces for UI components
export interface WorkHourFormData {
    employeeId: string
    employeeName: string
    date: string
    hours: number
    projectId?: string
    projectName?: string
    notes?: string
}
