import { FC, useRef } from 'react'
import { Box, Input, Text, Spinner } from '@chakra-ui/react'
import { SelectItem, SelectContent } from '@/components/ui/select'
import { createListCollection } from '@chakra-ui/react'
import { FormattedOption } from './SelectedItemsDisplay'

interface SelectDropdownContentProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    displayOptions: any[]
    isLoading: boolean
    isFetching: boolean
    isOpen: boolean
    paginatedData: any
    debouncedSearch: string
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

export const SelectDropdownContent: FC<SelectDropdownContentProps> = ({
    searchTerm,
    onSearchChange,
    displayOptions,
    isLoading,
    isFetching,
    isOpen,
    paginatedData,
    debouncedSearch,
    onScroll,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const frameworks = (
        options: {
            label: string
            value: string
            metadata?: Record<string, any>
        }[]
    ) =>
        createListCollection({
            items: options,
        })

    return (
        <SelectContent
            portalled={false}
            maxH="300px"
            position="absolute"
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
                    onChange={(e) => onSearchChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
                {debouncedSearch && paginatedData?.pagination && (
                    <Text fontSize="xs" color="gray.500" mt="1">
                        Found {paginatedData.pagination.total} results
                    </Text>
                )}
            </Box>

            {/* Options list */}
            <Box
                ref={scrollContainerRef}
                maxH="250px"
                overflowY="auto"
                onScroll={onScroll}
            >
                {isLoading && !displayOptions.length ? (
                    <Box p="4" textAlign="center">
                        <Spinner size="sm" />
                        <Text fontSize="sm" mt="2">
                            Searching...
                        </Text>
                    </Box>
                ) : displayOptions.length > 0 ? (
                    <>
                        {frameworks(displayOptions).items.map((option) => (
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
    )
}
