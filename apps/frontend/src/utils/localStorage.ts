/**
 * Utility functions for localStorage operations with error handling and type safety
 */

export interface LocalStorageUtils {
    setItem: <T>(key: string, value: T) => boolean
    getItem: <T>(key: string, defaultValue?: T) => T | null
    removeItem: (key: string) => boolean
    clear: () => boolean
    exists: (key: string) => boolean
}

/**
 * Safe localStorage operations with error handling
 */
export const localStorage: LocalStorageUtils = {
    /**
     * Store data in localStorage
     * @param key - Storage key
     * @param value - Value to store (will be JSON stringified)
     * @returns boolean - Success status
     */
    setItem: <T>(key: string, value: T): boolean => {
        try {
            if (typeof window === 'undefined') return false
            window.localStorage.setItem(key, JSON.stringify(value))
            return true
        } catch (error) {
            console.warn(`Failed to save to localStorage (key: ${key}):`, error)
            return false
        }
    },

    /**
     * Retrieve data from localStorage
     * @param key - Storage key
     * @param defaultValue - Default value if key doesn't exist
     * @returns Parsed value or null/defaultValue
     */
    getItem: <T>(key: string, defaultValue?: T): T | null => {
        try {
            if (typeof window === 'undefined') return defaultValue || null
            const item = window.localStorage.getItem(key)
            if (item === null) return defaultValue || null
            return JSON.parse(item) as T
        } catch (error) {
            console.warn(
                `Failed to read from localStorage (key: ${key}):`,
                error
            )
            return defaultValue || null
        }
    },

    /**
     * Remove item from localStorage
     * @param key - Storage key
     * @returns boolean - Success status
     */
    removeItem: (key: string): boolean => {
        try {
            if (typeof window === 'undefined') return false
            window.localStorage.removeItem(key)
            return true
        } catch (error) {
            console.warn(
                `Failed to remove from localStorage (key: ${key}):`,
                error
            )
            return false
        }
    },

    /**
     * Clear all localStorage data
     * @returns boolean - Success status
     */
    clear: (): boolean => {
        try {
            if (typeof window === 'undefined') return false
            window.localStorage.clear()
            return true
        } catch (error) {
            console.warn('Failed to clear localStorage:', error)
            return false
        }
    },

    /**
     * Check if key exists in localStorage
     * @param key - Storage key
     * @returns boolean - Existence status
     */
    exists: (key: string): boolean => {
        try {
            if (typeof window === 'undefined') return false
            return window.localStorage.getItem(key) !== null
        } catch (error) {
            console.warn(`Failed to check localStorage (key: ${key}):`, error)
            return false
        }
    },
}

/**
 * Hook-like function for table state persistence
 */
export interface TableState {
    sorting: { id: string; desc: boolean }[]
    columnFilters: { id: string; value: unknown }[]
    globalFilter: string
}

export const createTableStateManager = (tableId: string) => {
    const STORAGE_KEY = `table_state_${tableId}`

    return {
        /**
         * Save table state to localStorage
         */
        saveTableState: (state: TableState): boolean => {
            return localStorage.setItem(STORAGE_KEY, state)
        },

        /**
         * Load table state from localStorage
         */
        loadTableState: (): TableState => {
            const defaultState: TableState = {
                sorting: [],
                columnFilters: [],
                globalFilter: '',
            }

            return (
                localStorage.getItem<TableState>(STORAGE_KEY, defaultState) ||
                defaultState
            )
        },

        /**
         * Clear table state from localStorage
         */
        clearTableState: (): boolean => {
            return localStorage.removeItem(STORAGE_KEY)
        },
    }
}

export default localStorage
