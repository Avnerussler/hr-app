import { Box, Button, HStack, useDisclosure } from '@chakra-ui/react'
import { useLocation } from 'react-router-dom'
import {
    BreadcrumbRoot,
    BreadcrumbLink,
    BreadcrumbCurrentLink,
} from '../ui/breadcrumb'
import { ReportDownloadDialog } from '../ReportDownload/ReportDownloadDialog'
import { FiDownload } from 'react-icons/fi'

interface TopBarProps {
    pageName?: string
}

function getModuleDisplayName(pathname: string): string {
    const module = pathname.split('/')[1]
    switch (module) {
        case 'dashboard':
            return 'Dashboard'
        case 'todays-overview':
            return "Today's Overview"
        case 'personnel':
            return 'Personnel'
        case 'projects':
            return 'Projects'
        case 'quota-management':
            return 'נוכחות ומעקב יומי'
        case 'settings':
            return 'Settings'
        default:
            return ''
    }
}

export function TopBar({ pageName }: TopBarProps) {
    const location = useLocation()
    const moduleName = getModuleDisplayName(location.pathname)
    const { open, onOpen, onClose } = useDisclosure()
    return (
        <Box
            as="header"
            position="sticky"
            top={0}
            zIndex={10}
            bg="background"
            borderBottom="1px"
            borderColor="gray.200"
            px={4}
            py={3}
        >
            <HStack justifyContent="space-between" alignItems="center">
                <BreadcrumbRoot>
                    <BreadcrumbLink href="/" color="gray.500">
                        Pulse
                    </BreadcrumbLink>
                    {moduleName && (
                        <BreadcrumbCurrentLink fontWeight="medium">
                            {moduleName}
                        </BreadcrumbCurrentLink>
                    )}
                    {pageName && (
                        <BreadcrumbCurrentLink fontWeight="medium">
                            {pageName}
                        </BreadcrumbCurrentLink>
                    )}
                </BreadcrumbRoot>
                <Button onClick={onOpen} variant="outline" colorScheme="blue">
                    <FiDownload />
                    הורד דוחות
                </Button>
                <ReportDownloadDialog isOpen={open} onClose={onClose} />
            </HStack>
        </Box>
    )
}

//   <HStack gap={3}>
//                     <Box
//                         display={{ base: 'none', md: 'block' }}
//                         position="relative"
//                     >
//                         {/* Add icon if needed: leftIcon inside InputGroup */}
//                         <Input
//                             placeholder="Search..."
//                             w="256px"
//                             pl={4}
//                             bg="gray.100"
//                         />
//                     </Box>
//                     <Button variant="ghost" size="sm" position="relative">
//                         <FaBell />
//                         <Box
//                             position="absolute"
//                             top="-4px"
//                             right="-4px"
//                             w="8px"
//                             h="8px"
//                             bg="red.500"
//                             borderRadius="full"
//                         />
//                     </Button>
//                 </HStack>
