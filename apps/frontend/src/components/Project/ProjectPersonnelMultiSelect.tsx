import { useMemo, useState } from 'react'
import { Box, Text, Stack, Flex, createListCollection, Field } from '@chakra-ui/react'
import { SelectRoot, SelectTrigger, SelectValueText, SelectLabel } from '@/components/ui/select'
import { Control, Controller, FieldValues, useWatch } from 'react-hook-form'
import { CloseButton } from '@/components/ui/close-button'
import { SelectItem, SelectContent } from '@/components/ui/select'
import { Spinner } from '@chakra-ui/react'
import { EntityLink } from '@/components/common/EntityLink'
import { PersonnelOptionDisplay } from './PersonnelOptionDisplay'
import { PersonnelOption } from '@/hooks/queries/useProjectQueries'
import { usePagedPersonnelOptions } from '@/hooks/usePagedPersonnelOptions'

interface ProjectPersonnelMultiSelectProps {
    control: Control<FieldValues>
    name: string
    label: string
    placeholder: string
}

function SelectedPersonnelList({
    selectedOptions,
    onRemove,
}: {
    selectedOptions: PersonnelOption[]
    onRemove: (value: string) => void
}) {
    if (selectedOptions.length === 0) return null
    return (
        <Box mt="2" p="3" borderWidth="1px" borderRadius="md" bg="gray.50" maxH="200px" overflowY="auto">
            <Text fontSize="xs" fontWeight="medium" mb="2" color="gray.600">
                Selected ({selectedOptions.length})
            </Text>
            <Stack gap="1.5">
                {selectedOptions.map((option) => (
                    <Flex
                        key={option.value}
                        alignItems="center"
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
                                <PersonnelOptionDisplay option={option} />
                            </EntityLink>
                        </Box>
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
                                <SelectedPersonnelList selectedOptions={selectedOptions} onRemove={handleRemove} />
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
