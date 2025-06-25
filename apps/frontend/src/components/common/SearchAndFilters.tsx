import { Flex, Input } from '@chakra-ui/react'
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
} from '../ui/select'
import { ListCollection } from '@chakra-ui/react'

interface FilterOption {
    value: string
    label: string
}

interface SearchAndFiltersProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    filters?: {
        label: string
        collection: ListCollection<FilterOption>
        onValueChange: (value: any) => void
        placeholder?: string
    }[]
}

export function SearchAndFilters({
    searchTerm,
    onSearchChange,
    filters = [],
}: SearchAndFiltersProps) {
    return (
        <Flex mb={4} direction={{ base: 'column', md: 'row' }} gap={4}>
            <Input
                placeholder="Search by name, role..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            
            {filters.map((filter, index) => (
                <SelectRoot
                    key={index}
                    collection={filter.collection}
                    onValueChange={filter.onValueChange}
                >
                    <SelectTrigger>
                        <SelectValueText placeholder={filter.placeholder || 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {filter.collection.items.map((option) => (
                            <SelectItem item={option} key={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </SelectRoot>
            ))}
        </Flex>
    )
}