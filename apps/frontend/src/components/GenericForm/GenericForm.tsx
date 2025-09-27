import { FC } from 'react'
import { Button } from '@chakra-ui/react'
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form'
import { FormGenerator } from '../FormGenerator'
import { useQuery } from '@tanstack/react-query'
import {
    useCreateFormSubmission,
    useUpdateFormSubmission,
} from '@/hooks/mutations'
import { IForm } from '@/types/fieldsType'

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
    const { control, handleSubmit, setError, clearErrors } =
        useForm<FieldValues>({
            defaultValues: defaultValues ? defaultValues.formData : {},
        })
    const {
        data: formFields,
        isSuccess,
        isLoading,
    } = useQuery<IForm>({
        queryKey: ['formFields/get', formId],
        enabled: !!formId,
        staleTime: 1000 * 60 * 5,
    })

    // Handle field validation errors from server
    const handleFieldError = (fieldName: string, message: string) => {
        setError(fieldName, {
            type: 'server',
            message: message,
        })
    }

    const createMutation = useCreateFormSubmission(handleFieldError)
    const updateMutation = useUpdateFormSubmission(handleFieldError)

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        try {
            // Clear any previous server errors before submitting
            clearErrors()

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
                    formName: formFields?.formName || '',
                })
            }
        } catch (error) {
            console.error('Error submitting form:', error)
        }
    }

    const renderForm = () => {
        if (isLoading) {
            return <div>Loading...</div>
        }
        if (!formFields?.sections?.length) {
            return <div>No Form Available</div>
        }

        if (isSuccess && formFields.sections.length > 0) {
            return (
                <>
                    {formFields.sections[0].fields.map((field) => {
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
                </>
            )
        }
    }

    return <form onSubmit={handleSubmit(onSubmit)}>{renderForm()}</form>
}
