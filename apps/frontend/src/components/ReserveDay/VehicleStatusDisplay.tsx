import { Box, Field, Flex, Text } from '@chakra-ui/react'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { Control, FieldValues, useWatch } from 'react-hook-form'
import { useEmployeeVehicleStatusQuery } from '@/hooks/queries/useReserveDayQueries'

interface VehicleStatusDisplayProps {
    control: Control<FieldValues>
    sourceField: string
    label: string
}

/** Read-only, live-looked-up display of whether the selected employee's vehicle approval covers the selected date range — never stored on the record itself. */
export function VehicleStatusDisplay({ control, sourceField, label }: VehicleStatusDisplayProps) {
    const employeeId: string | null | undefined = useWatch({ control, name: sourceField })
    const startDate: string | null | undefined = useWatch({ control, name: 'startDate' })
    const endDate: string | null | undefined = useWatch({ control, name: 'endDate' })
    const { data: vehicleStatus } = useEmployeeVehicleStatusQuery(employeeId || undefined, startDate, endDate)

    return (
        <Field.Root orientation="vertical">
            <Field.Label>{label}</Field.Label>
            {vehicleStatus ? (
                <Flex direction="column" gap="1">
                    <Flex gap="3" alignItems="center">
                        {vehicleStatus.hasVehicleApproval ? (
                            <Box color="green.500" role="img" aria-label="Yes">
                                <FiCheckCircle size={18} />
                            </Box>
                        ) : (
                            <Box color="red.500" role="img" aria-label="No">
                                <FiXCircle size={18} />
                            </Box>
                        )}
                        <Text fontSize="medium">{vehicleStatus.vehicleNumber || '—'}</Text>
                    </Flex>
                    {vehicleStatus.hasPartialVehicleApproval && (
                        <Text fontSize="small" color="orange.500">
                            על חלק מהימים לא יהיה אישור כניסה לרכב
                        </Text>
                    )}
                </Flex>
            ) : (
                <Text fontSize="medium">—</Text>
            )}
        </Field.Root>
    )
}
