import { FC } from 'react'
import { Button, Stack } from '@chakra-ui/react'
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form'
import { FormGenerator } from '../FormGenerator'
import { useQuery } from '@tanstack/react-query'
import { FormSubmission } from '@/types/formType'
import {
    useCreateFormSubmission,
    useUpdateFormSubmission,
} from '@/hooks/mutations'

interface GenericFormProps {
    formId: string
    defaultValues?: FieldValues
    formMode: 'create' | 'update'
}

export const GenericForm: FC<GenericFormProps> = ({
    formId,
    defaultValues,
    formMode,
}) => {
    const { control, handleSubmit } = useForm<FieldValues>({
        defaultValues: defaultValues ? defaultValues.formData : {},
    })
    const {
        data: formFields,
        isSuccess,
        isLoading,
    } = useQuery<FormSubmission>({
        queryKey: ['formFields/get', formId],
        enabled: !!formId,
        staleTime: 1000 * 60 * 5,
    })

    const createMutation = useCreateFormSubmission()
    const updateMutation = useUpdateFormSubmission()

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        if (formMode === 'update' && defaultValues?._id) {
            updateMutation.mutate({
                formData: data,
                id: defaultValues._id,
                formId,
            })
        } else {
            createMutation.mutate({
                formData: data,
                formId,
                formName: formFields?.form.formName,
            })
        }
    }

    const renderForm = () => {
        if (isLoading) {
            return <div>Loading...</div>
        }
        if (!formFields?.form) {
            return <div>No Form Available</div>
        }

        if (isSuccess && formFields.form) {
            return (
                <Stack
                    gap="8"
                    // maxW="sm"
                    css={{ '--field-label-width': '96px' }}
                >
                    {formFields?.form?.formFields.map((field) => {
                        return (
                            <FormGenerator
                                {...field}
                                control={control}
                                key={field._id}
                                id={field._id}
                                label={field.label}
                                name={field.name}
                                placeholder={field.placeholder}
                                required={field.required}
                                type={field.type}
                                options={field.options}
                            />
                        )
                    })}

                    <Button type="submit">
                        {formMode === 'create' ? 'Create' : 'Update'}
                    </Button>
                </Stack>
            )
        }
    }

    return <form onSubmit={handleSubmit(onSubmit)}>{renderForm()}</form>
}
