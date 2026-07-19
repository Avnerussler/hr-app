import { Control, FieldValues } from 'react-hook-form'
import { VStack } from '@chakra-ui/react'
import { ControlledInputField } from '@/components/ControlledFields/ControlledInputField'
import { ControlledSelectField } from '@/components/ControlledFields/ControlledSelectField'
import { ControlledRadioField } from '@/components/ControlledFields/ControlledRadioField'
import { ControlledDateRangeField } from '@/components/ControlledFields/ControlledDateRangeField'
import { ControlledTextareaField } from '@/components/ControlledFields/ControlledTextareaField'
import { ControlledFileInput } from '@/components/ControlledFields/ControlledFileField'
import { ControlledAttendanceHistoryField } from '@/components/ControlledFields/ControlledAttendanceHistoryField'
import {
    STUDIO_ROLE_LABELS,
    CLASSIFICATION_CLASS_LABELS,
    RESERVE_CATEGORY_LABELS,
    FIELD_OF_EXPERTISE_LABELS,
    EXPERIENCE_LABELS,
} from '@hr-app/shared-types'
import { AssignedProjectSelect } from './AssignedProjectSelect'
import { PersonnelFormValues } from './personnelSchema'

const toOptions = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }))

const STUDIO_ROLE_OPTIONS = toOptions(STUDIO_ROLE_LABELS)
const CLASSIFICATION_CLASS_OPTIONS = toOptions(CLASSIFICATION_CLASS_LABELS)
const RESERVE_CATEGORY_OPTIONS = toOptions(RESERVE_CATEGORY_LABELS)
const FIELD_OF_EXPERTISE_OPTIONS = toOptions(FIELD_OF_EXPERTISE_LABELS)
const EXPERIENCE_OPTIONS = toOptions(EXPERIENCE_LABELS)
const ACTIVE_STATUS_ITEMS = [
    { value: 'true', label: 'פעיל' },
    { value: 'false', label: 'לא פעיל' },
]
const YES_NO_ITEMS = [
    { value: 'true', label: 'כן' },
    { value: 'false', label: 'לא' },
]

interface PersonnelFormSectionProps {
    control: Control<PersonnelFormValues>
}

function useUntypedControl(control: Control<PersonnelFormValues>) {
    return control as unknown as Control<FieldValues>
}

export function PersonalInformationSection({ control: typedControl }: PersonnelFormSectionProps) {
    const control = useUntypedControl(typedControl)
    return (
        <VStack gap={4} align="stretch" p={6} pb={4}>
            <ControlledInputField control={control} name="firstName" id="firstName" type="text" label="שם פרטי" placeholder="הזן שם פרטי" required />
            <ControlledInputField control={control} name="lastName" id="lastName" type="text" label="שם משפחה" placeholder="הזן שם משפחה" required />
            <ControlledInputField control={control} name="userId" id="userId" type="text" label="תעודת זהות" placeholder="הזן תעודת זהות" />
            <ControlledInputField control={control} name="personalNumber" id="personalNumber" type="text" label="מספר אישי" placeholder="הזן מספר אישי" required />
            <ControlledInputField control={control} name="phone" id="phone" type="tel" label="טלפון" placeholder="הזן מספר טלפון" />
            <ControlledInputField control={control} name="email" id="email" type="email" label="אימייל" placeholder="הזן אימייל" />
            <ControlledInputField control={control} name="city" id="city" type="text" label="עיר" placeholder="הזן את שם עיר המגורים" />
            <ControlledInputField control={control} name="linkedin" id="linkedin" type="text" label="לינקדאין" placeholder="הזן את שם המשתמש לינקדאין" />
            <ControlledInputField control={control} name="vehicleNumber" id="vehicleNumber" type="text" label="מספר רכב" placeholder="הזן מספר רכב" />
            <ControlledDateRangeField
                control={control}
                startName="vehicleEntryStartDate"
                endName="vehicleEntryEndDate"
                label="תוקף אישור כניסה עם רכב"
            />
            <ControlledTextareaField control={control} name="note" id="note" label="כללי" placeholder="הזן הערה כללית" />
            <ControlledRadioField control={control} name="isActive" id="isActive" label="סטטוס" items={ACTIVE_STATUS_ITEMS} />
        </VStack>
    )
}

export function MilitaryInformationSection({ control: typedControl }: PersonnelFormSectionProps) {
    const control = useUntypedControl(typedControl)
    return (
        <VStack gap={4} align="stretch" p={6} pb={4}>
            <AssignedProjectSelect control={control} name="assignedProjects" label="שיוך לפרויקט" placeholder="בחר פרויקט" />
            <ControlledSelectField control={control} name="studioRole" label="תפקיד בסטודיו" placeholder="בחר תפקיד בסטודיו" options={STUDIO_ROLE_OPTIONS} />
            <ControlledInputField control={control} name="directBoss" id="directBoss" type="text" label="מנהל ישיר" placeholder="מנהל ישיר" />
            <ControlledSelectField control={control} name="classificationClass" label="רמת סיווג" placeholder="רמת סיווג" options={CLASSIFICATION_CLASS_OPTIONS} />
            <ControlledInputField control={control} name="reserveUnit" id="reserveUnit" type="text" label="שיוך יחידה במילואים" placeholder="שיוך יחידה במילואים" />
            <ControlledInputField control={control} name="reserveRole" id="reserveRole" type="text" label="תפקיד במילואים" placeholder="הזן תפקיד במילואים" />
            <ControlledInputField control={control} name="rank" id="rank" type="text" label="דרגה" placeholder="דרגה" />
            <ControlledRadioField control={control} name="canBeRecited" id="canBeRecited" label="האם ניתן לזמן למילואים" items={YES_NO_ITEMS} />
            <ControlledSelectField control={control} name="reserveCategory" label="סוג העסקה" placeholder="בחר סוג העסקה" options={RESERVE_CATEGORY_OPTIONS} />
        </VStack>
    )
}

export function AttendanceHistorySection({ control: typedControl }: PersonnelFormSectionProps) {
    const control = useUntypedControl(typedControl)
    return (
        <VStack gap={4} align="stretch" p={6} pb={4}>
            <ControlledAttendanceHistoryField control={control} name="attendanceHistory" label="היסטוריית נוכחות" employeeIdField="_id" />
        </VStack>
    )
}

export function ProfessionalInformationSection({ control: typedControl }: PersonnelFormSectionProps) {
    const control = useUntypedControl(typedControl)
    return (
        <VStack gap={4} align="stretch" p={6} pb={4}>
            <ControlledInputField control={control} name="degree" id="degree" type="text" label="תואר אקדמי" placeholder="תואר אקדמי" />
            <ControlledInputField control={control} name="university" id="university" type="text" label="מוסד לימודים" placeholder="מוסד לימודים" />
            <ControlledInputField control={control} name="studyArea" id="studyArea" type="text" label="תחום לימודים" placeholder="תחום לימודים" />
            <ControlledInputField control={control} name="yearOfGradation" id="yearOfGradation" type="date" label="תאריך סיום לימודים" placeholder="תאריך סיום לימודים" />
            <ControlledTextareaField control={control} name="workExperience" id="workExperience" label="ניסיון תעסוקתי" placeholder="ניסיון תעסוקתי" />
            <ControlledTextareaField control={control} name="talentAndSkills" id="talentAndSkills" label="כישורים ומיומניות" placeholder="כישורים ומיומניות" />
            <ControlledInputField control={control} name="referralSource" id="referralSource" type="text" label="מקור הפניה" placeholder="מקור הפניה" />
            <ControlledSelectField control={control} name="fieldOfExpertise" label="תחום מקצועי" placeholder="תחום מקצועי" options={FIELD_OF_EXPERTISE_OPTIONS} />
            <ControlledSelectField control={control} name="experience" label="שנות ניסיון" placeholder="שנות ניסיון" options={EXPERIENCE_OPTIONS} />
            <ControlledInputField control={control} name="workPlace" id="workPlace" type="text" label="מקום עבודה" placeholder="הזן את מקום העבודה" />
            <ControlledInputField control={control} name="currentPosition" id="currentPosition" type="text" label="תפקיד נוכחי" placeholder="תפקיד נוכחי" />
            <ControlledFileInput control={control} name="resumeFileUrl" label="רזומה" />
        </VStack>
    )
}
