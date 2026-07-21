import {
    VStack,
    HStack,
    Text,
    Box,
    Button,
    Input,
    createListCollection,
} from '@chakra-ui/react'
import {
    DrawerRoot,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerTitle,
    DrawerCloseTrigger,
} from '../ui/drawer'
import {
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    SelectContent,
    SelectItem,
} from '../ui/select'
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
import { REQUEST_STATUS_LABELS, ORDER_TYPE_LABELS } from '@hr-app/shared-types'

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
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const [projectFilter, setProjectFilter] = useState<string[]>([])
    const [orderTypeFilter, setOrderTypeFilter] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const [isReportOpen, setIsReportOpen] = useState(false)

    const debouncedSearch = useDebounce(searchQuery, 300)

    const updateIndividualMutation = useUpdateIndividualAttendanceMutation()
    const managerReportMutation = useManagerReportMutation()

    // Stats query — always fetches full-day totals, never re-fetches on filter/page change.
    // Also the source of truth for which filter values actually occur today.
    const { data: statsData } = useEmployeeAttendanceQuery({
        date: selectedDate,
        filter: 'all',
        search: '',
        page: 1,
        limit: 1,
    })

    const availableFilters = statsData?.availableFilters

    const statusCollection = useMemo(
        () =>
            createListCollection({
                items: (availableFilters?.requestStatuses ?? []).map((value) => ({
                    value,
                    label: REQUEST_STATUS_LABELS[value] ?? value,
                })),
            }),
        [availableFilters?.requestStatuses]
    )

    const projectCollection = useMemo(
        () =>
            createListCollection({
                items: availableFilters?.projects ?? [],
            }),
        [availableFilters?.projects]
    )

    const orderTypeCollection = useMemo(
        () =>
            createListCollection({
                items: (availableFilters?.orderTypes ?? []).map((value) => ({
                    value,
                    label: ORDER_TYPE_LABELS[value as keyof typeof ORDER_TYPE_LABELS] ?? value,
                })),
            }),
        [availableFilters?.orderTypes]
    )

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
        requestStatus: statusFilter,
        projectId: projectFilter,
        orderType: orderTypeFilter,
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
        setStatusFilter([])
        setProjectFilter([])
        setOrderTypeFilter([])
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
    const hasActiveFilters =
        activeFilter !== 'all' ||
        searchQuery !== '' ||
        statusFilter.length > 0 ||
        projectFilter.length > 0 ||
        orderTypeFilter.length > 0

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

                            <HStack gap={1} mb={3}>
                                <SelectRoot
                                    collection={statusCollection}
                                    size="sm"
                                    minW="180px"
                                    multiple
                                    value={statusFilter}
                                    onValueChange={(details) => {
                                        setStatusFilter(details.value)
                                        setPage(1)
                                    }}
                                >
                                    <SelectTrigger clearable>
                                        <SelectValueText placeholder="סטטוס בקשה" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusCollection.items.map(
                                            (option) => (
                                                <SelectItem
                                                    item={option}
                                                    key={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </SelectRoot>

                                <SelectRoot
                                    collection={projectCollection}
                                    size="sm"
                                    minW="180px"
                                    multiple
                                    value={projectFilter}
                                    onValueChange={(details) => {
                                        setProjectFilter(details.value)
                                        setPage(1)
                                    }}
                                >
                                    <SelectTrigger clearable>
                                        <SelectValueText placeholder="פרויקט" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projectCollection.items.map(
                                            (option) => (
                                                <SelectItem
                                                    item={option}
                                                    key={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </SelectRoot>

                                <SelectRoot
                                    collection={orderTypeCollection}
                                    size="sm"
                                    minW="180px"
                                    multiple
                                    value={orderTypeFilter}
                                    onValueChange={(details) => {
                                        setOrderTypeFilter(details.value)
                                        setPage(1)
                                    }}
                                >
                                    <SelectTrigger clearable>
                                        <SelectValueText placeholder="סוג צו" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orderTypeCollection.items.map(
                                            (option) => (
                                                <SelectItem
                                                    item={option}
                                                    key={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </SelectRoot>
                            </HStack>

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
