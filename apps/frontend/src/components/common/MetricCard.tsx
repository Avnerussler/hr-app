import { Box, Flex, Icon, Text } from '@chakra-ui/react'

interface MetricCardProps {
    icon: React.ElementType
    label: string
    value: number
    color: string
    onClick?: () => void
    isActive?: boolean
}

export function MetricCard({
    icon,
    label,
    value,
    color,
    onClick,
    isActive,
}: MetricCardProps) {
    return (
        <Box
            p={4}
            borderRadius="md"
            cursor={onClick ? 'pointer' : 'default'}
            onClick={onClick}
            bg={isActive ? `${color}.50` : 'white'}
            borderColor={isActive ? `${color}.500` : 'gray.200'}
            borderWidth={'1px'}
        >
            <Flex align="center" gap={3}>
                <Icon as={icon} boxSize={6} color={color} />
                <Box>
                    <Text fontSize="sm" color="gray.500">
                        {label}
                    </Text>
                    <Text fontSize="lg" fontWeight="bold">
                        {value}
                    </Text>
                </Box>
            </Flex>
        </Box>
    )
}
