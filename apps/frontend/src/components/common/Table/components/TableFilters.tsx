import { FC } from 'react'
import { Box, Text, Flex } from '@chakra-ui/react'
import { Radio, RadioGroup } from '@/components/ui/radio'
import { Switch } from '@/components/ui/switch'
import {
    SelectContent,
    SelectItem,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '@/components/ui/select'
import { TableFilter } from '@/types/fieldsType'
import { createListCollection } from '@chakra-ui/react'

interface TableFiltersProps {
    filters: TableFilter[]
    filterValues: Record<string, string | string[] | boolean>
    onFilterChange: (
        filterId: string,
        value: string | string[] | boolean
    ) => void
}

export const TableFilters: FC<TableFiltersProps> = ({
    filters,
    filterValues,
    onFilterChange,
}) => {
    if (!filters || filters.length === 0) return null

    const renderFilter = (filter: TableFilter) => {
        const currentValue = filterValues?.[filter.fieldName] ?? filter.defaultValue

        switch (filter.type) {
            case 'radio': {
                return (
                    <Box key={filter.id} minW="180px">
                        <Text
                            fontSize="xs"
                            fontWeight="medium"
                            mb={2}
                            color="fg.muted"
                        >
                            {filter.label}
                        </Text>
                        <RadioGroup
                            value={String(currentValue)}
                            onValueChange={(details) =>
                                onFilterChange(filter.fieldName, details.value || '')
                            }
                        >
                            <Flex gap={2} flexWrap="wrap">
                                {filter.options.map((option) => (
                                    <Radio
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </Radio>
                                ))}
                            </Flex>
                        </RadioGroup>
                    </Box>
                )
            }

            case 'select': {
                const selectCollection = createListCollection({
                    items: filter.options.map((opt) => ({
                        label: opt.label,
                        value: opt.value,
                    })),
                })

                return (
                    <Box key={filter.id} minW="180px">
                        <SelectRoot
                            collection={selectCollection}
                            value={[String(currentValue)]}
                            onValueChange={(details) =>
                                onFilterChange(
                                    filter.fieldName,
                                    details.value[0] || ''
                                )
                            }
                            size="sm"
                        >
                            <SelectTrigger>
                                <SelectValueText
                                    placeholder={filter.placeholder}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {filter.options.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        item={{
                                            label: option.label,
                                            value: option.value,
                                        }}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </Box>
                )
            }

            case 'multiSelect': {
                const multiSelectCollection = createListCollection({
                    items: filter.options.map((opt) => ({
                        label: opt.label,
                        value: opt.value,
                    })),
                })

                return (
                    <Box key={filter.id} minW="200px">
                        <SelectRoot
                            collection={multiSelectCollection}
                            value={
                                Array.isArray(currentValue) ? currentValue : []
                            }
                            onValueChange={(details) =>
                                onFilterChange(filter.fieldName, details.value)
                            }
                            multiple
                            size="sm"
                        >
                            <SelectTrigger>
                                <SelectValueText
                                    placeholder={filter.placeholder}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {filter.options.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        item={{
                                            label: option.label,
                                            value: option.value,
                                        }}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectRoot>
                    </Box>
                )
            }

            case 'switch': {
                return (
                    <Box key={filter.id} minW="150px">
                        <Flex gap={3} align="center" h="full">
                            <Switch
                                checked={Boolean(currentValue)}
                                onCheckedChange={(details) =>
                                    onFilterChange(
                                        filter.fieldName,
                                        Boolean(details.checked)
                                    )
                                }
                            />
                            <Text fontSize="sm" fontWeight="medium">
                                {filter.label}
                            </Text>
                        </Flex>
                    </Box>
                )
            }

            default:
                return null
        }
    }

    return (
        <Flex
            gap={2}
            flexWrap="nowrap"
            align="center"
            direction="row"
        >
            {filters.map(renderFilter)}
        </Flex>
    )
}
