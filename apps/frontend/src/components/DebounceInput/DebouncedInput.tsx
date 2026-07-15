// src/components/DebounceInput.tsx
import React, { useState, ChangeEvent, useEffect } from 'react'
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
    const [inputValue, setInputValue] = useState<string>(value || '')

    const debouncedValue = useDebounce(inputValue, debounceTime)

    // Sync inward: parent cleared or reset the value
    useEffect(() => {
        setInputValue(value || '')
    }, [value])

    // Sync outward: notify parent after debounce
    useEffect(() => {
        if (debouncedValue !== value) {
            onChange(debouncedValue)
        }
    }, [debouncedValue])

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
