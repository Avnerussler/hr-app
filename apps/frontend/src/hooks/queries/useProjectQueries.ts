import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import { Project } from '@hr-app/shared-types'

export interface PersonnelSummary {
    _id: string
    firstName: string
    lastName: string
    personalNumber: string
}

export interface ProjectRecord extends Omit<Project, 'projectManager' | 'projectPersonnel'> {
    _id: string
    projectManager: PersonnelSummary | null
    projectPersonnel: PersonnelSummary[]
    createdAt: string
    updatedAt: string
}

export interface ProjectListParams {
    page: number
    limit: number
    search?: string
    filters?: Record<string, unknown>
    sortField?: string
    sortOrder?: 'asc' | 'desc'
}

export interface ProjectListResponse {
    items: ProjectRecord[]
    pagination: { page: number; limit: number; total: number; pages: number }
}

export function useProjectListQuery(params: ProjectListParams) {
    return useQuery<ProjectListResponse>({
        queryKey: ['projects', 'list', params],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/projects`, {
                params: { ...params, filters: params.filters ? JSON.stringify(params.filters) : undefined },
            })
            return data
        },
    })
}

export function useProjectDetailQuery(id: string | undefined) {
    return useQuery<ProjectRecord>({
        queryKey: ['projects', 'detail', id],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/projects/${id}`)
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

export function useProjectMetricsQuery() {
    return useQuery<CalculatedMetric[]>({
        queryKey: ['projects', 'metrics'],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/projects/metrics`)
            return data
        },
    })
}

export interface PersonnelOption {
    value: string
    label: string
    metadata?: { isActive: boolean }
}

export interface PersonnelOptionsResponse {
    options: PersonnelOption[]
    pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

const PERSONNEL_OPTIONS_PAGE_SIZE = 20

export function usePersonnelOptionsQuery(search: string, page: number) {
    return useQuery<PersonnelOptionsResponse>({
        queryKey: ['personnel', 'options', search, page],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/personnel/options`, {
                params: { search, page, limit: PERSONNEL_OPTIONS_PAGE_SIZE },
            })
            return data
        },
    })
}

/** Resolves options for ids that may not be in the current search-filtered list (e.g. the currently selected value). */
export function usePersonnelOptionsByIdsQuery(ids: string[]) {
    return useQuery<PersonnelOption[]>({
        queryKey: ['personnel', 'options', 'byIds', ids],
        queryFn: async () => {
            const { data } = await axios.post(`${BASE_URL}/personnel/options/byIds`, { ids })
            return data
        },
        enabled: ids.length > 0,
    })
}
