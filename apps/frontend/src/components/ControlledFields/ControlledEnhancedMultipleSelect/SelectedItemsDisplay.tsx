import { FC } from 'react'
import { Box, Text, Stack, Flex } from '@chakra-ui/react'
import { CloseButton } from '../../ui/close-button'

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
export const FormattedOption: FC<{
    option: any
    showCloseButton?: boolean
    onRemove?: () => void
}> = ({ option, showCloseButton, onRemove }) => {
    const metadata = option.metadata || {}
    const hasMetadata = Object.keys(metadata).length > 0

    if (!hasMetadata) {
        return (
            <Flex justifyContent="space-between" width="100%">
                <Text fontSize="sm">{option.label}</Text>
                {showCloseButton && onRemove && (
                    <CloseButton
                        size="xs"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove()
                        }}
                        colorPalette="red"
                    />
                )}
            </Flex>
        )
    }

    return (
        <Flex justifyContent="space-between" width="100%" gap="2">
            <Flex gap="2" flex="1" divideX="1px" divideColor="gray.300">
                {Object.entries(metadata).map(([key, value], index) => (
                    <Flex
                        key={key}
                        alignItems="center"
                        px={index > 0 ? '2' : '0'}
                    >
                        <FieldValue value={value} />
                    </Flex>
                ))}
            </Flex>
            {showCloseButton && onRemove && (
                <CloseButton
                    size="xs"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    colorPalette="red"
                />
            )}
        </Flex>
    )
}

interface SelectedItemsDisplayProps {
    selectedOptions: any[]
    onRemove: (value: string) => void
}

export const SelectedItemsDisplay: FC<SelectedItemsDisplayProps> = ({
    selectedOptions,
    onRemove,
}) => {
    if (selectedOptions.length === 0) return null

    return (
        <Box
            mt="2"
            p="3"
            borderWidth="1px"
            borderRadius="md"
            bg="gray.50"
            maxH="200px"
            overflowY="auto"
        >
            <Text fontSize="xs" fontWeight="medium" mb="2" color="gray.600">
                Selected ({selectedOptions.length})
            </Text>
            <Stack gap="1.5">
                {selectedOptions.map((option: any) => (
                    <Flex
                        key={option.value}
                        alignItems="center"
                        p="2"
                        bg="white"
                        borderRadius="sm"
                        borderWidth="1px"
                        borderColor="gray.200"
                        _hover={{
                            borderColor: 'blue.300',
                            bg: 'blue.50',
                        }}
                        transition="all 0.2s"
                    >
                        <FormattedOption
                            option={option}
                            showCloseButton
                            onRemove={() => onRemove(option.value)}
                        />
                    </Flex>
                ))}
            </Stack>
        </Box>
    )
}
