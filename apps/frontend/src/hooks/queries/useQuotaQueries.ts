import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
    DailyQuota,
    QuotaResponse,
    QuotaQueryParams,
} from '@/types/workHoursType'
import { BASE_URL } from '@/config'

const API_ENDPOINTS = {
    GET_QUOTAS: 'quotas',
    GET_QUOTA: 'quotas',
    GET_QUOTA_WITH_OCCUPANCY: 'quotas/date',
    GET_QUOTAS_RANGE: 'quotas/range',
    GET_QUOTAS_WITH_OCCUPANCY_RANGE: 'quotas/occupancy/range',
}

// Type for quota with occupancy data
export interface QuotaWithOccupancy {
    date: string
    quota?: number
    currentOccupancy: number
    occupancyRate?: number
    capacityLeft: number
    capacityLeftPercent: number
}

export interface QuotasWithOccupancyResponse {
    data: QuotaWithOccupancy[]
    summary: {
        totalQuotas: number
        totalOccupancy: number
        totalCapacityLeft: number
        averageOccupancyRate: number
    }
}

/**
 * Hook to fetch quotas with optional filtering and pagination
 */
export const useQuotasQuery = (params?: QuotaQueryParams) => {
    return useQuery<QuotaResponse>({
        queryKey: ['quotas', params],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: API_ENDPOINTS.GET_QUOTAS,
                params,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes - quotas don't change often
        enabled: true,
    })
}

/**
 * Hook to fetch a single quota by ID
 */
export const useQuotaQuery = (id: string) => {
    return useQuery<DailyQuota>({
        queryKey: ['quota', id],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_QUOTA}/${id}`,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!id,
    })
}

/**
 * Hook to fetch quota with current occupancy for a specific date
 */
export const useQuotaWithOccupancyQuery = (date: string) => {
    return useQuery<QuotaWithOccupancy>({
        queryKey: ['quotaWithOccupancy', date],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_QUOTA_WITH_OCCUPANCY}/${date}`,
            })
            return response.data
        },
        staleTime: 1000 * 60 * 2, // 2 minutes - occupancy changes more frequently
        enabled: !!date,
    })
}

/**
 * Hook to fetch quotas for a date range (without occupancy - faster)
 */
export const useQuotasRangeQuery = (startDate: string, endDate: string) => {
    return useQuery<QuotaResponse>({
        queryKey: ['quotasRange', startDate, endDate],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_QUOTAS_RANGE}/${startDate}/${endDate}`,
            })
            return response.data
        },
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
    return useQuery<QuotasWithOccupancyResponse>({
        queryKey: ['quotasWithOccupancyRange', startDate, endDate],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_QUOTAS_WITH_OCCUPANCY_RANGE}/${startDate}/${endDate}`,
            })
            return response.data
        },
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
    return useQuery<Record<string, number>>({
        queryKey: ['occupancyRange', startDate, endDate],
        queryFn: async () => {
            const response = await axios({
                method: 'GET',
                baseURL: BASE_URL,
                url: `${API_ENDPOINTS.GET_QUOTAS_WITH_OCCUPANCY_RANGE}/${startDate}/${endDate}`,
                params: { occupancyOnly: true },
            })
            return response.data
        },
        staleTime: 1000 * 60 * 1, // 1 minute - most frequent updates
        enabled: !!startDate && !!endDate,
    })
}
