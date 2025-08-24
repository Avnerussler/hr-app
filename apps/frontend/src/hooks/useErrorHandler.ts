import { useCallback } from 'react'
import { toaster } from '@/components/ui/toaster'

export const useErrorHandler = () => {
    const handleError = useCallback((error: any, context?: string) => {
        console.error(`Error ${context ? `in ${context}` : ''}:`, error)
        
        // Extract meaningful error message
        let errorMessage = 'אירעה שגיאה בלתי צפויה'
        
        try {
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                errorMessage = error.response.data.errors.join(', ')
            } else if (error?.message) {
                errorMessage = error.message
            }
            
            // Handle specific error types
            if (error?.response?.status === 400) {
                errorMessage = error?.response?.data?.message || 'נתונים לא תקינים'
            } else if (error?.response?.status === 401) {
                errorMessage = 'אין הרשאה לביצוע פעולה זו'
            } else if (error?.response?.status === 403) {
                errorMessage = 'אין הרשאה לגשת למשאב זה'
            } else if (error?.response?.status === 404) {
                errorMessage = 'המשאב לא נמצא'
            } else if (error?.response?.status >= 500) {
                errorMessage = 'שגיאת שרת, אנא נסה שוב מאוחר יותר'
            }
        } catch (parseError) {
            console.error('Error parsing error message:', parseError)
        }
        
        toaster.error({
            title: 'שגיאה',
            description: errorMessage,
            duration: 5000,
        })
        
        return errorMessage
    }, [])

    const wrapAsync = useCallback(<T extends (...args: any[]) => Promise<any>>(
        fn: T, 
        context?: string
    ): T => {
        return (async (...args: any[]) => {
            try {
                return await fn(...args)
            } catch (error) {
                handleError(error, context)
                throw error // Re-throw so calling code can handle it if needed
            }
        }) as T
    }, [handleError])

    return { handleError, wrapAsync }
}