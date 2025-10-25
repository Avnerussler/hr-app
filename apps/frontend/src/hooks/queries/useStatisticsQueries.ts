import { useQuery } from '@tanstack/react-query'

/**
 * Report data structure returned from the API
 */
export interface ReportData {
    headers: string[]
    rows: any[][]
}

/**
 * API response structure
 */
interface StatisticsResponse {
    data: ReportData
    metadata: {
        startDate?: string
        endDate?: string
        date?: string
        generatedAt: string
    }
}

/**
 * Multiple reports response structure
 */
interface MultipleReportsResponse {
    data: Record<string, ReportData>
    metadata: {
        startDate: string
        endDate: string
        generatedAt: string
    }
}

/**
 * Personnel list item
 */
export interface PersonnelListItem {
    name: string
    personalNumber: string
    projectName: string
    fundingSource: string
    startDate: string
    endDate: string
}

/**
 * Personnel list response
 */
interface PersonnelListResponse {
    data: PersonnelListItem[]
    metadata: {
        date: string
        projectName?: string
        fundingSource?: string
        count: number
    }
}

/**
 * Hook to fetch daily summary report
 * סכימת ימי מילואים יומית
 */
export const useDailySummaryQuery = () => {
    return useQuery<StatisticsResponse, Error>({
        queryKey: ['statistics/daily-summary', undefined],
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

/**
 * Hook to fetch date range summary report
 * סכימת ימי מילואים לפי טווח תאריכים
 */
export const useDateRangeSummaryQuery = (
    startDate: string,
    endDate: string
) => {
    return useQuery<StatisticsResponse, Error>({
        queryKey: [
            'statistics/date-range-summary',
            undefined,
            { startDate, endDate },
        ],
        staleTime: 1000 * 60 * 5,
        enabled: !!startDate && !!endDate,
    })
}

/**
 * Hook to fetch project analytics report
 * סכימה לפי פרויקטים
 */
export const useProjectAnalyticsQuery = (
    startDate: string,
    endDate: string
) => {
    return useQuery<StatisticsResponse, Error>({
        queryKey: [
            'statistics/project-analytics',
            undefined,
            { startDate, endDate },
        ],
        staleTime: 1000 * 60 * 5,
        enabled: !!startDate && !!endDate,
    })
}

/**
 * Hook to fetch external by unit report
 * סכימת ימי מילואים חיצוניים לפי יחידות
 */
export const useExternalByUnitQuery = (startDate: string, endDate: string) => {
    return useQuery<StatisticsResponse, Error>({
        queryKey: [
            'statistics/external-by-unit',
            undefined,
            { startDate, endDate },
        ],
        staleTime: 1000 * 60 * 5,
        enabled: !!startDate && !!endDate,
    })
}

/**
 * Hook to fetch multiple reports at once
 * Fetches multiple report types in a single request
 */
export const useMultipleReportsQuery = (
    reportTypes: string[],
    startDate: string,
    endDate: string
) => {
    return useQuery<MultipleReportsResponse, Error>({
        queryKey: [
            'statistics/reports',
            undefined,
            { reportTypes: reportTypes.join(','), startDate, endDate },
        ],
        staleTime: 1000 * 60 * 5,
        enabled: reportTypes.length > 0 && !!startDate && !!endDate,
    })
}

/**
 * Hook to fetch personnel list for a specific date/project/funding source
 * Used when clicking on numbers in reports to see detailed list
 */
export const usePersonnelListQuery = (
    date: string,
    projectName?: string,
    fundingSource?: 'internal' | 'external'
) => {
    return useQuery<PersonnelListResponse, Error>({
        queryKey: [
            'statistics/personnel-list',
            undefined,
            { date, projectName, fundingSource },
        ],
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled: !!date,
    })
}

/**
 * Hook to fetch a specific report type
 * Generic hook that can be used for any report type
 */
export const useStatisticsReportQuery = (
    reportType: string,
    startDate: string,
    endDate: string
) => {
    const endpoint = `statistics/${reportType.replace('_', '-')}`

    return useQuery<StatisticsResponse, Error>({
        queryKey: [endpoint, undefined, { startDate, endDate }],
        staleTime: 1000 * 60 * 5,
        enabled: !!reportType && !!startDate && !!endDate,
    })
}
