import { Box, Button, Flex, Heading, Text, HStack } from '@chakra-ui/react'
import { IconType } from 'react-icons'

interface PageHeaderAction {
    label: string
    icon?: IconType
    variant?: 'solid' | 'outline' | 'ghost'
    onClick: () => void
    disabled?: boolean
}

interface PageHeaderProps {
    title: string
    description?: string
    icon?: IconType
    action?: PageHeaderAction
    actions?: PageHeaderAction[]
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    action,
    actions,
}: PageHeaderProps) {
    const allActions = actions || (action ? [action] : [])

    return (
        <Flex justify="space-between" align="center" mb={6}>
            <Box>
                <HStack gap={3} align="center">
                    {Icon && (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            w="48px"
                            h="48px"
                            bg="primary"
                            borderRadius="lg"
                            shadow="sm"
                        >
                            <Icon
                                size="24px"
                                color="var(--primary-foreground)"
                            />
                        </Box>
                    )}
                    <Box>
                        <Heading size="lg">{title}</Heading>
                        {description && (
                            <Text color="gray.500">{description}</Text>
                        )}
                    </Box>
                </HStack>
            </Box>
            {allActions.length > 0 && (
                <HStack gap={2}>
                    {allActions.map((actionItem, index) => {
                        const ActionIcon = actionItem.icon
                        return (
                            <Button
                                key={index}
                                onClick={actionItem.onClick}
                                variant={actionItem.variant || 'solid'}
                                disabled={actionItem.disabled}
                            >
                                {ActionIcon && <ActionIcon />}
                                {actionItem.label}
                            </Button>
                        )
                    })}
                </HStack>
            )}
        </Flex>
    )
}
