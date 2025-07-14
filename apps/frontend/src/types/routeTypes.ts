// Route parameter types for type-safe routing
export interface FormRouteParams extends Record<string, string | undefined> {
    formName: string
    formId: string
    itemId?: string
}

export interface EditRouteParams extends FormRouteParams {
    itemId: string
}

export type FormState = 'view' | 'edit' | 'new'

export interface RouteContext {
    formName: string
    formId: string
    formState: FormState
    itemId?: string
}

// Route path generators for consistent URL building
export const generateFormPath = (formName: string, formId: string): string => {
    return `/${formName}/${formId}`
}

export const generateEditPath = (formName: string, formId: string, itemId: string): string => {
    return `/${formName}/${formId}/edit/${itemId}`
}

export const generateNewPath = (formName: string, formId: string): string => {
    return `/${formName}/${formId}/new`
}

// Hook to parse route context from current location
export const parseRouteContext = (pathname: string): RouteContext => {
    const segments = pathname.split('/').filter(Boolean)
    
    const formName = segments[0] || ''
    const formId = segments[1] || ''
    const stateOrItemId = segments[2]
    const itemId = segments[3]
    
    let formState: FormState = 'view'
    let extractedItemId: string | undefined
    
    if (stateOrItemId === 'edit' && itemId) {
        formState = 'edit'
        extractedItemId = itemId
    } else if (stateOrItemId === 'new') {
        formState = 'new'
    }
    
    return {
        formName,
        formId,
        formState,
        itemId: extractedItemId
    }
}