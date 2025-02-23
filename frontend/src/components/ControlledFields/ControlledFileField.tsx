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
import { CloseButton } from '../ui/close-button'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

interface ControlledFileInputProps extends FieldValues {
    control: Control
}

export const ControlledFileInput: FC<ControlledFileInputProps> = ({
    control,
    name,
    ...props
}) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={{
                // required: 'File is required',
                validate: (file: File | null) => {
                    if (!file) return
                    if (file.size > MAX_FILE_SIZE)
                        return 'File size exceeds 5MB limit'
                    if (!ALLOWED_TYPES.includes(file.type))
                        return 'Invalid file type. Allowed: PNG, JPEG, PDF'
                    return true
                },
            }}
            render={({ field: { onChange } }) => (
                <FileUploadRoot
                    accept={'.png, .jpeg, .jpg, .pdf'}
                    gap="1"
                    maxWidth="300px"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        onChange(
                            event.target.files ? event.target.files[0] : null
                        )
                    }}
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
                        <FileInput {...props} />
                    </InputGroup>
                </FileUploadRoot>
            )}
        />
    )
}
