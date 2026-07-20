import { Box, Text, VStack } from '@chakra-ui/react'
import { LuDoorClosed } from 'react-icons/lu'
import { Tooltip } from '../ui/tooltip'

interface ExpiredBaseEntryApprovalEmployee {
    name: string
    status: string
}

interface UnapprovedBaseEntryWarningProps {
    // For single employee (used in drawer)
    employeeName?: string
    // For multiple employees (used in calendar)
    expiredVehicleApprovalEmployees?: ExpiredBaseEntryApprovalEmployee[]
    // Optional size override
    iconSize?: number
}

/** Shown only when the employee HAS a base-entry-approval range configured and it has already expired by the shown date. */
export function UnapprovedBaseEntryWarning({
    employeeName,
    expiredVehicleApprovalEmployees,
    iconSize = 14,
}: UnapprovedBaseEntryWarningProps) {
    const isSingleEmployee = !!employeeName
    const isMultipleEmployees =
        expiredVehicleApprovalEmployees &&
        expiredVehicleApprovalEmployees.length > 0

    if (!isSingleEmployee && !isMultipleEmployees) {
        return null
    }

    return (
        <Tooltip
            showArrow
            positioning={{
                placement: 'top',
            }}
            content={
                <Box p={2}>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                        תוקף אישור כניסה לבסיס
                    </Text>

                    {isSingleEmployee ? (
                        <Text fontSize="xs">
                            {employeeName} — אישור כניסה לבסיס פג תוקף לפני תאריך זה
                        </Text>
                    ) : (
                        <>
                            <Text fontSize="xs" mb={2}>
                                לעובדים הבאים פג תוקף אישור כניסה לבסיס לפני תאריך זה:
                            </Text>
                            <VStack align="start" gap={1}>
                                {expiredVehicleApprovalEmployees!.map((emp) => (
                                    <Text key={emp.name} fontSize="xs">
                                        • {emp.name}
                                    </Text>
                                ))}
                            </VStack>
                        </>
                    )}
                </Box>
            }
        >
            <Box as="span" cursor="pointer">
                <LuDoorClosed size={iconSize} color="orange" />
            </Box>
        </Tooltip>
    )
}
