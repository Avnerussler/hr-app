// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react'

/**
 * A hook that debounces a value. The returned value will only update after the
 * specified delay has passed without the input value changing.
 *
 * @param value The value to debounce
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timeout)
        }
    }, [value, delay])

    return debouncedValue
}

export default useDebounce
