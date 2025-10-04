import { useQuery } from '@tanstack/react-query'
import type { DailyQuota, QuotaResponse, QuotaQueryParams } from '@/types/workHoursType'
import type { QuotaWithOccupancy, QuotasWithOccupancyResponse } from './types'

/**
 * Hook to fetch quotas with optional filtering and pagination
 */
export const useQuotasQuery = (params?: QuotaQueryParams) => {
    return useQuery<QuotaResponse, Error>({
        queryKey: ['quotas', undefined, params], // [url, pathParams, queryParams]
        staleTime: 1000 * 60 * 5, // 5 minutes - quotas don't change often
        enabled: true,
    })
}

/**
 * Hook to fetch a single quota by ID
 */
export const useQuotaQuery = (id: string) => {
    return useQuery<DailyQuota, Error>({
        queryKey: ['quotas', id],
        staleTime: 1000 * 60 * 5,
        enabled: !!id,
    })
}

/**
 * Hook to fetch quota with current occupancy for a specific date
 */
export const useQuotaWithOccupancyQuery = (date: string) => {
    return useQuery<QuotaWithOccupancy, Error>({
        queryKey: ['quotas/date', date],
        staleTime: 1000 * 60 * 2, // 2 minutes - occupancy changes more frequently
        enabled: !!date,
    })
}

/**
 * Hook to fetch quotas for a date range (without occupancy - faster)
 */
export const useQuotasRangeQuery = (startDate: string, endDate: string) => {
    return useQuery<QuotaResponse, Error>({
        queryKey: ['quotas/range', `${startDate}/${endDate}`],
        staleTime: 1000 * 60 * 5,
        enabled: !!startDate && !!endDate,
    })
}

/**
 * Hook to fetch quotas with occupancy data for a date range (for calendar view)
 * This is the main hook for the calendar component
 */
export const useQuotasWithOccupancyRangeQuery = (
    startDate: string,
    endDate: string
) => {
    return useQuery<QuotasWithOccupancyResponse, Error>({
        queryKey: ['quotas/occupancy/range', `${startDate}/${endDate}`],
        staleTime: 1000 * 60 * 2, // 2 minutes - occupancy data needs to be fresh
        enabled: !!startDate && !!endDate,
        refetchOnWindowFocus: true, // Refetch when user returns to tab
        refetchOnMount: true, // Always refetch on component mount
    })
}

/**
 * Hook to get occupancy data only for a date range (lightweight)
 */
export const useOccupancyRangeQuery = (startDate: string, endDate: string) => {
    return useQuery<Record<string, number>, Error>({
        queryKey: ['quotas/occupancy/range', `${startDate}/${endDate}`, { occupancyOnly: true }],
        staleTime: 1000 * 60 * 1, // 1 minute - most frequent updates
        enabled: !!startDate && !!endDate,
    })
}
