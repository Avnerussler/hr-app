import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Button,
    IconButton,
    Icon,
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation, Outlet } from 'react-router-dom'
import { generateFormPath } from '@/types/routeTypes'
import {
    FiActivity,
    FiBarChart2,
    FiCalendar,
    FiLogOut,
    FiSettings,
    FiUser,
} from 'react-icons/fi'
import { TopBar } from './TopBar'
import { Avatar } from '../ui/avatar'
import { useFormsQuery } from '@/hooks/queries/useFormQueries'

export function Layout() {
    const { pathname } = useLocation()
    const { data, isSuccess } = useFormsQuery()

    const menuItems = [
        {
            id: 'overview',
            label: "Today's Overview",
            icon: FiCalendar,
            description: 'Daily Operations',
        },
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: FiBarChart2,
            description: 'Analytics & Insights',
        },
    ]
    return (
        <Flex h="100vh" w="full">
            {/* Sidebar */}
            <Box
                w="280px"
                bg="sidebar"
                borderRightWidth="1px"
                borderColor="sidebar.border"
                display="flex"
                flexDirection="column"
            >
                {/* Header */}
                <Box p={6}>
                    <HStack gap={3}>
                        <Box
                            w="40px"
                            h="40px"
                            bg="primary"
                            borderRadius="xl"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            shadow="sm"
                        >
                            <FiActivity
                                size="20px"
                                color="var(--primary-foreground)"
                            />
                        </Box>
                        <Box>
                            <Text
                                fontSize="xl"
                                fontWeight="bold"
                                color="sidebar.foreground"
                            >
                                Pulse
                            </Text>
                            <Text fontSize="xs" color="muted.foreground">
                                HR Management
                            </Text>
                        </Box>
                    </HStack>
                </Box>

                {/* Content */}
                <Box flex="1" px={3}>
                    <VStack gap={2} align="stretch">
                        <Box px={3} py={2}>
                            <Text
                                mb={2}
                                px={2}
                                fontSize="xs"
                                fontWeight="semibold"
                                letterSpacing="wide"
                                color="muted.foreground"
                                textTransform="uppercase"
                            >
                                Main Menu
                            </Text>
                        </Box>

                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname.includes(item.id)

                            return (
                                <Button
                                    key={item.id}
                                    as={RouterLink}
                                    // @ts-expect-error: 'to' is valid when 'as' is RouterLink
                                    to={`/${item.id}`}
                                    variant="ghost"
                                    justifyContent="flex-start"
                                    h="48px"
                                    px={3}
                                    borderRadius="lg"
                                    bg={
                                        isActive
                                            ? 'sidebar.accent'
                                            : 'transparent'
                                    }
                                    _hover={{
                                        bg: 'sidebar.accent',
                                    }}
                                    transition="all 0.2s"
                                    role="group"
                                >
                                    <HStack gap={3} w="full">
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            w="32px"
                                            h="32px"
                                            borderRadius="lg"
                                            bg={
                                                isActive
                                                    ? 'sidebar.primary'
                                                    : 'sidebar.accent'
                                            }
                                            color={
                                                isActive
                                                    ? 'sidebar.primary.foreground'
                                                    : 'sidebar.accent.foreground'
                                            }
                                            _groupHover={{
                                                bg: 'sidebar.primary',
                                                color: 'sidebar.primary.foreground',
                                            }}
                                            transition="colors 0.2s"
                                        >
                                            <Icon size="16px" />
                                        </Box>
                                        <Box flex="1" textAlign="left">
                                            <Text
                                                fontWeight="medium"
                                                color="sidebar.foreground"
                                            >
                                                {item.label}
                                            </Text>
                                            <Text
                                                fontSize="xs"
                                                color="muted.foreground"
                                            >
                                                {item.description}
                                            </Text>
                                        </Box>
                                    </HStack>
                                </Button>
                            )
                        })}

                        {isSuccess &&
                            data.forms.map((item) => {
                                // const Icon = item.icon
                                const isActive = pathname.includes(item._id)

                                return (
                                    <Button
                                        key={item._id}
                                        as={RouterLink}
                                        // @ts-expect-error: 'to' is valid when 'as' is RouterLink
                                        to={generateFormPath(
                                            item.formName,
                                            item._id
                                        )}
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        h="48px"
                                        px={3}
                                        borderRadius="lg"
                                        bg={
                                            isActive
                                                ? 'sidebar.accent'
                                                : 'transparent'
                                        }
                                        _hover={{
                                            bg: 'sidebar.accent',
                                        }}
                                        transition="all 0.2s"
                                        role="group"
                                    >
                                        <HStack gap={3} w="full">
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                w="32px"
                                                h="32px"
                                                borderRadius="lg"
                                                bg={
                                                    isActive
                                                        ? 'sidebar.primary'
                                                        : 'sidebar.accent'
                                                }
                                                color={
                                                    isActive
                                                        ? 'sidebar.primary.foreground'
                                                        : 'sidebar.accent.foreground'
                                                }
                                                _groupHover={{
                                                    bg: 'sidebar.primary',
                                                    color: 'sidebar.primary.foreground',
                                                }}
                                                transition="colors 0.2s"
                                            >
                                                {/* <Icon size="16px" /> */}
                                            </Box>
                                            <Box flex="1" textAlign="left">
                                                <Text
                                                    fontWeight="medium"
                                                    color="sidebar.foreground"
                                                >
                                                    {item.formName}
                                                </Text>
                                                <Text
                                                    fontSize="xs"
                                                    color="muted.foreground"
                                                >
                                                    {item.description}
                                                </Text>
                                            </Box>
                                        </HStack>
                                    </Button>
                                )
                            })}
                    </VStack>
                </Box>

                {/* Footer */}
                <Box p={4} borderTopWidth="1px" borderColor="sidebar.border">
                    <HStack gap={3} p={3} borderRadius="lg" bg="sidebar.accent">
                        <Avatar size="sm">
                            <FiUser />
                        </Avatar>
                        <Box flex="1" minW="0">
                            <Text
                                fontSize="sm"
                                fontWeight="medium"
                                color="sidebar.foreground"
                                // noOfLines={1}
                            >
                                John Doe
                            </Text>
                            <Text
                                fontSize="xs"
                                color="muted.foreground"
                                // noOfLines={1}
                            >
                                HR Manager
                            </Text>
                        </Box>
                        <IconButton
                            variant="ghost"
                            size="sm"
                            aria-label="Logout"
                            opacity={0.6}
                            _hover={{ opacity: 1 }}
                        >
                            <FiLogOut size="16px" />
                        </IconButton>
                    </HStack>
                </Box>
            </Box>

            {/* Main Content */}
            <Box
                flex="1"
                overflow="auto"
                // bg="muted"
                p={6}
                _dark={{
                    bg: 'bg.subtle',
                }}
            >
                <TopBar />
                <Outlet />
            </Box>
        </Flex>
    )
}
