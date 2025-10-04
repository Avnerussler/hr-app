import { Box, Text, VStack } from '@chakra-ui/react'
import { FaExclamationTriangle } from 'react-icons/fa'
import { Tooltip } from '../ui/tooltip'

interface UnapprovedEmployee {
    name: string
    status: string
}

interface UnapprovedReserveDaysWarningProps {
    // For single employee (used in drawer)
    employeeName?: string
    requestStatus?: string
    // For multiple employees (used in calendar)
    unapprovedEmployees?: UnapprovedEmployee[]
    // Optional size override
    iconSize?: number
}

const getStatusLabel = (status: string): string => {
    switch (status) {
        case 'pending':
            return 'ממתין לאישור'
        case 'denied':
            return 'נדחה'
        default:
            return status
    }
}

export function UnapprovedReserveDaysWarning({
    employeeName,
    requestStatus,
    unapprovedEmployees,
    iconSize = 14,
}: UnapprovedReserveDaysWarningProps) {
    // Determine if this is for single or multiple employees
    const isSingleEmployee = employeeName && requestStatus
    const isMultipleEmployees =
        unapprovedEmployees && unapprovedEmployees.length > 0

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
                        ימי מילואים לא מאושרים
                    </Text>

                    {isSingleEmployee ? (
                        // Single employee tooltip (for drawer)
                        <Text fontSize="xs">
                            סטטוס בקשה: {getStatusLabel(requestStatus!)}
                        </Text>
                    ) : (
                        // Multiple employees tooltip (for calendar)
                        <>
                            <Text fontSize="xs" mb={2}>
                                העובדים הבאים יש להם ימי מילואים ללא אישור:
                            </Text>
                            <VStack align="start" gap={1}>
                                {unapprovedEmployees!.map((emp) => (
                                    <Text key={emp.name} fontSize="xs">
                                        • {emp.name} (
                                        {getStatusLabel(emp.status)})
                                    </Text>
                                ))}
                            </VStack>
                        </>
                    )}
                </Box>
            }
        >
            <Box as="span" cursor="pointer">
                <FaExclamationTriangle size={iconSize} color="orange" />
            </Box>
        </Tooltip>
    )
}
