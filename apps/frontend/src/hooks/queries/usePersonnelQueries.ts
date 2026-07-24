import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import { Personnel } from '@hr-app/shared-types'

export interface PersonnelRecord extends Omit<Personnel, 'assignedProjects'> {
    _id: string
    assignedProjects: { _id: string; projectName: string } | null
    createdAt: string
    updatedAt: string
    /** Field ids the current search term matched on — only present when a search is active. */
    matchedFields?: string[]
}

export interface PersonnelListParams {
    page: number
    limit: number
    search?: string
    filters?: Record<string, unknown>
    sortField?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PersonnelListResponse {
    items: PersonnelRecord[]
    pagination: { page: number; limit: number; total: number; pages: number }
}

export function usePersonnelListQuery(params: PersonnelListParams) {
    return useQuery<PersonnelListResponse>({
        queryKey: ['personnel', 'list', params],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/personnel`, {
                params: { ...params, filters: params.filters ? JSON.stringify(params.filters) : undefined },
            })
            return data
        },
    })
}

export function usePersonnelDetailQuery(id: string | undefined) {
    return useQuery<PersonnelRecord>({
        queryKey: ['personnel', 'detail', id],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/personnel/${id}`)
            return data
        },
        enabled: !!id,
    })
}

export interface CalculatedMetric {
    id: string
    title: string
    value: number
    icon?: string
    color?: string
}

export function usePersonnelMetricsQuery() {
    return useQuery<CalculatedMetric[]>({
        queryKey: ['personnel', 'metrics'],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/personnel/metrics`)
            return data
        },
    })
}

export interface ProjectOption {
    value: string
    label: string
}

export interface ProjectOptionsResponse {
    options: ProjectOption[]
    pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

const PROJECT_OPTIONS_PAGE_SIZE = 20

export function useProjectOptionsQuery(search: string, page: number) {
    return useQuery<ProjectOptionsResponse>({
        queryKey: ['projects', 'options', search, page],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/projects/options`, {
                params: { search, page, limit: PROJECT_OPTIONS_PAGE_SIZE },
            })
            return data
        },
    })
}

export function useProjectOptionsByIdsQuery(ids: string[]) {
    return useQuery<ProjectOption[]>({
        queryKey: ['projects', 'options', 'byIds', ids],
        queryFn: async () => {
            const { data } = await axios.post(`${BASE_URL}/projects/options/byIds`, { ids })
            return data
        },
        enabled: ids.length > 0,
    })
}
