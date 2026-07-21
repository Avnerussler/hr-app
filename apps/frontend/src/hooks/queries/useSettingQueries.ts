import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BASE_URL } from '@/config'
import { Setting } from '@hr-app/shared-types'

export interface SettingRecord extends Setting {
    _id: string
    createdAt: string
    updatedAt: string
}

export function useSettingListQuery() {
    return useQuery<SettingRecord[]>({
        queryKey: ['settings', 'list'],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/settings`)
            return data
        },
        staleTime: 1000 * 60 * 5,
    })
}

export function useSettingDetailQuery(id: string | undefined) {
    return useQuery<SettingRecord>({
        queryKey: ['settings', 'detail', id],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/settings/${id}`)
            return data
        },
        enabled: !!id,
    })
}

export function useSettingByKeyQuery(key: string | undefined) {
    return useQuery<SettingRecord>({
        queryKey: ['settings', 'byKey', key],
        queryFn: async () => {
            const { data } = await axios.get(`${BASE_URL}/settings/key/${key}`)
            return data
        },
        enabled: !!key,
        staleTime: 1000 * 60 * 5,
    })
}

/**
 * Live, DB-driven replacement for a static `<X>_LABELS` map: fetches the setting for
 * `key` and returns its active options as `{value,label}[]` (for a select) plus the
 * plain allowed-values list (for client-side revalidation against removed/stale options).
 */
export function useSettingOptions(key: string) {
    const { data: setting } = useSettingByKeyQuery(key)
    return useMemo(() => {
        const activeOptions = (setting?.options ?? []).filter((o) => o.isActive)
        return {
            options: activeOptions.map((o) => ({ value: o.value, label: o.label })),
            allowedValues: activeOptions.map((o) => o.value),
        }
    }, [setting])
}
