import { z } from 'zod'

export const StudioRole = z.enum([
    'algorithmDeveloper',
    'algorithmResearch',
    'backendDeveloper',
    'coo',
    'frontendDeveloper',
    'fullstackDeveloper',
    'hr',
    'hwEngineer',
    'productEngineer',
    'uxui',
    'fieldPerson',
    'wirelessOperator',
    'academia',
    'acoustician',
    'dataScience',
    'devops',
    'projectManager',
    'track',
    'kaman',
    'kamatz',
    'teamLead',
    'algorithmTeamLead',
    'softwareTeamLead',
    'partnerships',
    'operations',
    'performanceResearch',
    'other',
])
export type StudioRole = z.infer<typeof StudioRole>

export const STUDIO_ROLE_LABELS: Record<StudioRole, string> = {
    algorithmDeveloper: 'Algorithm developer',
    algorithmResearch: 'Algorithm Research',
    backendDeveloper: 'Backend Developer',
    coo: 'COO',
    frontendDeveloper: 'Frontend Developer',
    fullstackDeveloper: 'Fullstack Developer',
    hr: 'HR',
    hwEngineer: 'HW Engineer',
    productEngineer: 'Product Engineer',
    uxui: 'UX/UI',
    fieldPerson: 'איש שטח',
    wirelessOperator: 'אלחוטן',
    academia: 'אקדמיה',
    acoustician: 'אקוסטיקאי',
    dataScience: 'דאטה סיינס',
    devops: 'דבאופס',
    projectManager: 'מנהל פרויקט',
    track: 'מסלול',
    kaman: 'קמ"ן',
    kamatz: 'קמב"ץ',
    teamLead: 'ראש צוות',
    algorithmTeamLead: 'ראש צוות אלגוריתמיקה',
    softwareTeamLead: 'ראש צוות תוכנה',
    partnerships: 'שותפויות',
    operations: 'אופרציה',
    performanceResearch: 'חק"ב',
    other: 'אחר',
}

export const ClassificationClass = z.enum(['1', '2', '3', 'no'])
export type ClassificationClass = z.infer<typeof ClassificationClass>

export const CLASSIFICATION_CLASS_LABELS: Record<ClassificationClass, string> = {
    '1': '1',
    '2': '2',
    '3': '3',
    no: 'לא מסווג',
}

export const Layer = z.enum(['1', '2', '3'])
export type Layer = z.infer<typeof Layer>

export const LAYER_LABELS: Record<Layer, string> = {
    '1': '1',
    '2': '2',
    '3': '3',
}

export const ReserveCategory = z.enum([
    'reserves',
    'consultant',
    'permanentService',
    'mandatoryMilitaryService',
    'Other',
])
export type ReserveCategory = z.infer<typeof ReserveCategory>

export const RESERVE_CATEGORY_LABELS: Record<ReserveCategory, string> = {
    reserves: 'מילואים',
    consultant: 'יועץ',
    permanentService: 'קבע',
    mandatoryMilitaryService: 'סדיר',
    Other: 'אחר',
}

export const FieldOfExpertise = z.enum(['Algorithms', 'Frontend', 'Backend', 'RF', 'Other'])
export type FieldOfExpertise = z.infer<typeof FieldOfExpertise>

export const FIELD_OF_EXPERTISE_LABELS: Record<FieldOfExpertise, string> = {
    Algorithms: 'אלגוריתמיקה',
    Frontend: 'פרונט',
    Backend: 'בקנד',
    RF: 'RF',
    Other: 'אחר',
}

export const Experience = z.enum(['0-1 years', '1-3 years', '3-5 years', '5+ years'])
export type Experience = z.infer<typeof Experience>

export const EXPERIENCE_LABELS: Record<Experience, string> = {
    '0-1 years': '0-1 שנים',
    '1-3 years': '1-3 שנים',
    '3-5 years': '3-5 שנים',
    '5+ years': '5+ שנים',
}

export const FundingSource = z.enum(['internal', 'external'])
export type FundingSource = z.infer<typeof FundingSource>

export const FUNDING_SOURCE_LABELS: Record<FundingSource, string> = {
    internal: 'פנימי',
    external: 'חיצוני',
}

export const OrderType = z.enum(['8open', '8daily', 'routineOpen', 'routineDaily'])
export type OrderType = z.infer<typeof OrderType>

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
    '8open': 'צו 8 פתוח',
    '8daily': 'צו 8 חד יומי',
    routineOpen: 'יממ שיגרה פתוח',
    routineDaily: 'יממ שיגרה חד יומי',
}

export const RequestStatus = z.enum(['pending', 'approved', 'cancelled', 'denied'])
export type RequestStatus = z.infer<typeof RequestStatus>

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
    pending: 'ממתין לטיפול',
    approved: 'אושר',
    cancelled: 'בוטל',
    denied: 'נדחה',
}

export const BaseAccessApproval = z.enum(['pending', 'approved', 'rejected', 'amanGuard'])
export type BaseAccessApproval = z.infer<typeof BaseAccessApproval>

export const BASE_ACCESS_APPROVAL_LABELS: Record<BaseAccessApproval, string> = {
    pending: 'מחכה לאישור',
    approved: 'אושר',
    rejected: 'נדחה',
    amanGuard: 'משמר אמ"ן',
}

export const ProjectStatus = z.enum(['active', 'inactive', 'pending'])
export type ProjectStatus = z.infer<typeof ProjectStatus>

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    active: 'פעיל',
    inactive: 'לא פעיל',
    pending: 'מושהה',
}
