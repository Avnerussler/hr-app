import { FC, RefObject, useState, useCallback, useMemo } from 'react'
import { createListCollection, Field, Box } from '@chakra-ui/react'
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectLabel,
} from '@/components/ui/select'
import { Control, Controller, FieldValues, useWatch } from 'react-hook-form'
import { useRouteContext } from '@/hooks/useRouteContext'
import { useEnhancedSelectOptions } from '@/hooks/useEnhancedSelectOptions'
import { SelectedItemsDisplay } from './SelectedItemsDisplay'
import { SelectDropdownContent } from './SelectDropdownContent'

interface ControlledEnhancedMultipleSelectFieldProps extends FieldValues {
    control: Control
    contentRef?: RefObject<HTMLElement>
}

export const ControlledEnhancedMultipleSelectField: FC<
    ControlledEnhancedMultipleSelectFieldProps
> = ({ control, name, options: initialOptions = [], ...props }) => {
    const [isOpen, setIsOpen] = useState(false)
    const { formId } = useRouteContext()

    // Watch for the current field value
    const fieldValue = useWatch({ control, name }) || []

    // Use custom hook for options management
    const {
        searchTerm,
        setSearchTerm,
        displayOptions,
        selectedOptions,
        isLoading,
        isFetching,
        paginatedData,
        handleLoadMore,
    } = useEnhancedSelectOptions({
        formId,
        fieldName: name,
        initialOptions,
        selectedValues: fieldValue,
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
                const selectedValues = field.value ? field.value : []

                const handleRemove = (valueToRemove: string) => {
                    const newValues = selectedValues.filter(
                        (val: string) => val !== valueToRemove
                    )
                    field.onChange(newValues)
                }

                return (
                    <Field.Root orientation="vertical">
                        <SelectRoot
                            multiple
                            value={selectedValues}
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
                                field.onChange(items.map((item) => item.value))
                            }
                            onInteractOutside={() => field.onBlur()}
                        >
                            <SelectLabel>{props.label}</SelectLabel>
                            <Box position="relative">
                                <SelectTrigger
                                    onClick={() => setIsOpen(!isOpen)}
                                >
                                    <SelectValueText
                                        placeholder={
                                            selectedOptions.length > 0
                                                ? `${selectedOptions.length} selected`
                                                : props.placeholder
                                        }
                                    />
                                </SelectTrigger>

                                {/* Selected items display */}
                                <SelectedItemsDisplay
                                    selectedOptions={selectedOptions}
                                    onRemove={handleRemove}
                                />
                            </Box>

                            {/* Dropdown content */}
                            <SelectDropdownContent
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                displayOptions={displayOptions}
                                isLoading={isLoading}
                                isFetching={isFetching}
                                isOpen={isOpen}
                                paginatedData={paginatedData}
                                debouncedSearch={searchTerm}
                                onScroll={handleScroll}
                            />
                        </SelectRoot>
                    </Field.Root>
                )
            }}
        />
    )
}
