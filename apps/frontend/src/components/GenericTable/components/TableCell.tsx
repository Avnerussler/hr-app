import { FC } from 'react'
import { CellContext } from '@tanstack/react-table'
import { Link, Tag, HStack, Text, Button } from '@chakra-ui/react'
import { FormFields } from '@/types/fieldsType'
import { useNavigate } from 'react-router-dom'
import { useFormsQuery } from '@/hooks/queries/useFormQueries'

interface TableCellProps {
    info: CellContext<FormFields, unknown>
    field: FormFields
}

export const TableCell: FC<TableCellProps> = ({ info, field }) => {
    const value = info.getValue()
    const navigate = useNavigate()
    const { data: formsData } = useFormsQuery()

    const handleForeignTableClick = (e: React.MouseEvent, foreignFormName: string, recordId: string) => {
        e.preventDefault()
        e.stopPropagation()
        const targetForm = formsData?.forms?.find(form => form.formName === foreignFormName)
        if (targetForm) {
            navigate(`/${targetForm.formName}/${targetForm._id}?selectedRecord=${recordId}`)
        }
    }

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

    if (field.type === 'select' || field.type === 'selectAutocomplete') {
        // Handle new format where foreign fields store {_id, display}
        if (field.foreignFormName && typeof value === 'object' && value && '_id' in value && 'display' in value) {
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    color="primary"
                    p={0}
                    h="auto"
                    minH="auto"
                    fontWeight="normal"
                    textDecoration="underline"
                    _hover={{
                        color: 'primary',
                        opacity: 0.8,
                    }}
                    onClick={(e) => handleForeignTableClick(e, field.foreignFormName!, value._id)}
                >
                    {value.display}
                </Button>
            )
        }

        // Fallback to old format for backward compatibility
        const selectedOption = field.options?.find(
            (option) => option.value === value
        )
        
        // Check if this is a foreign table field (old format)
        if (field.foreignFormName && selectedOption) {
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    color="primary"
                    p={0}
                    h="auto"
                    minH="auto"
                    fontWeight="normal"
                    textDecoration="underline"
                    _hover={{
                        color: 'primary',
                        opacity: 0.8,
                    }}
                    onClick={(e) => handleForeignTableClick(e, field.foreignFormName!, selectedOption.value)}
                >
                    {selectedOption.label}
                </Button>
            )
        }
        
        return (
            <Text>
                {selectedOption?.label || (typeof value === 'object' && value && 'display' in value ? value.display : String(value))}
            </Text>
        )
    }

    if (field.type === 'multipleSelect') {
        if (!Array.isArray(value)) return null
        
        // Handle new format where foreign fields store [{_id, display}, ...]
        if (field.foreignFormName && value.length > 0 && typeof value[0] === 'object' && '_id' in value[0] && 'display' in value[0]) {
            return (
                <HStack gap={1} flexWrap="wrap">
                    {value.map((item: any) => (
                        <Tag.Root
                            key={item._id}
                            size="sm"
                            bg="secondary"
                            color="secondary.foreground"
                            borderRadius="md"
                            cursor="pointer"
                            onClick={(e) => handleForeignTableClick(e, field.foreignFormName!, item._id)}
                            _hover={{
                                opacity: 0.8,
                            }}
                        >
                            <Tag.Label fontSize="xs">
                                {item.display}
                            </Tag.Label>
                        </Tag.Root>
                    ))}
                </HStack>
            )
        }

        // Fallback to old format for backward compatibility
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
                        cursor={field.foreignFormName ? "pointer" : "default"}
                        onClick={field.foreignFormName ? (e) => handleForeignTableClick(e, field.foreignFormName!, item.value) : undefined}
                        _hover={field.foreignFormName ? {
                            opacity: 0.8,
                        } : undefined}
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
        // Handle new format where foreign fields store {_id, display}
        if (field.foreignFormName && typeof value === 'object' && value && '_id' in value && 'display' in value) {
            return (
                <Button
                    variant="ghost"
                    size="sm"
                    color="primary"
                    p={0}
                    h="auto"
                    minH="auto"
                    fontWeight="normal"
                    textDecoration="underline"
                    _hover={{
                        color: 'primary',
                        opacity: 0.8,
                    }}
                    onClick={(e) => handleForeignTableClick(e, field.foreignFormName!, value._id)}
                >
                    {value.display}
                </Button>
            )
        }

        // Fallback to old format
        return (
            <Text color="foreground">
                {
                    field.items?.find(
                        (item) => item.value === value
                    )?.label || (typeof value === 'object' && value && 'display' in value ? value.display : String(value))
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