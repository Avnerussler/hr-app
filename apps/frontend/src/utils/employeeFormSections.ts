import { Section } from '@/components/common/DetailsDrawer'
import { FormFields } from '@/types/fieldsType'

// Create comprehensive form sections based on Employee interface
export const createEmployeeFormSections = (): Section[] => {
  return [
    {
      id: 'general',
      name: 'General',
      fields: [
        {
          _id: 'employeeId',
          name: 'employeeId',
          type: 'text',
          label: 'Employee ID',
          placeholder: 'Enter employee ID',
          required: false,
        },
        {
          _id: 'firstName',
          name: 'firstName',
          type: 'text',
          label: 'First Name',
          placeholder: 'Enter first name',
          required: true,
        },
        {
          _id: 'lastName',
          name: 'lastName',
          type: 'text',
          label: 'Last Name',
          placeholder: 'Enter last name',
          required: true,
        },
        {
          _id: 'email',
          name: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter email address',
          required: false,
        },
        {
          _id: 'phone',
          name: 'phone',
          type: 'tel',
          label: 'Phone',
          placeholder: 'Enter phone number',
          required: false,
        },
        {
          _id: 'address',
          name: 'address',
          type: 'textarea',
          label: 'Address',
          placeholder: 'Enter full address',
          required: false,
        },
        {
          _id: 'dateOfBirth',
          name: 'dateOfBirth',
          type: 'date',
          label: 'Date of Birth',
          placeholder: 'Select date of birth',
          required: false,
        },
        {
          _id: 'toBeContactedAt',
          name: 'toBeContactedAt',
          type: 'email',
          label: 'Personal Contact',
          placeholder: 'Personal email for contact',
          required: false,
        },
      ] as FormFields[]
    },
    {
      id: 'employment',
      name: 'Employment',
      fields: [
        {
          _id: 'role',
          name: 'role',
          type: 'text',
          label: 'Role',
          placeholder: 'Enter job role',
          required: true,
        },
        {
          _id: 'department',
          name: 'department',
          type: 'text',
          label: 'Department',
          placeholder: 'Enter department',
          required: false,
        },
        {
          _id: 'hireDate',
          name: 'hireDate',
          type: 'date',
          label: 'Hire Date',
          placeholder: 'Select hire date',
          required: false,
        },
        {
          _id: 'type',
          name: 'type',
          type: 'select',
          label: 'Employee Type',
          placeholder: 'Select employee type',
          required: true,
          options: [
            { label: 'Reserve', name: 'reserve', value: 'Reserve' },
            { label: 'Consultant', name: 'consultant', value: 'Consultant' }
          ]
        },
        {
          _id: 'status',
          name: 'status',
          type: 'select',
          label: 'Status',
          placeholder: 'Select status',
          required: true,
          options: [
            { label: 'Active', name: 'active', value: 'Active' },
            { label: 'Inactive', name: 'inactive', value: 'Inactive' }
          ]
        },
        {
          _id: 'contractType',
          name: 'contractType',
          type: 'select',
          label: 'Contract Type',
          placeholder: 'Select contract type',
          required: false,
          options: [
            { label: 'Full-time', name: 'fulltime', value: 'Full-time' },
            { label: 'Part-time', name: 'parttime', value: 'Part-time' },
            { label: 'Contract', name: 'contract', value: 'Contract' },
            { label: 'Temporary', name: 'temporary', value: 'Temporary' }
          ]
        },
        {
          _id: 'workLocation',
          name: 'workLocation',
          type: 'text',
          label: 'Work Location',
          placeholder: 'Enter work location',
          required: false,
        },
        {
          _id: 'performance',
          name: 'performance',
          type: 'select',
          label: 'Performance Rating',
          placeholder: 'Select performance rating',
          required: false,
          options: [
            { label: 'Outstanding', name: 'outstanding', value: 'Outstanding' },
            { label: 'Excellent', name: 'excellent', value: 'Excellent' },
            { label: 'Very Good', name: 'verygood', value: 'Very Good' },
            { label: 'Good', name: 'good', value: 'Good' },
            { label: 'Needs Improvement', name: 'needsimprovement', value: 'Needs Improvement' }
          ]
        },
      ] as FormFields[]
    },
    {
      id: 'professional',
      name: 'Professional',
      fields: [
        {
          _id: 'category',
          name: 'category',
          type: 'select',
          label: 'Category',
          placeholder: 'Select category',
          required: false,
          options: [
            { label: 'Consultant', name: 'consultant', value: 'consultant' },
            { label: 'Team Lead', name: 'teamlead', value: 'team lead' },
            { label: 'Expert', name: 'expert', value: 'expert' },
            { label: 'Other', name: 'other', value: 'other' }
          ]
        },
        {
          _id: 'domain',
          name: 'domain',
          type: 'select',
          label: 'Domain',
          placeholder: 'Select domain',
          required: false,
          options: [
            { label: 'Algorithm', name: 'algo', value: 'Algo' },
            { label: 'Frontend', name: 'frontend', value: 'FE' },
            { label: 'Backend', name: 'backend', value: 'BE' },
            { label: 'RF Engineering', name: 'rf', value: 'RF' }
          ]
        },
        {
          _id: 'technology',
          name: 'technology',
          type: 'select',
          label: 'Primary Technology',
          placeholder: 'Select primary technology',
          required: false,
          options: [
            { label: 'React', name: 'react', value: 'React' },
            { label: 'Large Language Models', name: 'llm', value: 'LLM' },
            { label: 'Natural Language Processing', name: 'nlp', value: 'NLP' }
          ]
        },
        {
          _id: 'yearsOfExpertise',
          name: 'yearsOfExpertise',
          type: 'select',
          label: 'Years of Expertise',
          placeholder: 'Select years of expertise',
          required: false,
          options: [
            { label: 'Up to 5 years', name: 'upto5', value: 'up to 5' },
            { label: '5-10 years', name: '5to10', value: '5-10' },
            { label: '10-15 years', name: '10to15', value: '10-15' },
            { label: 'Over 15 years', name: 'over15', value: 'over 15' }
          ]
        },
        {
          _id: 'currentCompany',
          name: 'currentCompany',
          type: 'text',
          label: 'Current Company',
          placeholder: 'Enter current company',
          required: false,
        },
        {
          _id: 'currentRole',
          name: 'currentRole',
          type: 'text',
          label: 'Current Role',
          placeholder: 'Enter current role',
          required: false,
        },
        {
          _id: 'previousCompany',
          name: 'previousCompany',
          type: 'text',
          label: 'Previous Company',
          placeholder: 'Enter previous company',
          required: false,
        },
        {
          _id: 'previousRole',
          name: 'previousRole',
          type: 'text',
          label: 'Previous Role',
          placeholder: 'Enter previous role',
          required: false,
        },
      ] as FormFields[]
    },
    {
      id: 'project',
      name: 'Project & Team',
      fields: [
        {
          _id: 'project',
          name: 'project',
          type: 'text',
          label: 'Current Project',
          placeholder: 'Enter current project',
          required: false,
        },
        {
          _id: 'manager',
          name: 'manager',
          type: 'text',
          label: 'Manager',
          placeholder: 'Enter manager name',
          required: false,
        },
        {
          _id: 'teamLead',
          name: 'teamLead',
          type: 'text',
          label: 'Team Lead',
          placeholder: 'Enter team lead name',
          required: false,
        },
        {
          _id: 'lastActiveTime',
          name: 'lastActiveTime',
          type: 'datetime',
          label: 'Last Active Time',
          placeholder: 'Select last active time',
          required: false,
        },
        {
          _id: 'nextActiveTime',
          name: 'nextActiveTime',
          type: 'datetime',
          label: 'Next Active Time',
          placeholder: 'Select next active time',
          required: false,
        },
      ] as FormFields[]
    },
    {
      id: 'classification',
      name: 'Classification',
      fields: [
        {
          _id: 'classificationRank',
          name: 'classificationRank',
          type: 'select',
          label: 'Classification Rank',
          placeholder: 'Select classification rank',
          required: false,
          options: [
            { label: 'Rank 1', name: 'rank1', value: '1' },
            { label: 'Rank 2', name: 'rank2', value: '2' },
            { label: 'Rank 3', name: 'rank3', value: '3' },
            { label: 'None', name: 'none', value: 'none' }
          ]
        },
        {
          _id: 'classificationType',
          name: 'classificationType',
          type: 'select',
          label: 'Classification Type',
          placeholder: 'Select classification type',
          required: false,
          options: [
            { label: 'Military', name: 'military', value: 'military' },
            { label: 'Civil', name: 'civil', value: 'civil' },
            { label: 'Both', name: 'both', value: 'both' },
            { label: 'None', name: 'none', value: 'none' }
          ]
        },
        {
          _id: 'classificationStatus',
          name: 'classificationStatus',
          type: 'select',
          label: 'Classification Status',
          placeholder: 'Select classification status',
          required: false,
          options: [
            { label: 'Active', name: 'active', value: 'active' },
            { label: 'Inactive', name: 'inactive', value: 'inactive' },
            { label: 'Potential', name: 'potential', value: 'potential' },
            { label: 'Civil', name: 'civil', value: 'civil' }
          ]
        },
      ] as FormFields[]
    },
    {
      id: 'skills',
      name: 'Skills & Development',
      fields: [
        {
          _id: 'skills',
          name: 'skills',
          type: 'textarea',
          label: 'Skills',
          placeholder: 'Enter skills (comma-separated)',
          required: false,
        },
        {
          _id: 'certifications',
          name: 'certifications',
          type: 'textarea',
          label: 'Certifications',
          placeholder: 'Enter certifications (comma-separated)',
          required: false,
        },
      ] as FormFields[]
    }
  ]
}