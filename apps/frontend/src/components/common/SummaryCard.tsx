import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { useColorModeValue } from '../ui/color-mode'
import { ReactNode } from 'react'

interface SummaryItem {
    id: string | number
    title: string
    subtitle?: string
    value: string | number
    valueLabel?: string
}

interface SummaryCardProps {
    title: string
    description?: string
    icon?: ReactNode
    items: SummaryItem[]
    summaryItem?: {
        title: string
        subtitle: string
        value: string | number
        valueLabel: string
    }
}

export function SummaryCard({
    title,
    description,
    icon,
    items,
    summaryItem,
}: SummaryCardProps) {
    const mutedBg = useColorModeValue('gray.50', 'gray.700')

    return (
        <Box>
            <Flex mb={4} align="center" gap={2}>
                {icon}
                <Box>
                    <Text fontSize="xl" fontWeight="bold">
                        {title}
                    </Text>
                    {description && (
                        <Text fontSize="sm" color="gray.500">
                            {description}
                        </Text>
                    )}
                </Box>
            </Flex>
            <Stack gap={4}>
                {items.map((item) => (
                    <Flex
                        key={item.id}
                        justify="space-between"
                        p={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        bg={mutedBg}
                    >
                        <Box>
                            <Text fontWeight="medium">{item.title}</Text>
                            {item.subtitle && (
                                <Text fontSize="sm" color="gray.500">
                                    {item.subtitle}
                                </Text>
                            )}
                        </Box>
                        <Box textAlign="right">
                            <Text
                                fontSize="xl"
                                fontWeight="bold"
                                color="green.600"
                            >
                                {item.value}
                            </Text>
                            {item.valueLabel && (
                                <Text fontSize="sm" color="gray.500">
                                    {item.valueLabel}
                                </Text>
                            )}
                        </Box>
                    </Flex>
                ))}

                {summaryItem && (
                    <Flex
                        justify="space-between"
                        p={4}
                        borderWidth="2px"
                        borderRadius="lg"
                        borderColor="blue.200"
                        bg="blue.50"
                    >
                        <Box>
                            <Text fontWeight="semibold">{summaryItem.title}</Text>
                            <Text fontSize="sm" color="gray.500">
                                {summaryItem.subtitle}
                            </Text>
                        </Box>
                        <Box textAlign="right">
                            <Text
                                fontSize="xl"
                                fontWeight="bold"
                                color="blue.600"
                            >
                                {summaryItem.value}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                                {summaryItem.valueLabel}
                            </Text>
                        </Box>
                    </Flex>
                )}
            </Stack>
        </Box>
    )
}