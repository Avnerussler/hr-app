import { VStack, HStack, Text, Box, Button, Input } from '@chakra-ui/react'
import {
    DrawerRoot,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerCloseTrigger,
} from '../ui/drawer'
import { memo, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    FaUsers,
    FaSignInAlt,
    FaSignOutAlt,
    FaCalendarCheck,
    FaBuilding,
} from 'react-icons/fa'
import { MetricCard } from '../common/MetricCard'
import { EmployeeAttendanceCard } from './EmployeeAttendanceCard'
import { AttendanceReportModal } from './AttendanceReportModal'
import {
    useEmployeeAttendanceQuery,
    useManagerReportStatusQuery,
} from '@/hooks/queries'
import {
    useUpdateIndividualAttendanceMutation,
    useManagerReportMutation,
} from '@/hooks/mutations'
import {
    PaginationRoot,
    PaginationItems,
    PaginationPrevTrigger,
    PaginationNextTrigger,
} from '../ui/pagination'
import useDebounce from '@/hooks/useDebounce'

interface DailyAttendanceDrawerProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: string
}

type FilterType =
    | 'all'
    | 'starting'
    | 'ending'
    | 'attended'
    | 'internal'
    | 'external'

const PAGE_SIZE = 30

const FILTER_LABELS: Record<FilterType, string> = {
    all: 'כל העובדים',
    starting: 'מתחילים היום',
    ending: 'מסיימים היום',
    attended: 'הגיעו בפועל',
    internal: 'מימון פנימי',
    external: 'מימון חיצוני',
}

interface StatsProps {
    startingToday: number
    endingToday: number
    totalRequired: number
    totalAttended: number
    internalCount: number
    externalCount: number
    activeFilter: FilterType
    onFilterClick: (filter: FilterType) => void
}

const AttendanceStats = memo(function AttendanceStats({
    startingToday,
    endingToday,
    totalRequired,
    totalAttended,
    internalCount,
    externalCount,
    activeFilter,
    onFilterClick,
}: StatsProps) {
    return (
        <Box>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
                סטטיסטיקות יומיות
            </Text>
            <HStack gap={4} wrap="wrap">
                <MetricCard
                    label="מתחילים היום"
                    value={startingToday}
                    icon={FaSignInAlt}
                    color="green"
                    onClick={() => onFilterClick('starting')}
                    isActive={activeFilter === 'starting'}
                />
                <MetricCard
                    label="מסיימים היום"
                    value={endingToday}
                    icon={FaSignOutAlt}
                    color="orange"
                    onClick={() => onFilterClick('ending')}
                    isActive={activeFilter === 'ending'}
                />
                <MetricCard
                    label="סה״כ נדרשים"
                    value={totalRequired}
                    icon={FaUsers}
                    color="blue"
                    onClick={() => onFilterClick('all')}
                    isActive={activeFilter === 'all'}
                />
                <MetricCard
                    label="הגיעו בפועל"
                    value={totalAttended}
                    icon={FaCalendarCheck}
                    color={totalAttended === totalRequired ? 'green' : 'purple'}
                    onClick={() => onFilterClick('attended')}
                    isActive={activeFilter === 'attended'}
                />
                <MetricCard
                    label="מימון פנימי"
                    value={internalCount}
                    icon={FaBuilding}
                    color="teal"
                    onClick={() => onFilterClick('internal')}
                    isActive={activeFilter === 'internal'}
                />
                <MetricCard
                    label="מימון חיצוני"
                    value={externalCount}
                    icon={FaBuilding}
                    color="cyan"
                    onClick={() => onFilterClick('external')}
                    isActive={activeFilter === 'external'}
                />
            </HStack>
        </Box>
    )
})

export function DailyAttendanceDrawer({
    isOpen,
    onClose,
    selectedDate,
}: DailyAttendanceDrawerProps) {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [page, setPage] = useState(1)
    const [isReportOpen, setIsReportOpen] = useState(false)

    const debouncedSearch = useDebounce(searchQuery, 300)

    const updateIndividualMutation = useUpdateIndividualAttendanceMutation()
    const managerReportMutation = useManagerReportMutation()

    // Stats query — always fetches full-day totals, never re-fetches on filter/page change
    const { data: statsData } = useEmployeeAttendanceQuery({
        date: selectedDate,
        filter: 'all',
        search: '',
        page: 1,
        limit: 1,
    })

    // List query — responds to filter, search, and page
    const {
        data: attendanceData,
        isLoading,
        error,
    } = useEmployeeAttendanceQuery({
        date: selectedDate,
        filter: activeFilter,
        search: debouncedSearch,
        page,
        limit: PAGE_SIZE,
    })

    const { data: managerReportStatus, isLoading: isLoadingManagerStatus } =
        useManagerReportStatusQuery(selectedDate)

    const stats = useMemo(() => {
        const s = statsData?.statistics
        return {
            startingToday: s?.startingToday ?? 0,
            endingToday: s?.endingToday ?? 0,
            totalRequired: s?.totalRequired ?? 0,
            totalAttended: s?.totalAttended ?? 0,
            internalCount: s?.internalCount ?? 0,
            externalCount: s?.externalCount ?? 0,
        }
    }, [statsData?.statistics])

    const pagination = attendanceData?.pagination
    const employees = attendanceData?.employees ?? []

    const handleClearFilter = () => {
        setActiveFilter('all')
        setSearchQuery('')
        setPage(1)
    }

    const handleFilterClick = (filter: FilterType) => {
        if (filter === 'all') {
            handleClearFilter()
            return
        }
        const next = activeFilter === filter ? 'all' : filter
        setActiveFilter(next)
        setSearchQuery('')
        setPage(1)
    }

    const handleAttendanceToggle = async (
        employeeId: string,
        attended: boolean
    ) => {
        try {
            await updateIndividualMutation.mutateAsync({
                employeeId,
                date: selectedDate,
                hasAttended: attended,
            })
        } catch (error) {
            console.error('Failed to update attendance:', error)
        }
    }

    const handleManagerReport = async () => {
        try {
            await managerReportMutation.mutateAsync({
                date: selectedDate,
            })
        } catch (error) {
            console.error('Failed to submit manager report:', error)
        }
    }

    const hasManagerReported = managerReportStatus?.hasReported ?? false
    const isManagerReporting = managerReportMutation.isPending
    const hasActiveFilters = activeFilter !== 'all' || searchQuery !== ''

    const formatDateDisplay = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy (EEEE)', {
                locale: he,
            })
        } catch {
            return dateStr
        }
    }

    return (
        <DrawerRoot
            size="lg"
            open={isOpen}
            onOpenChange={(details) => details.open || onClose()}
        >
            <DrawerContent display="flex" flexDirection="column" h="100%">
                <DrawerHeader borderBottomWidth="1px" flexShrink={0}>
                    <DrawerTitle>
                        נוכחות יומית - {formatDateDisplay(selectedDate)}
                    </DrawerTitle>
                    <DrawerCloseTrigger />
                </DrawerHeader>

                <DrawerBody>
                    <VStack gap={6} align="stretch">
                        <AttendanceStats
                            {...stats}
                            activeFilter={activeFilter}
                            onFilterClick={handleFilterClick}
                        />

                        {/* Employee List */}
                        <Box>
                            <HStack justify="space-between" mb={4}>
                                <Text fontSize="lg" fontWeight="bold">
                                    רשימת עובדים ({pagination?.total ?? 0})
                                </Text>
                                {hasActiveFilters && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleClearFilter}
                                    >
                                        נקה סינון
                                    </Button>
                                )}
                            </HStack>

                            <Box mb={3}>
                                <Input
                                    placeholder="חפש עובדים (שם, ת.ז., מייל...)"
                                    size="sm"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </Box>

                            {isLoading ? (
                                <Box textAlign="center" p={8}>
                                    <Text>טוען נתוני עובדים...</Text>
                                </Box>
                            ) : error ? (
                                <Box textAlign="center" p={8}>
                                    <Text color="red.500">
                                        שגיאה בטעינת נתונים
                                    </Text>
                                </Box>
                            ) : employees.length === 0 ? (
                                <Box textAlign="center" p={8}>
                                    <Text color="gray.500">
                                        {!hasActiveFilters
                                            ? 'אין עובדים שצריכים להגיע היום'
                                            : 'אין עובדים בסינון זה'}
                                    </Text>
                                </Box>
                            ) : (
                                <VStack gap={3} align="stretch">
                                    {employees.map((employee) => (
                                        <EmployeeAttendanceCard
                                            key={employee._id}
                                            employee={employee}
                                            currentAttendance={
                                                employee.hasAttended
                                            }
                                            onAttendanceToggle={
                                                handleAttendanceToggle
                                            }
                                        />
                                    ))}
                                </VStack>
                            )}

                            {pagination && pagination.totalPages > 1 && (
                                <HStack justify="center" mt={4}>
                                    <PaginationRoot
                                        count={pagination.total}
                                        pageSize={PAGE_SIZE}
                                        page={page}
                                        onPageChange={(details) =>
                                            setPage(details.page)
                                        }
                                    >
                                        <HStack gap={1}>
                                            <PaginationPrevTrigger />
                                            <PaginationItems />
                                            <PaginationNextTrigger />
                                        </HStack>
                                    </PaginationRoot>
                                </HStack>
                            )}
                        </Box>
                    </VStack>
                </DrawerBody>

                <DrawerFooter borderTopWidth="1px" flexShrink={0}>
                    <HStack gap={3} w="full" justify="space-between">
                        <HStack gap={3}>
                            <Button variant="ghost" onClick={onClose}>
                                ביטול
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={handleManagerReport}
                                disabled={
                                    hasManagerReported || isLoadingManagerStatus
                                }
                                loading={isManagerReporting}
                            >
                                {isManagerReporting
                                    ? 'מדווח לקישור...'
                                    : hasManagerReported
                                      ? 'דווח לקישור'
                                      : 'דווח לקישור'}
                            </Button>
                        </HStack>
                        <Button
                            variant="outline"
                            onClick={() => setIsReportOpen(true)}
                        >
                            הצג דוח
                        </Button>
                    </HStack>
                </DrawerFooter>
            </DrawerContent>

            <AttendanceReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                date={selectedDate}
                filter={activeFilter}
                search={debouncedSearch}
                title={FILTER_LABELS[activeFilter]}
            />
        </DrawerRoot>
    )
}
