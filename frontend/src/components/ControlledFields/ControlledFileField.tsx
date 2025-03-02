import { ChangeEvent, FC } from 'react'
import { Control, Controller, FieldValues } from 'react-hook-form'

import {
    FileInput,
    FileUploadClearTrigger,
    FileUploadLabel,
    FileUploadRoot,
} from '../ui/file-upload'
import { InputGroup } from '../ui/input-group'
import { LuFileUp } from 'react-icons/lu'
import { MdDeleteForever } from 'react-icons/md'
import { CloseButton } from '../ui/close-button'
import axios from 'axios'
import { Box, Field, Flex, IconButton, Link } from '@chakra-ui/react'

// const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
// const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

interface ControlledFileInputProps extends FieldValues {
    control: Control
}

export const ControlledFileInput: FC<ControlledFileInputProps> = ({
    control,
    name,
    ...props
}) => {
    const handleDeleteFile = async (onChange: (fileUrl: string) => void) => {
        onChange('')
    }
    const handleChange = async (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange: (fileUrl: string) => void,
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files ? event.target.files[0] : null
        if (!file) return

        const { data } = await axios.get(
            'http://localhost:3001/api/file/generate-presigned-url',
            {
                params: {
                    fileName: file.name,
                    fileType: file.type,
                },
            }
        )

        const uploadResponse = await axios.put(data, file, {
            headers: { 'Content-Type': file.type },
        })

        if (uploadResponse.status === 200) {
            const BUCKET_URL = 'http://localhost:9000'
            const BUCKET_NAME = 'uploads'
            const fileUrl = `${BUCKET_URL}/${BUCKET_NAME}/${file.name}`
            onChange(fileUrl)
        } else {
            throw new Error('Upload failed')
        }
    }
    return (
        <Controller
            name={name}
            control={control}
            rules={
                {
                    // validate: (fileUrl) => {
                    //     if (!fileUrl) return 'File is required'
                    //     return true
                    // },
                    // required: 'File is required',
                    // validate: (file: File | null) => {
                    //     if (!file) return
                    //     if (file.size > MAX_FILE_SIZE)
                    //         return 'File size exceeds 5MB limit'
                    //     if (!ALLOWED_TYPES.includes(file.type))
                    //         return 'Invalid file type. Allowed: PNG, JPEG, PDF'
                    //     return true
                    // },
                }
            }
            render={({ field: { onChange, value } }) => {
                return (
                    <Field.Root orientation="vertical" w="100%">
                        <FileUploadRoot
                            accept={'.png, .jpeg, .jpg, .pdf'}
                            gap="1"
                            onChange={(
                                event: ChangeEvent<HTMLInputElement>
                            ) => {
                                handleChange(onChange, event)
                            }}
                            {...props}
                        >
                            <FileUploadLabel>{props.label}</FileUploadLabel>
                            <InputGroup
                                w="full"
                                startElement={<LuFileUp />}
                                endElement={
                                    <FileUploadClearTrigger asChild>
                                        <CloseButton
                                            me="-1"
                                            size="xs"
                                            variant="plain"
                                            focusVisibleRing="inside"
                                            focusRingWidth="2px"
                                            pointerEvents="auto"
                                            color="fg.subtle"
                                        />
                                    </FileUploadClearTrigger>
                                }
                            >
                                <FileInput />
                            </InputGroup>
                        </FileUploadRoot>
                        <Box>
                            {value && (
                                <Flex
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={1}
                                >
                                    <Link href={value}>{value}</Link>

                                    <IconButton
                                        variant="ghost"
                                        size="2xs"
                                        onClick={() =>
                                            handleDeleteFile(onChange)
                                        }
                                    >
                                        <MdDeleteForever size="2xs" />
                                    </IconButton>
                                </Flex>
                            )}
                        </Box>
                    </Field.Root>
                )
            }}
        />
    )
}
