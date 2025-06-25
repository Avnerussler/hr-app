// src/components/DebounceInput.tsx
import React, { useState, ChangeEvent, useEffect, useRef } from 'react'
import { Input, InputProps, Text, VStack } from '@chakra-ui/react'
import useDebounce from '@/hooks/useDebounce'

interface DebouncedInputProps extends Omit<InputProps, 'onChange'> {
    value: string
    onChange: (value: string) => void
    debounceTime?: number
    minChars?: number
    showDebounceIndicator?: boolean
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
    value,
    onChange,
    debounceTime = 500,
    minChars = 3,
    showDebounceIndicator = false,
    ...inputProps
}) => {
    // Store internal input value
    const [inputValue, setInputValue] = useState<string>(value || '')

    // Track if we're handling an external value change
    const isExternalChange = useRef(false)

    // Apply debounce to the internal value
    const debouncedValue = useDebounce(inputValue, debounceTime)

    // Handle external value changes (from parent/column)
    useEffect(() => {
        if (value !== inputValue && !isExternalChange.current) {
            setInputValue(value || '')
        }
    }, [value])

    // Send debounced value to parent only when debounced value changes
    useEffect(() => {
        if (debouncedValue !== value) {
            isExternalChange.current = true
            onChange(debouncedValue)
            // Reset the flag after the update
            setTimeout(() => {
                isExternalChange.current = false
            }, 0)
        }
    }, [debouncedValue, onChange, value])

    // Handle local input changes
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const isDebouncing = inputValue !== debouncedValue

    return (
        <VStack align="stretch">
            <Input
                {...inputProps}
                size="sm"
                value={inputValue}
                onChange={handleInputChange}
            />

            {showDebounceIndicator && isDebouncing && (
                <Text fontSize="xs" color="gray.500" textAlign="right">
                    {inputValue.length < minChars
                        ? 'Updating immediately...'
                        : 'Waiting for you to stop typing...'}
                </Text>
            )}
        </VStack>
    )
}
