import { chakra } from '@chakra-ui/react'
import { Tooltip } from '@/components/ui/tooltip'
import { useUpdatePersonnel } from '@/hooks/mutations/usePersonnelMutations'

const StatusDotButton = chakra('button')

interface PersonnelStatusToggleProps {
    id: string
    isActive: boolean
}

/** Clickable status dot that flips a personnel's global isActive flag. */
export function PersonnelStatusToggle({ id, isActive }: PersonnelStatusToggleProps) {
    const { mutate } = useUpdatePersonnel()

    return (
        <Tooltip content="עדכן סטטוס עובד">
            <StatusDotButton
                type="button"
                w="10px"
                h="10px"
                borderRadius="full"
                bg={isActive ? 'green.500' : 'red.500'}
                cursor="pointer"
                flexShrink={0}
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    mutate({ id, body: { isActive: !isActive } })
                }}
            />
        </Tooltip>
    )
}
