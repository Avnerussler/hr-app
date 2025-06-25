import { Box, Flex, Icon, Text } from '@chakra-ui/react'

interface MetricCardProps {
    icon: React.ElementType
    label: string
    value: number
    color: string
}

export function MetricCard({ icon, label, value, color }: MetricCardProps) {
    return (
        <Box p={4} borderWidth="1px" borderRadius="md">
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
