import { FC } from 'react'
import { Box, Field, Flex, Text } from '@chakra-ui/react'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { Control, FieldValues, useWatch } from 'react-hook-form'
import { useRouteContext } from '@/hooks/useRouteContext'
import { useSelectedOptionsQuery } from '@/hooks/queries/useFormQueries'

interface ControlledDisplayFieldProps extends FieldValues {
    control: Control
    sourceField?: string
    foreignFields?: string[]
}

// Renders one metadata value; booleans render as a green check / red X icon
const MetadataValue: FC<{ value: unknown }> = ({ value }) => {
    if (typeof value === 'boolean') {
        return value ? (
            <Box color="green.500" role="img" aria-label="Yes">
                <FiCheckCircle size={18} />
            </Box>
        ) : (
            <Box color="red.500" role="img" aria-label="No">
                <FiXCircle size={18} />
            </Box>
        )
    }
    return <Text fontSize="medium">{(value as string) || '—'}</Text>
}

export const ControlledDisplayField: FC<ControlledDisplayFieldProps> = ({
    control,
    name,
    label,
    sourceField,
}) => {
    const { formId } = useRouteContext()
    const sourceValue = useWatch({ control, name: sourceField ?? name })

    const ids: string[] =
        typeof sourceValue === 'string' && sourceValue ? [sourceValue] : []

    const { data } = useSelectedOptionsQuery({
        formId,
        fieldName: name,
        ids,
        enabled: ids.length > 0,
    })

    const metadata = data?.options?.[0]?.metadata as
        | Record<string, unknown>
        | undefined

    return (
        <Field.Root orientation="vertical">
            <Field.Label>{label}</Field.Label>
            {metadata ? (
                <Flex gap="3">
                    {Object.entries(metadata).map(([key, value]) => (
                        <MetadataValue key={key} value={value} />
                    ))}
                </Flex>
            ) : (
                <Text fontSize="medium">—</Text>
            )}
        </Field.Root>
    )
}
