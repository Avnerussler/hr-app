import { FC, RefObject, useState, useCallback, useMemo } from 'react'
import { createListCollection, Field, Box, Input, Text, Spinner, Flex } from '@chakra-ui/react'
import {
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from '@/components/ui/select'
import { Control, Controller, FieldValues, useWatch } from 'react-hook-form'
import { useRouteContext } from '@/hooks/useRouteContext'
import { useEnhancedSelectOptions } from '@/hooks/useEnhancedSelectOptions'

// Helper component to render a field value with appropriate formatting
const FieldValue: FC<{ value: any }> = ({ value }) => {
    // Check if value is boolean
    if (typeof value === 'boolean' || value === 'true' || value === 'false') {
        const boolValue = value === true || value === 'true'
        return (
            <Flex alignItems="center" gap="1">
                <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={boolValue ? 'green.500' : 'red.500'}
                />
            </Flex>
        )
    }

    // Regular text value
    return <Text>{value}</Text>
}

// Helper to render formatted option with metadata
const FormattedOption: FC<{ option: any }> = ({ option }) => {
    const metadata = option.metadata || {}
    const hasMetadata = Object.keys(metadata).length > 0

    if (!hasMetadata) {
        return <Text fontSize="sm">{option.label}</Text>
    }

    return (
        <Flex gap="2" flex="1" divideX="1px" divideColor="gray.300">
            {Object.entries(metadata).map(([key, value], index) => (
                <Flex key={key} alignItems="center" px={index > 0 ? '2' : '0'}>
                    <FieldValue value={value} />
                </Flex>
            ))}
        </Flex>
    )
}

interface ControlledEnhancedSelectFieldProps extends FieldValues {
    control: Control
    contentRef?: RefObject<HTMLElement>
}

export const ControlledEnhancedSelectField: FC<
    ControlledEnhancedSelectFieldProps
> = ({ control, name, options: initialOptions = [], ...props }) => {
    const [isOpen, setIsOpen] = useState(false)
    const { formId } = useRouteContext()

    // Watch for the current field value (single value, not array)
    const fieldValue = useWatch({ control, name })
    const selectedValues = fieldValue ? [fieldValue] : []

    // Use custom hook for options management
    const {
        searchTerm,
        setSearchTerm,
        displayOptions,
        isLoading,
        isFetching,
        paginatedData,
        handleLoadMore,
    } = useEnhancedSelectOptions({
        formId,
        fieldName: name,
        initialOptions,
        selectedValues,
        isOpen,
    })

    // Scroll handler for infinite loading
    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.currentTarget
            const scrollPosition = target.scrollTop + target.clientHeight
            const scrollHeight = target.scrollHeight
            const threshold = scrollHeight - 100

            if (
                scrollPosition >= threshold &&
                paginatedData?.pagination.hasMore &&
                !isLoading &&
                !isFetching
            ) {
                handleLoadMore()
            }
        },
        [paginatedData, isLoading, isFetching, handleLoadMore]
    )

    // Create collection for Chakra Select
    const frameworks = useMemo(
        () =>
            createListCollection({
                items: displayOptions,
            }),
        [displayOptions]
    )

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            render={({ field }) => {
                const selectedValue = field.value || ''

                // Find the selected option for display
                const selectedOption = displayOptions.find(
                    (opt: any) => opt.value === selectedValue
                )

                return (
                    <Field.Root orientation="vertical">
                        <SelectRoot
                            value={selectedValue ? [selectedValue] : []}
                            collection={frameworks}
                            size="sm"
                            positioning={{ placement: 'bottom-start' }}
                            {...props}
                            open={isOpen}
                            onOpenChange={(e) => {
                                setIsOpen(e.open)
                                if (!e.open) {
                                    setSearchTerm('')
                                }
                            }}
                            onValueChange={({ items }) =>
                                field.onChange(items[0]?.value || '')
                            }
                            onInteractOutside={() => field.onBlur()}
                        >
                            <SelectLabel>{props.label}</SelectLabel>
                            <Box position="relative">
                                <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
                                    <SelectValueText
                                        placeholder={
                                            selectedOption?.label || props.placeholder
                                        }
                                    />
                                </SelectTrigger>
                            </Box>

                            {/* Dropdown content */}
                            <SelectContent
                                portalled={false}
                                maxH="300px"
                                position="absolute"
                                top="100%"
                                left="0"
                                right="0"
                                zIndex="dropdown"
                                mt="1"
                            >
                                {/* Search input */}
                                <Box
                                    p="2"
                                    borderBottomWidth="1px"
                                    position="sticky"
                                    top="0"
                                    bg="white"
                                    zIndex="1"
                                >
                                    <Input
                                        placeholder="Search..."
                                        size="sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    {searchTerm && paginatedData?.pagination && (
                                        <Text fontSize="xs" color="gray.500" mt="1">
                                            Found {paginatedData.pagination.total} results
                                        </Text>
                                    )}
                                </Box>

                                {/* Options list */}
                                <Box maxH="250px" overflowY="auto" onScroll={handleScroll}>
                                    {isLoading && !displayOptions.length ? (
                                        <Box p="4" textAlign="center">
                                            <Spinner size="sm" />
                                            <Text fontSize="sm" mt="2">
                                                Searching...
                                            </Text>
                                        </Box>
                                    ) : displayOptions.length > 0 ? (
                                        <>
                                            {frameworks.items.map((option) => (
                                                <SelectItem item={option} key={option.value}>
                                                    <FormattedOption option={option} />
                                                </SelectItem>
                                            ))}
                                            {/* Infinite scroll loading indicator */}
                                            {isOpen && paginatedData?.pagination?.hasMore && (
                                                <Box p="2" textAlign="center" minH="40px">
                                                    {isFetching ? (
                                                        <>
                                                            <Spinner size="sm" />
                                                            <Text
                                                                fontSize="xs"
                                                                color="gray.500"
                                                                mt="1"
                                                            >
                                                                Loading more...
                                                            </Text>
                                                        </>
                                                    ) : (
                                                        <Text fontSize="xs" color="gray.500">
                                                            Scroll for more (
                                                            {(paginatedData?.pagination?.total ||
                                                                0) - displayOptions.length}{' '}
                                                            remaining)
                                                        </Text>
                                                    )}
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
                )
            }}
        />
    )
}
