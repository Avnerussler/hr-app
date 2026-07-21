import { Badge } from '@chakra-ui/react'
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from '@/components/ui/menu'
import { useUpdateReserveDay } from '@/hooks/mutations/useReserveDayMutations'
import { useSettingOptions } from '@/hooks/queries/useSettingQueries'

// Color is a presentational-only concern (not an admin-editable "option" attribute), so it
// stays as a fixed fallback palette keyed by value, independent of the DB-driven labels.
const REQUEST_STATUS_COLOR_SCHEME: Record<string, string> = {
    approved: 'green',
    denied: 'red',
    pending: 'orange',
    cancelled: 'gray',
}

interface ReserveDayStatusCellProps {
    id: string
    status: string | undefined
}

export function ReserveDayStatusCell({ id, status }: ReserveDayStatusCellProps) {
    const { mutate } = useUpdateReserveDay()
    const { options } = useSettingOptions('requestStatus')

    if (!status) return <>—</>

    const currentLabel = options.find((o) => o.value === status)?.label ?? status

    return (
        <MenuRoot
            onSelect={(details) => {
                const nextStatus = details.value
                if (nextStatus !== status) {
                    mutate({ id, body: { requestStatus: nextStatus } })
                }
            }}
        >
            <MenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Badge colorPalette={REQUEST_STATUS_COLOR_SCHEME[status] ?? 'gray'} cursor="pointer" borderRadius="md" px={2} py={0.5}>
                    {currentLabel}
                </Badge>
            </MenuTrigger>
            <MenuContent onClick={(e) => e.stopPropagation()}>
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </MenuContent>
        </MenuRoot>
    )
}
