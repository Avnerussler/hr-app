import { Box, Text, VStack } from '@chakra-ui/react'
import { FaCarCrash } from 'react-icons/fa'
import { Tooltip } from '../ui/tooltip'

interface ExpiredVehicleApprovalEmployee {
    name: string
    status: string
}

interface UnapprovedVehicleWarningProps {
    // For single employee (used in drawer)
    employeeName?: string
    // For multiple employees (used in calendar)
    expiredVehicleApprovalEmployees?: ExpiredVehicleApprovalEmployee[]
    // Optional size override
    iconSize?: number
}

/** Shown only when the employee HAS a vehicle-approval range configured and it has already expired by the shown date. */
export function UnapprovedVehicleWarning({
    employeeName,
    expiredVehicleApprovalEmployees,
    iconSize = 14,
}: UnapprovedVehicleWarningProps) {
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
                        אישור כניסה עם רכב פג תוקף
                    </Text>

                    {isSingleEmployee ? (
                        <Text fontSize="xs">
                            {employeeName} — אישור כניסה עם רכב פג תוקף לפני תאריך זה
                        </Text>
                    ) : (
                        <>
                            <Text fontSize="xs" mb={2}>
                                לעובדים הבאים פג תוקף אישור כניסה עם רכב לפני תאריך זה:
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
                <FaCarCrash size={iconSize} color="orange" />
            </Box>
        </Tooltip>
    )
}
