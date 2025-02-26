import { FC } from 'react'
import { Button, Stack } from '@chakra-ui/react'
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form'
import { FormGenerator } from '../FormGenerator'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AllFormSubmission, FormSubmission } from '@/types/formType'

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
    const queryClient = useQueryClient()
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

    const createMutation = useMutation({
        mutationFn: (formData: FieldValues) => {
            return axios.post(
                'http://localhost:3001/api/formSubmission/create',
                { formData, formId, formName: formFields?.form.formName }
            )
        },
        onSuccess({ data }) {
            queryClient.setQueryData(
                ['formSubmission/get', formId],
                (oldData: AllFormSubmission) => {
                    return { forms: [...oldData.forms, data.form] }
                }
            )
        },
    })

    const editMutation = useMutation({
        mutationFn: (formData: FieldValues) => {
            return axios.post(
                'http://localhost:3001/api/formSubmission/update',
                { formData, id: defaultValues?._id }
            )
        },
        onSuccess({ data }) {
            queryClient.setQueryData(
                ['formSubmission/get', formId],
                (oldData: AllFormSubmission) => {
                    const updatedData = oldData.forms.map((form) => {
                        if (form._id === defaultValues?._id) {
                            return data.form
                        }
                        return form
                    })

                    return { forms: updatedData }
                }
            )
        },
    })

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        if (formMode === 'update') {
            return editMutation.mutate(data)
        }
        createMutation.mutate(data)
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
                    {formFields?.form?.formFields.map((field) => (
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
                    ))}

                    <Button type="submit">
                        {formMode === 'create' ? 'Create' : 'Update'}
                    </Button>
                </Stack>
            )
        }
    }

    return <form onSubmit={handleSubmit(onSubmit)}>{renderForm()}</form>
}
