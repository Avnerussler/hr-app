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