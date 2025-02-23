import { FC } from 'react'
import { Button, Stack } from '@chakra-ui/react'
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form'
import { FormGenerator } from '../FormGenerator'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { FormSubmission } from '@/types/formType'

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
        defaultValues: defaultValues ? { FirstName: 'avner' } : {},
    })

    const {
        data: formFields,
        isSuccess,
        isLoading,
    } = useQuery<FormSubmission>({
        queryKey: ['formFields/get', formId],
        enabled: !!formId,
    })

    const createMutation = useMutation({
        mutationFn: (newForm: FieldValues) => {
            return axios.post(
                'http://localhost:3001/api/formSubmission/create',
                newForm,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )
        },
        onSuccess(data) {
            queryClient.setQueryData(
                ['formSubmission/get', formId],
                (oldData: { forms: FormSubmission[] }) => {
                    return { forms: [...oldData.forms, data.data] }
                }
            )
        },
    })

    const editMutation = useMutation({
        mutationFn: (newForm: FieldValues) => {
            return axios.put(
                `http://localhost:3001/api/formSubmission/update/${defaultValues?._id}`,
                newForm,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )
        },
        // onSuccess(data) {
        //     queryClient.setQueryData(
        //         ['formSubmission/get', formId],
        //         (oldData: { forms: FormSubmission[] }) => {
        //             return { forms: [...oldData.forms, data.data] }
        //         }
        //     )
        // },
    })

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        console.log(' :80 ~ data:', data)

        const formData = new FormData()

        // Append all form fields to FormData
        Object.keys(data).forEach((key) => {
            if (data[key] instanceof File) {
                formData.append('file', data[key] ? data[key] : '')
            } else {
                if (
                    data[key] instanceof Array ||
                    typeof data[key] === 'object'
                ) {
                    return formData.append(key, JSON.stringify(data[key]))
                }
                formData.append(key, data[key])
            }
        })
        formData.append('formName', formFields?.form.formName as string)
        formData.append('formId', formId as string)

        if (formMode === 'update') {
            return editMutation.mutate(formData)
        }
        createMutation.mutate(formData)
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
                    {formFields.form.formFields.map((field) => (
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
