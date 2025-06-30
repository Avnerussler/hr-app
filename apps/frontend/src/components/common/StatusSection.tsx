import {
    Box,
    Flex,
    Text,
    Badge,
    HStack,
    VStack,
    Button,
} from '@chakra-ui/react'
import { ReactNode } from 'react'

export interface StatusItem {
    id: string | number
    title: string
    subtitle?: string | ReactNode
    status?: string
    badge?: {
        text: string
        colorScheme: string
    }
    action?: {
        label: string
        icon?: ReactNode
        onClick: () => void
    }
}

interface StatusSectionProps {
    title: string
    icon: ReactNode
    iconBg: string
    totalCount: number
    badge?: {
        text: string
        colorScheme: string
    }
    exportAction?: {
        label: string | ReactNode
        onClick: () => void
    }
    items: StatusItem[]
    onItemAction?: (id: string | number) => void
}

export function StatusSection({
    title,
    icon,
    iconBg,
    totalCount,
    badge,
    exportAction,
    items,
    // onItemAction,
}: StatusSectionProps) {
    return (
        <Box flex="1" p={5} borderWidth="1px" rounded="md" bg="white">
            <Flex justify="space-between" mb={4}>
                <HStack>
                    <Box p={2} bg={iconBg} rounded="xl">
                        {icon}
                    </Box>
                    <Box>
                        <Text fontSize="xl" fontWeight="bold">
                            {totalCount}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                            {title}
                        </Text>
                    </Box>
                </HStack>
                <HStack>
                    {badge && (
                        <Badge colorScheme={badge.colorScheme}>
                            {badge.text}
                        </Badge>
                    )}
                    {exportAction && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={exportAction.onClick}
                        >
                            {exportAction.label}
                        </Button>
                    )}
                </HStack>
            </Flex>
            <VStack gap={3} align="stretch">
                {items.map((item) => (
                    <Flex
                        key={item.id}
                        justify="space-between"
                        p={3}
                        bg="gray.50"
                        rounded="md"
                    >
                        <Box>
                            <Text fontWeight="medium">{item.title}</Text>
                            {item.subtitle && (
                                typeof item.subtitle === 'string' ? (
                                    <Text fontSize="sm" color="gray.500">
                                        {item.subtitle}
                                    </Text>
                                ) : (
                                    <Box fontSize="sm" color="gray.500">
                                        {item.subtitle}
                                    </Box>
                                )
                            )}
                        </Box>
                        {item.badge ? (
                            <Badge
                                colorScheme={item.badge.colorScheme}
                                display="flex"
                                alignItems="center"
                            >
                                {item.badge.text}
                            </Badge>
                        ) : (
                            item.action && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={item.action.onClick}
                                >
                                    {item.action.icon}
                                    {item.action.label}
                                </Button>
                            )
                        )}
                    </Flex>
                ))}
            </VStack>
        </Box>
    )
}
