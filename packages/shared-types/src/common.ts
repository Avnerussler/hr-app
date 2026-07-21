import { z } from 'zod'

export const ObjectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'מזהה לא תקין')
export type ObjectIdString = z.infer<typeof ObjectIdString>
