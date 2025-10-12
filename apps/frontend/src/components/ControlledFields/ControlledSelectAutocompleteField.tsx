import { useState, useMemo } from 'react'
import { Field, Input, Box, IconButton, Flex } from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'

import { Control, Controller, FieldValues } from 'react-hook-form'

interface SelectOption {
    value: string
    label: string
}

interface ControlledSelectAutocompleteFieldProps extends FieldValues {
    control: Control
    options: SelectOption[]
}

export const ControlledSelectAutocompleteField = ({
    control,
    name,
    options,

    ...props
}: ControlledSelectAutocompleteFieldProps) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options
        return options.filter((option: SelectOption) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [options, searchTerm])

    const handleClearSelection = (fieldOnChange: (value: string) => void) => {
        fieldOnChange('')
        setSearchTerm('')
        setIsOpen(false)
    }

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            rules={{ required: props.required }}
            render={({ field, fieldState: { error } }) => {
                // Handle both plain string values and object values with _id field
                const fieldValueId = typeof field.value === 'object' && field.value?._id
                    ? field.value._id
                    : field.value

                const selectedOption = options.find(
                    (opt: SelectOption) => opt.value === fieldValueId
                )

                // Display value: use object's display field if available, otherwise use selectedOption label
                const displayValue = typeof field.value === 'object' && field.value?.display
                    ? field.value.display
                    : selectedOption?.label || ''

                return (
                    <Field.Root orientation="vertical" invalid={!!error} width="100%">
                        {props.label && (
                            <Field.Label>{props.label}</Field.Label>
                        )}
                        <Box position="relative" width="100%">
                            <Input
                                size={props.size}
                                placeholder={props.placeholder}
                                value={
                                    isOpen
                                        ? searchTerm
                                        : displayValue
                                }
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    if (!isOpen) setIsOpen(true)
                                }}
                                onFocus={() => {
                                    setIsOpen(true)
                                    setSearchTerm('')
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setIsOpen(false)
                                        setSearchTerm('')
                                        field.onBlur()
                                    }, 200)
                                }}
                                autoComplete="off"
                                paddingRight={field.value ? "40px" : undefined}
                            />
                            {field.value && !isOpen && (
                                <IconButton
                                    aria-label="Clear selection"
                                    size="xs"
                                    variant="ghost"
                                    position="absolute"
                                    right="8px"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleClearSelection(field.onChange)
                                    }}
                                >
                                    <LuX />
                                </IconButton>
                            )}
                            {isOpen && filteredOptions.length > 0 && (
                                <Box
                                    position="absolute"
                                    top="100%"
                                    left={0}
                                    right={0}
                                    bg="white"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    shadow="md"
                                    zIndex={1000}
                                    maxHeight="200px"
                                    overflowY="auto"
                                >
                                    {filteredOptions.map(
                                        (option: SelectOption) => {
                                            const isSelected = option.value === fieldValueId
                                            return (
                                                <Flex
                                                    key={option.value}
                                                    px={3}
                                                    py={2}
                                                    cursor="pointer"
                                                    bg={isSelected ? 'blue.50' : 'white'}
                                                    color={isSelected ? 'blue.700' : 'inherit'}
                                                    fontWeight={isSelected ? 'semibold' : 'normal'}
                                                    _hover={{ bg: isSelected ? 'blue.100' : 'gray.100' }}
                                                    onClick={() => {
                                                        field.onChange(option.value)
                                                        setIsOpen(false)
                                                        setSearchTerm('')
                                                    }}
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    gap={2}
                                                >
                                                    <Box flex={1}>{option.label}</Box>
                                                    {isSelected && (
                                                        <IconButton
                                                            aria-label="Unselect option"
                                                            size="xs"
                                                            variant="ghost"
                                                            colorPalette="red"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleClearSelection(field.onChange)
                                                            }}
                                                        >
                                                            <LuX />
                                                        </IconButton>
                                                    )}
                                                </Flex>
                                            )
                                        }
                                    )}
                                </Box>
                            )}
                            {isOpen &&
                                filteredOptions.length === 0 &&
                                searchTerm && (
                                    <Box
                                        position="absolute"
                                        top="100%"
                                        left={0}
                                        right={0}
                                        bg="white"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        borderRadius="md"
                                        shadow="md"
                                        zIndex={1000}
                                        px={3}
                                        py={2}
                                        color="gray.500"
                                    >
                                        לא נמצאו תוצאות
                                    </Box>
                                )}
                        </Box>
                        {error && (
                            <Field.ErrorText>{error.message}</Field.ErrorText>
                        )}
                    </Field.Root>
                )
            }}
        />
    )
}
