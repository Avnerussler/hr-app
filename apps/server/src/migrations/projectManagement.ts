import { FormFields } from '../models'
import logger from '../config/logger'

const CURRENT_VERSION = '1.1.0'

export const createStudioForm = async () => {
    try {
        const formName = 'Project Management'
        const existingForm = await FormFields.findOne({ formName })
        
        const formData = {
            version: CURRENT_VERSION,
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
        }

        if (existingForm) {
            const existingVersion = existingForm.version || '1.0.0'
            if (existingVersion === CURRENT_VERSION) {
                logger.info(`${formName} form is up to date (v${CURRENT_VERSION})`)
                return
            }
            logger.info(`Updating ${formName} form from v${existingVersion} to v${CURRENT_VERSION}`)
            await FormFields.updateOne({ formName }, formData)
        } else {
            logger.info(`Creating new ${formName} form (v${CURRENT_VERSION})`)
            const formDocument = new FormFields({
                formName,
                ...formData
            })
            await formDocument.save()
        }
    } catch (error) {
        logger.error('Project Management form migration error:', error)
    }
}
