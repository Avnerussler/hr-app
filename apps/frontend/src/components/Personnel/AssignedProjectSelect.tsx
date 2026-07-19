import { useMemo, useState } from 'react'
import { Box, createListCollection, Field, Input, Spinner, Text } from '@chakra-ui/react'
import { SelectRoot, SelectTrigger, SelectValueText, SelectLabel, SelectContent, SelectItem } from '@/components/ui/select'
import { Control, Controller, FieldValues, useWatch } from 'react-hook-form'
import { EntityLink } from '@/components/common/EntityLink'
import { usePagedProjectOptions } from '@/hooks/usePagedProjectOptions'

interface AssignedProjectSelectProps {
    control: Control<FieldValues>
    name: string
    label: string
    placeholder: string
}

export function AssignedProjectSelect({ control, name, label, placeholder }: AssignedProjectSelectProps) {
    const [isOpen, setIsOpen] = useState(false)

    const selectedValue: string | null = useWatch({ control, name }) || null
    const {
        searchTerm,
        setSearchTerm,
        searchOptions,
        options,
        isLoading,
        isFetching,
        pagination,
        handleScroll,
    } = usePagedProjectOptions(selectedValue ? [selectedValue] : [])

    const collection = useMemo(() => createListCollection({ items: options }), [options])
    const selectedOption = options.find((opt) => opt.value === selectedValue)

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <Field.Root orientation="vertical">
                    <SelectRoot
                        value={selectedValue ? [selectedValue] : []}
                        collection={collection}
                        size="sm"
                        positioning={{ placement: 'bottom-start' }}
                        open={isOpen}
                        onOpenChange={(e) => {
                            setIsOpen(e.open)
                            if (!e.open) setSearchTerm('')
                        }}
                        onValueChange={({ items }) => field.onChange(items[0]?.value || null)}
                        onInteractOutside={() => field.onBlur()}
                    >
                        <SelectLabel>{label}</SelectLabel>
                        <Box position="relative">
                            <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
                                {selectedOption ? (
                                    <EntityLink formName="project_management" itemId={selectedOption.value}>
                                        <Text fontSize="sm">{selectedOption.label}</Text>
                                    </EntityLink>
                                ) : (
                                    <SelectValueText placeholder={placeholder} />
                                )}
                            </SelectTrigger>
                        </Box>
                        <SelectContent portalled={false} maxH="300px" position="absolute" left="0" right="0" zIndex="dropdown" mt="1">
                            <Box p="2" borderBottomWidth="1px" position="sticky" top="0" bg="white" zIndex="1">
                                <Input
                                    placeholder="Search..."
                                    size="sm"
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
                                                <Text fontSize="sm">{option.label}</Text>
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
                                        <Text fontSize="sm">No options available</Text>
                                    </Box>
                                )}
                            </Box>
                        </SelectContent>
                    </SelectRoot>
                </Field.Root>
            )}
        />
    )
}
