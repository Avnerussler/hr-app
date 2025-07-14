import { useLocation, useParams } from 'react-router-dom'
import {
    FormRouteParams,
    RouteContext,
    parseRouteContext,
} from '@/types/routeTypes'

/**
 * Custom hook to get type-safe route context
 * Uses React Router's useParams when available, falls back to pathname parsing
 */
export const useRouteContext = (): RouteContext => {
    const location = useLocation()
    const params = useParams<FormRouteParams>()

    // For edit routes, we can use the itemId param
    if (params.itemId) {
        const routeContext = parseRouteContext(location.pathname)
        return {
            ...routeContext,
            itemId: params.itemId,
        }
    }

    // For all other cases, use pathname parsing
    return parseRouteContext(location.pathname)
}

/**
 * Hook to check if drawer should be open based on current route
 */
export const useDrawerState = (): boolean => {
    const location = useLocation()
    return (
        location.pathname.includes('/new') ||
        location.pathname.includes('/edit/')
    )
}

/**
 * Hook to get form state with type safety
 */
export const useFormState = (): 'view' | 'edit' | 'new' => {
    const { formState } = useRouteContext()
    return formState
}
