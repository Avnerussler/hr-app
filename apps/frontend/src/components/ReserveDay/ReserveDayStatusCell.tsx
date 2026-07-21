import { Badge } from '@chakra-ui/react'
import { REQUEST_STATUS_LABELS, RequestStatus } from '@hr-app/shared-types'
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from '@/components/ui/menu'
import { useUpdateReserveDay } from '@/hooks/mutations/useReserveDayMutations'

const REQUEST_STATUS_COLOR_SCHEME: Record<RequestStatus, string> = {
    approved: 'green',
    denied: 'red',
    pending: 'orange',
    cancelled: 'gray',
}

const REQUEST_STATUS_OPTIONS = Object.entries(REQUEST_STATUS_LABELS) as [RequestStatus, string][]

interface ReserveDayStatusCellProps {
    id: string
    status: RequestStatus | undefined
}

export function ReserveDayStatusCell({ id, status }: ReserveDayStatusCellProps) {
    const { mutate } = useUpdateReserveDay()

    if (!status) return <>—</>

    return (
        <MenuRoot
            onSelect={(details) => {
                const nextStatus = details.value as RequestStatus
                if (nextStatus !== status) {
                    mutate({ id, body: { requestStatus: nextStatus } })
                }
            }}
        >
            <MenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Badge colorPalette={REQUEST_STATUS_COLOR_SCHEME[status]} cursor="pointer" borderRadius="md" px={2} py={0.5}>
                    {REQUEST_STATUS_LABELS[status]}
                </Badge>
            </MenuTrigger>
            <MenuContent onClick={(e) => e.stopPropagation()}>
                {REQUEST_STATUS_OPTIONS.map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                        {label}
                    </MenuItem>
                ))}
            </MenuContent>
        </MenuRoot>
    )
}
