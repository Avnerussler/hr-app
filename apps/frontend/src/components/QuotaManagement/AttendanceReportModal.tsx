import { Box, HStack, Text, VStack, IconButton } from '@chakra-ui/react'
import { Button } from '@chakra-ui/react'
import {
    DialogBackdrop,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
} from '../ui/dialog'
import { IoClose } from 'react-icons/io5'
import { useEmployeeAttendanceQuery } from '@/hooks/queries'

type FilterType =
    | 'all'
    | 'starting'
    | 'ending'
    | 'attended'
    | 'internal'
    | 'external'

interface AttendanceReportModalProps {
    isOpen: boolean
    onClose: () => void
    date: string
    filter: FilterType
    search: string
    title: string
}

export function AttendanceReportModal({
    isOpen,
    onClose,
    date,
    filter,
    search,
    title,
}: AttendanceReportModalProps) {
    const { data, isLoading } = useEmployeeAttendanceQuery(
        { date, filter, search, page: 1, limit: 9999 },
        { enabled: isOpen }
    )

    const employees = data?.employees ?? []

    return (
        <DialogRoot
            open={isOpen}
            onOpenChange={(details) => details.open || onClose()}
            size="lg"
        >
            <DialogBackdrop backdropFilter="blur(4px)" />
            <DialogContent
                backdrop={false}
                maxH="80vh"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                dir="rtl"
            >
                <DialogHeader>
                    <HStack justify="space-between" align="center" w="full">
                        <DialogTitle>דוח נוכחות — {title}</DialogTitle>
                        <IconButton
                            aria-label="סגור"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            <IoClose />
                        </IconButton>
                    </HStack>
                </DialogHeader>

                <DialogBody overflowY="auto" flex="1">
                    {isLoading ? (
                        <Box textAlign="center" p={8}>
                            <Text>טוען...</Text>
                        </Box>
                    ) : employees.length === 0 ? (
                        <Box textAlign="center" p={8}>
                            <Text color="gray.500">אין עובדים בסינון זה</Text>
                        </Box>
                    ) : (
                        <VStack gap={0} align="stretch">
                            <Text fontSize="sm" color="gray.500" mb={3}>
                                סה"כ: {employees.length} עובדים
                            </Text>

                            {/* Table header */}
                            <HStack
                                gap={0}
                                bg="gray.100"
                                px={3}
                                py={2}
                                borderRadius="md"
                                mb={1}
                                fontWeight="bold"
                                fontSize="sm"
                            >
                                <Text flex="1">שם פרטי</Text>
                                <Text flex="1">שם משפחה</Text>
                                <Text flex="1">מספר אישי</Text>
                                <Text w="24" textAlign="center">
                                    ימי מילואים
                                </Text>
                            </HStack>

                            {/* Table rows */}
                            {employees.map((emp, index) => (
                                <HStack
                                    key={emp._id}
                                    gap={0}
                                    px={3}
                                    py={2}
                                    fontSize="sm"
                                    borderBottomWidth="1px"
                                    borderColor="gray.100"
                                    _hover={{ bg: 'gray.50' }}
                                >
                                    <Text
                                        w="12"
                                        textAlign="center"
                                        color="gray.500"
                                    >
                                        {index + 1}
                                    </Text>
                                    <Text flex="1">{emp.name}</Text>
                                    <Text flex="1">{emp.lastName ?? '—'}</Text>
                                    <Text flex="1">
                                        {emp.personalNumber ?? '—'}
                                    </Text>
                                    <Text w="24" textAlign="center">
                                        {emp.reserveDays?.length ?? 0}
                                    </Text>
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </DialogBody>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>
                        סגור
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    )
}
