import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    description?: string
    action?: {
        label: string
        icon?: ReactNode
        onClick: () => void
    }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <Flex justify="space-between" align="center" mb={6}>
            <Box>
                <Heading size="lg">{title}</Heading>
                {description && (
                    <Text color="gray.500">{description}</Text>
                )}
            </Box>
            {action && (
                <Button onClick={action.onClick}>
                    {action.icon}
                    {action.label}
                </Button>
            )}
        </Flex>
    )
}