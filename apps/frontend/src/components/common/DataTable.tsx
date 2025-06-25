import { Box, Table, Badge, Text } from '@chakra-ui/react'
import { Employee } from '@/data/employeeData'

interface DataTableProps {
    employees: Employee[]
    onEmployeeClick: (employee: Employee) => void
    formatDateTime: (datetime: string) => string
}

export function DataTable({
    employees,
    onEmployeeClick,
    formatDateTime,
}: DataTableProps) {
    return (
        <>
            <Text color="gray.500" fontSize="sm" mb={2}>
                Showing {employees.length} employees
            </Text>
            
            <Box borderWidth="1px" borderRadius="md" overflowX="auto">
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                            <Table.ColumnHeader>Role</Table.ColumnHeader>
                            <Table.ColumnHeader>Project</Table.ColumnHeader>
                            <Table.ColumnHeader>Manager</Table.ColumnHeader>
                            <Table.ColumnHeader>Type</Table.ColumnHeader>
                            <Table.ColumnHeader>Status</Table.ColumnHeader>
                            <Table.ColumnHeader>Last Active</Table.ColumnHeader>
                            <Table.ColumnHeader>Next Active</Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {employees.map((emp) => (
                            <Table.Row
                                key={emp.id}
                                onClick={() => onEmployeeClick(emp)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Table.Cell>
                                    {emp.firstName} {emp.lastName}
                                </Table.Cell>
                                <Table.Cell>{emp.role}</Table.Cell>
                                <Table.Cell>{emp.project}</Table.Cell>
                                <Table.Cell>{emp.manager}</Table.Cell>
                                <Table.Cell>
                                    <Badge
                                        colorScheme={
                                            emp.type === 'Consultant'
                                                ? 'blue'
                                                : 'gray'
                                        }
                                    >
                                        {emp.type}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge
                                        colorScheme={
                                            emp.status === 'Active'
                                                ? 'green'
                                                : 'red'
                                        }
                                    >
                                        {emp.status}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    {formatDateTime(emp.lastActiveTime)}
                                </Table.Cell>
                                <Table.Cell>
                                    {formatDateTime(emp.nextActiveTime)}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>
        </>
    )
}