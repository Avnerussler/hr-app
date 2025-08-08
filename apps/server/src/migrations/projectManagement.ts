import { FormFields } from '../models'
import { checkIfFormExist } from './utils'
import logger from '../config/logger'

export const createStudioForm = async () => {
    try {
        const formName = 'Project Management'
        const isFormExist = await checkIfFormExist(formName)
        if (isFormExist) {
            logger.info(`${formName} exist! passing on migration`)
            return
        }

        const formDocument = new FormFields({
            formName,
            description: 'Project Tracking',
            icon: 'FiFolder',
            sections: [
                {
                    id: 'projectManagement',
                    name: 'Project Management',
                    fields: [
                        {
                            name: 'project name',
                            type: 'text',
                            label: 'שם הפרויקט',
                            placeholder: 'שם הפרויקט',
                            required: true,
                            defaultValue: '',
                        },
                        {
                            name: 'project manager',
                            type: 'select',
                            label: 'מנהל פרויקט',
                            placeholder: 'הזן את שם מנהל הפרויקט',
                            required: false,
                            defaultValue: '',
                            foreignFormName: 'Personal',
                            foreignField: 'firstName',
                        },
                        {
                            name: 'project personal',
                            type: 'multipleSelect',
                            label: 'אנשי צוות בפרויקט',
                            placeholder: 'הזן את אנשי הצוות',
                            required: false,
                            defaultValue: '',
                            foreignFormName: 'Personal',
                            foreignField: 'firstName',
                        },

                        {
                            name: 'role',
                            type: 'text',
                            label: 'Role',
                            placeholder: 'Enter role',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'project',
                            type: 'text',
                            label: 'Project',
                            placeholder: 'Enter project',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'manager',
                            type: 'text',
                            label: 'Manager',
                            placeholder: 'Enter manager name',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'type',
                            type: 'select',
                            label: 'Type',
                            placeholder: 'Select type',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: 'full',
                                    label: 'Full-time',
                                    name: 'full',
                                },
                                {
                                    value: 'part',
                                    label: 'Part-time',
                                    name: 'part',
                                },
                                {
                                    value: 'contract',
                                    label: 'Contractor',
                                    name: 'contract',
                                },
                            ],
                        },
                        {
                            name: 'status',
                            type: 'select',
                            label: 'Status',
                            placeholder: 'Select status',
                            required: false,
                            defaultValue: '',
                            options: [
                                {
                                    value: 'active',
                                    label: 'Active',
                                    name: 'active',
                                },
                                {
                                    value: 'inactive',
                                    label: 'Inactive',
                                    name: 'inactive',
                                },
                                {
                                    value: 'pending',
                                    label: 'Pending',
                                    name: 'pending',
                                },
                            ],
                        },
                        {
                            name: 'lastActive',
                            type: 'date',
                            label: 'Last Active',
                            placeholder: 'Select last active date',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            name: 'nextActive',
                            type: 'date',
                            label: 'Next Active',
                            placeholder: 'Select next active date',
                            required: false,
                            defaultValue: '',
                        },
                    ],
                },
            ],
            overviewFields: [
                'project name',
                'project manager',
                'project personal',
            ],
        })

        await formDocument.save()
    } catch (error) {
        logger.error(' error:', error)
    }
}
