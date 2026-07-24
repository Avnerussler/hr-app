import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import type { Column } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Text } from '@chakra-ui/react'
import { EntityLink } from '@/components/common/EntityLink'
import { SettingLabelCell } from '@/components/common/SettingLabelCell'
import { TruncatedText } from '@/components/common/TruncatedText'
import { SortableHeader } from '@/components/common/Table/components/SortableHeader'
import { PersonnelRecord } from './queries/usePersonnelQueries'

const columnHelper = createColumnHelper<PersonnelRecord>()

/** Fields that exist on the Personnel model but have no dedicated column above —
 *  exposed via the column-visibility picker (hidden by default) so the user can
 *  add any model field to the table, not just the ones shown out of the box. */
const EXTRA_TEXT_FIELDS: { id: keyof PersonnelRecord; label: string }[] = [
    { id: 'userId', label: 'מזהה משתמש' },
    { id: 'phone', label: 'טלפון' },
    { id: 'email', label: 'אימייל' },
    { id: 'city', label: 'עיר' },
    { id: 'linkedin', label: 'לינקדאין' },
    { id: 'vehicleNumber', label: 'מספר רכב' },
    { id: 'note', label: 'הערה' },
    { id: 'details', label: 'פרטים' },
    { id: 'layer', label: 'שכבה' },
    { id: 'reserveUnit', label: 'יחידת מילואים' },
    { id: 'reserveRole', label: 'תפקיד במילואים' },
    { id: 'rank', label: 'דרגה' },
    { id: 'degree', label: 'תואר' },
    { id: 'university', label: 'מוסד לימודים' },
    { id: 'studyArea', label: 'תחום לימודים' },
    { id: 'workExperience', label: 'ניסיון תעסוקתי' },
    { id: 'talentAndSkills', label: 'כישרונות וכישורים' },
    { id: 'referralSource', label: 'מקור הפניה' },
    { id: 'workPlace', label: 'מקום עבודה' },
    { id: 'currentPosition', label: 'תפקיד נוכחי' },
]

const EXTRA_LABEL_FIELDS: { id: keyof PersonnelRecord; label: string; settingKey: string }[] = [
    { id: 'classificationClass', label: 'סיווג', settingKey: 'classificationClass' },
    { id: 'fieldOfExpertise', label: 'תחום התמחות', settingKey: 'fieldOfExpertise' },
    { id: 'experience', label: 'ניסיון', settingKey: 'experience' },
]

const EXTRA_DATE_FIELDS: { id: keyof PersonnelRecord; label: string }[] = [
    { id: 'entryStartDate', label: 'תחילת אישור כניסה' },
    { id: 'entryEndDate', label: 'סיום אישור כניסה' },
    { id: 'yearOfGradation', label: 'שנת סיום לימודים' },
]

export const PERSONNEL_EXTRA_COLUMN_IDS = [
    ...EXTRA_TEXT_FIELDS.map((f) => f.id as string),
    ...EXTRA_LABEL_FIELDS.map((f) => f.id as string),
    ...EXTRA_DATE_FIELDS.map((f) => f.id as string),
]

export function usePersonnelColumns() {
    return useMemo(
        () => [
            columnHelper.accessor('firstName', {
                id: 'firstName',
                header: ({ column }) => <SortableHeader label="שם פרטי" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'שם פרטי' },
                cell: (info) => <Text color="foreground">{info.getValue()}</Text>,
            }),
            columnHelper.accessor('lastName', {
                id: 'lastName',
                header: ({ column }) => <SortableHeader label="שם משפחה" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'שם משפחה' },
                cell: (info) => <Text color="foreground">{info.getValue()}</Text>,
            }),
            columnHelper.accessor('personalNumber', {
                id: 'personalNumber',
                header: ({ column }) => <SortableHeader label="מספר אישי" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'מספר אישי' },
                cell: (info) => <Text color="foreground">{info.getValue()}</Text>,
            }),
            columnHelper.accessor('reserveCategory', {
                id: 'reserveCategory',
                header: ({ column }) => <SortableHeader label="סוג העסקה" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'סוג העסקה' },
                cell: (info) => <SettingLabelCell settingKey="reserveCategory" value={info.getValue()} />,
            }),
            columnHelper.accessor('directBoss', {
                id: 'directBoss',
                header: ({ column }) => <SortableHeader label="מנהל ישיר" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'מנהל ישיר' },
                cell: (info) => <TruncatedText>{info.getValue() || ''}</TruncatedText>,
            }),
            columnHelper.accessor((row) => row.assignedProjects, {
                id: 'assignedProjects',
                header: ({ column }) => <SortableHeader label="שיוך לפרויקט" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'שיוך לפרויקט' },
                cell: (info) => {
                    const project = info.getValue()
                    if (!project) return <Text color="foreground">—</Text>
                    return (
                        <EntityLink formName="project_management" itemId={project._id}>
                            {project.projectName}
                        </EntityLink>
                    )
                },
            }),
            columnHelper.accessor('studioRole', {
                id: 'studioRole',
                header: ({ column }) => <SortableHeader label="תפקיד בסטודיו" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'תפקיד בסטודיו' },
                cell: (info) => <SettingLabelCell settingKey="studioRole" value={info.getValue()} />,
            }),
            columnHelper.accessor('isActive', {
                id: 'isActive',
                header: ({ column }) => <SortableHeader label="סטטוס" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'סטטוס' },
                cell: (info) => <Text color="foreground">{info.getValue() ? 'פעיל' : 'לא פעיל'}</Text>,
            }),
            columnHelper.accessor('createdAt', {
                id: 'createdAt',
                header: ({ column }) => <SortableHeader label="Created At" column={column} />,
                enableSorting: true,
                sortDescFirst: false,
                meta: { label: 'Created At' },
                cell: (info) => {
                    const val = info.getValue()
                    if (!val) return ''
                    try {
                        return format(new Date(val), 'dd/MM/yyyy HH:mm')
                    } catch {
                        return String(val)
                    }
                },
            }),
            ...EXTRA_TEXT_FIELDS.map(({ id, label }) =>
                columnHelper.accessor((row) => row[id], {
                    id: id as string,
                    header: ({ column }: { column: Column<PersonnelRecord, unknown> }) => (
                        <SortableHeader label={label} column={column} />
                    ),
                    enableSorting: true,
                    sortDescFirst: false,
                    meta: { label },
                    cell: (info) => <TruncatedText>{String(info.getValue() ?? '')}</TruncatedText>,
                })
            ),
            ...EXTRA_LABEL_FIELDS.map(({ id, label, settingKey }) =>
                columnHelper.accessor((row) => row[id], {
                    id: id as string,
                    header: ({ column }: { column: Column<PersonnelRecord, unknown> }) => (
                        <SortableHeader label={label} column={column} />
                    ),
                    enableSorting: true,
                    sortDescFirst: false,
                    meta: { label },
                    cell: (info) => (
                        <SettingLabelCell settingKey={settingKey} value={info.getValue() as string | null} />
                    ),
                })
            ),
            ...EXTRA_DATE_FIELDS.map(({ id, label }) =>
                columnHelper.accessor((row) => row[id], {
                    id: id as string,
                    header: ({ column }: { column: Column<PersonnelRecord, unknown> }) => (
                        <SortableHeader label={label} column={column} />
                    ),
                    enableSorting: true,
                    sortDescFirst: false,
                    meta: { label },
                    cell: (info) => {
                        const val = info.getValue()
                        if (!val) return <Text color="foreground">—</Text>
                        try {
                            return <Text color="foreground">{format(new Date(val as string), 'dd/MM/yyyy')}</Text>
                        } catch {
                            return <Text color="foreground">{String(val)}</Text>
                        }
                    },
                })
            ),
        ],
        []
    )
}
