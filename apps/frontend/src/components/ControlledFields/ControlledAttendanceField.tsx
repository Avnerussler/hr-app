import {
    Field,
    Input,
    Button,
    Box,
    Flex,
    Text,
    IconButton,
    Card,
} from '@chakra-ui/react'
import {
    Control,
    Controller,
    useFieldArray,
    FieldValues,
    useWatch,
} from 'react-hook-form'
import { FiPlus, FiTrash2, FiClock } from 'react-icons/fi'

interface ControlledAttendanceFieldProps extends FieldValues {
    control: Control
}

export const ControlledAttendanceField = ({
    control,
    name,
    id,
}: ControlledAttendanceFieldProps) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: name,
    })

    const watchedFields = useWatch({
        control,
        name: name,
    })

    const addAttendanceEntry = () => {
        append({ day: '', timeStart: '', timeEnd: '' })
    }

    const calculateWorkingHours = (
        timeStart: string,
        timeEnd: string
    ): string => {
        if (!timeStart || !timeEnd) return '0:00'

        const [startHours, startMinutes] = timeStart.split(':').map(Number)
        const [endHours, endMinutes] = timeEnd.split(':').map(Number)

        const startTotalMinutes = startHours * 60 + startMinutes
        const endTotalMinutes = endHours * 60 + endMinutes

        let diffMinutes = endTotalMinutes - startTotalMinutes

        if (diffMinutes < 0) {
            diffMinutes += 24 * 60
        }

        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60

        return `${hours}:${minutes.toString().padStart(2, '0')}`
    }

    return (
        <Field.Root
            key={id}
            orientation="vertical"
            flex="1"
            minH={0}
            display="flex"
            flexDirection="column"
        >
            {fields.length === 0 && (
                <Text color="fg.muted" fontSize="sm" mb={3}>
                    No attendance entries. Click "Add Day" to get started.
                </Text>
            )}

            {fields.map((field, index) => {
                const currentDay = watchedFields?.[index]
                const workingHours = currentDay
                    ? calculateWorkingHours(
                          currentDay.timeStart,
                          currentDay.timeEnd
                      )
                    : '0:00'

                return (
                    <Card.Root width="100%" key={field.id} mb={3}>
                        <Card.Body>
                            <Flex gap={4} align="start">
                                {/* Left side: Date and Times */}
                                <Box flex="1">
                                    <Controller
                                        name={`${name}.${index}.day`}
                                        control={control}
                                        defaultValue=""
                                        render={({ field: dayField }) => (
                                            <Field.Root mb={3}>
                                                <Field.Label fontSize="sm">
                                                    Date
                                                </Field.Label>
                                                <Input
                                                    {...dayField}
                                                    type="date"
                                                    size="sm"
                                                />
                                            </Field.Root>
                                        )}
                                    />

                                    <Flex gap={3} align="end">
                                        <Box flex="1">
                                            <Controller
                                                name={`${name}.${index}.timeStart`}
                                                control={control}
                                                defaultValue=""
                                                render={({
                                                    field: startField,
                                                }) => (
                                                    <Field.Root>
                                                        <Field.Label fontSize="sm">
                                                            Start Time
                                                        </Field.Label>
                                                        <Input
                                                            {...startField}
                                                            type="time"
                                                            size="sm"
                                                        />
                                                    </Field.Root>
                                                )}
                                            />
                                        </Box>

                                        <Box flex="1">
                                            <Controller
                                                name={`${name}.${index}.timeEnd`}
                                                control={control}
                                                defaultValue=""
                                                render={({
                                                    field: endField,
                                                }) => (
                                                    <Field.Root>
                                                        <Field.Label fontSize="sm">
                                                            End Time
                                                        </Field.Label>
                                                        <Input
                                                            {...endField}
                                                            type="time"
                                                            size="sm"
                                                        />
                                                    </Field.Root>
                                                )}
                                            />
                                        </Box>
                                    </Flex>
                                </Box>

                                {/* Right side: Working hours calculation and remove button */}
                                <Flex direction="column" align="end" gap={2}>
                                    <IconButton
                                        aria-label="Remove entry"
                                        variant="ghost"
                                        size="sm"
                                        colorScheme="red"
                                        onClick={() => remove(index)}
                                    >
                                        <FiTrash2 />
                                    </IconButton>

                                    <Flex
                                        align="center"
                                        gap={2}
                                        p={2}
                                        bg="bg.muted"
                                        borderRadius="md"
                                        minW="120px"
                                    >
                                        <FiClock size={16} />
                                        <Text fontSize="sm" fontWeight="medium">
                                            {workingHours}
                                        </Text>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Card.Body>
                    </Card.Root>
                )
            })}

            <Button
                variant="outline"
                size="sm"
                onClick={addAttendanceEntry}
                mt={2}
            >
                <FiPlus />
                Add Day
            </Button>
        </Field.Root>
    )
}
