import { useMemo, useState } from 'react'
import { Box, Text, Stack, Flex, createListCollection, Field, Button, ButtonGroup } from '@chakra-ui/react'
import { SelectRoot, SelectTrigger, SelectValueText, SelectLabel } from '@/components/ui/select'
import { Control, Controller, FieldValues, useWatch } from 'react-hook-form'
import { CloseButton } from '@/components/ui/close-button'
import { SelectItem, SelectContent } from '@/components/ui/select'
import { Spinner } from '@chakra-ui/react'
import { EntityLink } from '@/components/common/EntityLink'
import { PersonnelOptionDisplay } from './PersonnelOptionDisplay'
import { PersonnelStatusToggle } from './PersonnelStatusToggle'
import { PersonnelOption } from '@/hooks/queries/useProjectQueries'
import { usePagedPersonnelOptions } from '@/hooks/usePagedPersonnelOptions'

interface ProjectPersonnelMultiSelectProps {
    control: Control<FieldValues>
    name: string
    label: string
    placeholder: string
}

type PersonnelStatusFilter = 'all' | 'active' | 'inactive'

const STATUS_FILTER_OPTIONS: { value: PersonnelStatusFilter; label: string }[] = [
    { value: 'all', label: 'הכל' },
    { value: 'active', label: 'פעיל' },
    { value: 'inactive', label: 'לא פעיל' },
]

function SelectedPersonnelList({
    selectedOptions,
    totalSelected,
    statusFilter,
    onStatusFilterChange,
    onRemove,
}: {
    selectedOptions: PersonnelOption[]
    totalSelected: number
    statusFilter: PersonnelStatusFilter
    onStatusFilterChange: (value: PersonnelStatusFilter) => void
    onRemove: (value: string) => void
}) {
    if (totalSelected === 0) return null
    return (
        <Box mt="2" p="3" borderWidth="1px" borderRadius="md" bg="gray.50" maxH="240px" overflowY="auto">
            <Flex alignItems="center" justifyContent="space-between" mb="2">
                <Text fontSize="xs" fontWeight="medium" color="gray.600">
                    {statusFilter === 'all'
                        ? `Selected (${totalSelected})`
                        : `Selected (${selectedOptions.length} of ${totalSelected})`}
                </Text>
                <ButtonGroup size="2xs" attached>
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={statusFilter === opt.value ? 'solid' : 'outline'}
                            onClick={(e) => {
                                e.stopPropagation()
                                onStatusFilterChange(opt.value)
                            }}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </Flex>
            <Stack gap="1.5">
                {selectedOptions.map((option) => (
                    <Flex
                        key={option.value}
                        alignItems="center"
                        gap="2"
                        p="2"
                        bg="white"
                        borderRadius="sm"
                        borderWidth="1px"
                        borderColor="gray.200"
                        _hover={{ borderColor: 'blue.300', bg: 'blue.50' }}
                        transition="all 0.2s"
                    >
                        <Box flex="1">
                            <EntityLink formName="personnel" itemId={option.value}>
                                <PersonnelOptionDisplay option={option} hideStatusDot />
                            </EntityLink>
                        </Box>
                        {option.metadata && (
                            <PersonnelStatusToggle id={option.value} isActive={option.metadata.isActive} />
                        )}
                        <CloseButton
                            size="xs"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemove(option.value)
                            }}
                            colorPalette="red"
                        />
                    </Flex>
                ))}
            </Stack>
        </Box>
    )
}

export function ProjectPersonnelMultiSelect({ control, name, label, placeholder }: ProjectPersonnelMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<PersonnelStatusFilter>('all')

    const selectedValues: string[] = useWatch({ control, name }) ?? []
    const {
        searchTerm,
        setSearchTerm,
        searchOptions,
        options,
        isLoading,
        isFetching,
        pagination,
        handleScroll,
    } = usePagedPersonnelOptions(selectedValues)

    const collection = useMemo(() => createListCollection({ items: options }), [options])
    const selectedOptions = selectedValues
        .map((value) => options.find((opt) => opt.value === value))
        .filter((opt): opt is PersonnelOption => Boolean(opt))
    const filteredSelectedOptions = selectedOptions.filter((opt) => {
        if (statusFilter === 'active') return opt.metadata?.isActive
        if (statusFilter === 'inactive') return opt.metadata?.isActive === false
        return true
    })

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const handleRemove = (valueToRemove: string) => {
                    field.onChange(selectedValues.filter((v) => v !== valueToRemove))
                }

                return (
                    <Field.Root orientation="vertical">
                        <SelectRoot
                            multiple
                            value={selectedValues}
                            collection={collection}
                            size="sm"
                            positioning={{ placement: 'bottom-start' }}
                            open={isOpen}
                            onOpenChange={(e) => {
                                setIsOpen(e.open)
                                if (!e.open) setSearchTerm('')
                            }}
                            onValueChange={({ items }) => field.onChange(items.map((item) => item.value))}
                            onInteractOutside={() => field.onBlur()}
                        >
                            <SelectLabel>{label}</SelectLabel>
                            <Box position="relative">
                                <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
                                    <SelectValueText
                                        placeholder={selectedOptions.length > 0 ? `${selectedOptions.length} selected` : placeholder}
                                    />
                                </SelectTrigger>
                                <SelectedPersonnelList
                                    selectedOptions={filteredSelectedOptions}
                                    totalSelected={selectedOptions.length}
                                    statusFilter={statusFilter}
                                    onStatusFilterChange={setStatusFilter}
                                    onRemove={handleRemove}
                                />
                            </Box>
                            <SelectContent portalled={false} maxH="300px" position="absolute" left="0" right="0" zIndex="dropdown" mt="1">
                                <Box p="2" borderBottomWidth="1px" position="sticky" top="0" bg="white" zIndex="1">
                                    <input
                                        placeholder="Search..."
                                        style={{ width: '100%', fontSize: '14px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </Box>
                                <Box maxH="250px" overflowY="auto" onScroll={handleScroll}>
                                    {isLoading && !searchOptions.length ? (
                                        <Box p="4" textAlign="center">
                                            <Spinner size="sm" />
                                        </Box>
                                    ) : searchOptions.length > 0 ? (
                                        <>
                                            {searchOptions.map((option) => (
                                                <SelectItem item={option} key={option.value}>
                                                    <PersonnelOptionDisplay option={option} />
                                                </SelectItem>
                                            ))}
                                            {isOpen && pagination?.hasMore && (
                                                <Box p="2" textAlign="center" minH="32px">
                                                    {isFetching && <Spinner size="sm" />}
                                                </Box>
                                            )}
                                        </>
                                    ) : (
                                        <Box p="4" textAlign="center" color="gray.500">
                                            No options available
                                        </Box>
                                    )}
                                </Box>
                            </SelectContent>
                        </SelectRoot>
                    </Field.Root>
                )
            }}
        />
    )
}
