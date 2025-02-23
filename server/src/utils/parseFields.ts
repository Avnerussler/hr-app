type FormFields = { [key: string]: any }

export function parseFields(formFields: FormFields): FormFields {
    const result: FormFields = {}

    for (const [key, value] of Object.entries(formFields)) {
        result[key] = parseIfJson(value)
    }

    return result
}

function parseIfJson(value: unknown): unknown {
    if (typeof value !== 'string') return value // Return as is if not a string

    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) || typeof parsed === 'object'
            ? parsed
            : value
    } catch {
        return value // Return original value if parsing fails
    }
}
