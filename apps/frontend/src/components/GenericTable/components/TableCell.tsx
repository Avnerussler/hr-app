import { FC } from 'react'
import { CellContext } from '@tanstack/react-table'
import { Link, Tag, HStack, Text } from '@chakra-ui/react'
import { FormFields } from '@/types/fieldsType'

interface TableCellProps {
    info: CellContext<FormFields, unknown>
    field: FormFields
}

export const TableCell: FC<TableCellProps> = ({ info, field }) => {
    const value = info.getValue()

    if (field.type === 'file' && value) {
        return (
            <Link
                href={value as string}
                color="primary"
                textDecoration="underline"
                _hover={{
                    color: 'primary',
                    opacity: 0.8,
                }}
            >
                {value as string}
            </Link>
        )
    }

    if (field.type === 'select') {
        return (
            <Text>
                {
                    field.options?.find(
                        (option) => option.value === value
                    )?.label
                }
            </Text>
        )
    }

    if (field.type === 'multipleSelect') {
        if (!Array.isArray(value)) return null
        const commonItems = field.options?.filter(
            (item) =>
                (value as unknown as string[])?.includes(item.value)
        )

        return (
            <HStack gap={1} flexWrap="wrap">
                {commonItems?.map((item) => (
                    <Tag.Root
                        key={item.value}
                        size="sm"
                        bg="secondary"
                        color="secondary.foreground"
                        borderRadius="md"
                    >
                        <Tag.Label fontSize="xs">
                            {item.label}
                        </Tag.Label>
                    </Tag.Root>
                ))}
            </HStack>
        )
    }

    if (field.type === 'radio') {
        return (
            <Text color="foreground">
                {
                    field.items?.find(
                        (item) => item.value === value
                    )?.label
                }
            </Text>
        )
    }

    // Ensure only valid ReactNode types are rendered
    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        return (
            <Text color="foreground">
                {String(value)}
            </Text>
        )
    }

    // Handle arrays (Option[] or Item[])
    if (Array.isArray(value)) {
        return (
            <Text color="foreground">
                {value.map((v, i) => (
                    <span key={i}>
                        {JSON.stringify(v)}
                        {i < value.length - 1 ? ', ' : ''}
                    </span>
                ))}
            </Text>
        )
    }

    // Handle undefined or other types
    return <Text color="foreground"></Text>
}