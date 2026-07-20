import { Box, Flex, Text } from '@chakra-ui/react'
import { PersonnelOption } from '@/hooks/queries/useProjectQueries'

/** Renders a personnel option's name alongside its active/inactive status dot. */
export function PersonnelOptionDisplay({
    option,
    hideStatusDot = false,
}: {
    option: PersonnelOption
    hideStatusDot?: boolean
}) {
    return (
        <Flex alignItems="center" gap="2" width="100%">
            <Text fontSize="sm" flex="1">
                {option.label}
            </Text>
            {!hideStatusDot && option.metadata && (
                <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={option.metadata.isActive ? 'green.500' : 'red.500'}
                    flexShrink={0}
                    title={option.metadata.isActive ? 'פעיל' : 'לא פעיל'}
                />
            )}
        </Flex>
    )
}
