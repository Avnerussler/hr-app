import { useState, useMemo } from 'react'
import { Field, Input, Box } from '@chakra-ui/react'

import { Control, Controller, FieldValues } from 'react-hook-form'

interface ControlledSelectAutocompleteFieldProps extends FieldValues {
    control: Control
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
        return options.filter((option: any) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [options, searchTerm])

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={props.defaultValue}
            rules={{ required: props.required }}
            render={({ field, fieldState: { error } }) => {
                const selectedOption = options.find(
                    (opt) => opt.value === field.value
                )

                return (
                    <Field.Root orientation="vertical" invalid={!!error}>
                        {props.label && (
                            <Field.Label>{props.label}</Field.Label>
                        )}
                        <Box position="relative">
                            <Input
                                size={props.size || 'sm'}
                                placeholder={props.placeholder}
                                value={
                                    isOpen
                                        ? searchTerm
                                        : selectedOption?.label || ''
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
                            />
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
                                    {filteredOptions.map((option: any) => (
                                        <Box
                                            key={option.value}
                                            px={3}
                                            py={2}
                                            cursor="pointer"
                                            _hover={{ bg: 'gray.100' }}
                                            onClick={() => {
                                                field.onChange(option.value)
                                                setIsOpen(false)
                                                setSearchTerm('')
                                            }}
                                        >
                                            {option.label}
                                        </Box>
                                    ))}
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
