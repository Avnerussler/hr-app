// src/types/mutationTypes.ts
import { AxiosRequestConfig } from 'axios'

/**
 * Interface for mutation variables used by the defaultMutationFn
 */
export interface MutationVariables {
    url: string
    method?: AxiosRequestConfig['method']
    params?: string
    data?: unknown
}
