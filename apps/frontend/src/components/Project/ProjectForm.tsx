import { Control, FieldValues } from 'react-hook-form'
import { VStack } from '@chakra-ui/react'
import { ControlledInputField } from '@/components/ControlledFields/ControlledInputField'
import { ControlledSelectField } from '@/components/ControlledFields/ControlledSelectField'
import { ProjectManagerSelect } from './ProjectManagerSelect'
import { ProjectPersonnelMultiSelect } from './ProjectPersonnelMultiSelect'
import { ProjectFormValues } from './projectSchema'

interface ProjectFormProps {
    control: Control<ProjectFormValues>
    projectStatusOptions: { value: string; label: string }[]
}

export function ProjectForm({ control: typedControl, projectStatusOptions }: ProjectFormProps) {
    // ControlledFields primitives take an untyped RHF `Control` (they're reused across
    // entities with different form shapes) — cast once at this boundary.
    const control = typedControl as unknown as Control<FieldValues>

    return (
        <VStack gap={4} align="stretch" p={6} pb={4}>
            <ControlledInputField
                control={control}
                name="projectName"
                id="projectName"
                type="text"
                label="שם הפרויקט"
                placeholder="שם הפרויקט"
                required
            />
            <ProjectManagerSelect
                control={control}
                name="projectManager"
                label="מנהל פרויקט"
                placeholder="הזן את שם מנהל הפרויקט"
            />
            <ProjectPersonnelMultiSelect
                control={control}
                name="projectPersonnel"
                label="אנשי צוות בפרויקט"
                placeholder="הזן את אנשי הצוות"
            />
            <ControlledSelectField
                control={control}
                name="projectStatus"
                label="סטטוס הפרוייקט"
                placeholder="בחר סטטוס"
                options={projectStatusOptions}
            />
        </VStack>
    )
}
