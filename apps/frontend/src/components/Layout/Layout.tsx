import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Button,
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@chakra-ui/react'
import { Link as RouterLink, useLocation, Outlet } from 'react-router-dom'
import { useColorModeValue } from '../ui/color-mode'

// React Icons
import {
    FiCalendar,
    FiBarChart2,
    FiUsers,
    FiFolder,
    FiSettings,
    FiActivity,
    FiLogOut,
    FiUser,
} from 'react-icons/fi'
import { TopBar } from './TopBar'

const menuItems = [
    {
        id: '',
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
    {
        id: 'personnel',
        label: 'Personnel',
        icon: FiUsers,
        description: 'Employee Management',
    },
    {
        id: 'projects',
        label: 'Projects',
        icon: FiFolder,
        description: 'Project Tracking',
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: FiSettings,
        description: 'System Configuration',
    },
]

export function Layout() {
    const { pathname } = useLocation()
    const currentModule = pathname.slice(1) || ''
    console.log(' currentModule:', currentModule)

    return (
        <Flex h="100vh" w="100%">
            {/* Sidebar */}
            <Box
                w="250px"
                borderRight="1px solid"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
                display="flex"
                flexDirection="column"
            >
                {/* Header */}
                <Box p="6">
                    <HStack>
                        <Flex
                            w="10"
                            h="10"
                            bg="blue.500"
                            rounded="xl"
                            align="center"
                            justify="center"
                            boxShadow="sm"
                        >
                            <FiActivity color="white" size={20} />
                        </Flex>
                        <Box>
                            <Text fontSize="xl" fontWeight="bold">
                                Pulse
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                HR Management
                            </Text>
                        </Box>
                    </HStack>
                </Box>

                {/* Menu */}
                <VStack align="stretch" p="3" flex="1">
                    <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.500"
                        textTransform="uppercase"
                    >
                        Main Menu
                    </Text>
                    {menuItems.map((item) => (
                        <Button
                            key={item.id}
                            as={RouterLink}
                            // @ts-expect-error: 'to' is valid when 'as' is RouterLink
                            to={`/${item.id}`}
                            justifyContent="flex-start"
                            variant="ghost"
                            height="48px"
                            px="3"
                            rounded="md"
                            bg={
                                currentModule === item.id
                                    ? 'gray.100'
                                    : 'transparent'
                            }
                            _hover={{ bg: 'gray.100' }}
                        >
                            <item.icon />
                            <VStack align="flex-start">
                                <Text fontSize="sm">{item.label}</Text>
                                <Text fontSize="xs" color="gray.500">
                                    {item.description}
                                </Text>
                            </VStack>
                        </Button>
                    ))}
                </VStack>

                {/* Footer */}
                <Box
                    p="4"
                    borderTop="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                >
                    <HStack>
                        {/* <Avatar size="sm">
                            <AvatarImage
                                src="/api/placeholder/32/32"
                                alt="User"
                            />
                            <AvatarFallback>
                                <FiUser />
                            </AvatarFallback>
                        </Avatar> */}
                        <Box flex="1" minW="0">
                            <Text fontSize="sm">John Doe</Text>
                            <Text fontSize="xs" color="gray.500">
                                HR Manager
                            </Text>
                        </Box>
                        <Button aria-label="Logout" variant="ghost" size="sm">
                            <FiLogOut />
                        </Button>
                    </HStack>
                </Box>
            </Box>

            {/* Main Content */}
            <Box
                flex="1"
                overflow="auto"
                bg={useColorModeValue('gray.50', 'gray.800')}
                p="6"
            >
                <TopBar />
                <Outlet />
            </Box>
        </Flex>
    )
}
