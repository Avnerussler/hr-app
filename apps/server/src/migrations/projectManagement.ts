import { FormFields } from '../models'
import logger from '../config/logger'

const CURRENT_VERSION = '1.2.4'

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
                            name: 'projectName',
                            type: 'text',
                            label: 'שם הפרויקט',
                            placeholder: 'שם הפרויקט',
                            required: true,
                            defaultValue: '',
                        },
                        {
                            name: 'projectManager',
                            type: 'enhancedSelect',
                            label: 'מנהל פרויקט',
                            placeholder: 'הזן את שם מנהל הפרויקט',
                            required: false,
                            defaultValue: '',
                            foreignFormName: 'Personnel',
                            foreignFields: [
                                'firstName',
                                'lastName',
                                'personalNumber',
                                'isActive',
                            ],
                        },
                        {
                            name: 'projectPersonnel',
                            type: 'enhancedMultipleSelect',
                            label: 'אנשי צוות בפרויקט',
                            placeholder: 'הזן את אנשי הצוות',
                            required: false,
                            defaultValue: '',
                            foreignFormName: 'Personnel',
                            foreignFields: [
                                'firstName',
                                'lastName',
                                'personalNumber',
                                'isActive',
                            ],
                        },

                        {
                            name: 'projectStatus',
                            type: 'select',
                            label: 'סטטוס הפרוייקט',
                            placeholder: 'בחר סטטוס',
                            required: false,
                            defaultValue: 'active',
                            options: [
                                {
                                    value: 'active',
                                    label: 'פעיל',
                                    name: 'active',
                                },
                                {
                                    value: 'inactive',
                                    label: 'לא פעיל',
                                    name: 'inactive',
                                },
                                {
                                    value: 'pending',
                                    label: 'מושהה',
                                    name: 'pending',
                                },
                            ],
                        },
                    ],
                },
            ],
            overviewFields: [
                'projectName',
                'projectManager',
                'projectPersonnel',
                'projectStatus',
            ],
        }

        if (existingForm) {
            const existingVersion = existingForm.version || '1.0.0'
            if (existingVersion === CURRENT_VERSION) {
                logger.info(
                    `${formName} form is up to date (v${CURRENT_VERSION})`
                )
                return
            }
            logger.info(
                `Updating ${formName} form from v${existingVersion} to v${CURRENT_VERSION}`
            )
            await FormFields.updateOne({ formName }, formData)
        } else {
            logger.info(`Creating new ${formName} form (v${CURRENT_VERSION})`)
            const formDocument = new FormFields({
                formName,
                ...formData,
            })
            await formDocument.save()
        }
    } catch (error) {
        logger.error('Project Management form migration error:', error)
    }
}
