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
                            _id: 'name',
                            name: 'name',
                            type: 'text',
                            label: 'Name',
                            placeholder: 'Enter first name',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'lastName',
                            name: 'lastName',
                            type: 'text',
                            label: 'Last Name',
                            placeholder: 'Enter last name',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'role',
                            name: 'role',
                            type: 'text',
                            label: 'Role',
                            placeholder: 'Enter role',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'project',
                            name: 'project',
                            type: 'text',
                            label: 'Project',
                            placeholder: 'Enter project',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'manager',
                            name: 'manager',
                            type: 'text',
                            label: 'Manager',
                            placeholder: 'Enter manager name',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'type',
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
                            _id: 'status',
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
                            _id: 'lastActive',
                            name: 'lastActive',
                            type: 'date',
                            label: 'Last Active',
                            placeholder: 'Select last active date',
                            required: false,
                            defaultValue: '',
                        },
                        {
                            _id: 'nextActive',
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
        })

        await formDocument.save()
    } catch (error) {
        logger.error(' error:', error)
    }
}
