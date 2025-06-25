export interface Employee {
  id: number
  firstName: string
  lastName: string
  role: string
  project: string
  manager: string
  type: 'Reserve' | 'Consultant'
  status: 'Active' | 'Inactive'
  lastActiveTime: string
  nextActiveTime: string
  avatar?: string
  // Additional details for drawer
  email?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  hireDate?: string
  department?: string
  teamLead?: string
  workLocation?: string
  contractType?: string
  performance?: string
  skills?: string[]
  certifications?: string[]
  daysHistory?: { date: string; timeIn: string; timeOut: string }[]
  assessments?: { date: string; score: number; feedback: string; assessor: string }[]
  // New General tab fields
  employeeId?: string
  classificationRank?: '1' | '2' | '3' | 'none'
  classificationType?: 'military' | 'civil' | 'none' | 'both'
  classificationStatus?: 'active' | 'inactive' | 'potential' | 'civil'
  toBeContactedAt?: string
  // New Professional tab fields
  category?: 'consultant' | 'team lead' | 'expert' | 'other'
  domain?: 'Algo' | 'FE' | 'BE' | 'RF'
  technology?: 'React' | 'LLM' | 'NLP'
  yearsOfExpertise?: 'up to 5' | '5-10' | '10-15' | 'over 15'
  currentCompany?: string
  currentRole?: string
  previousCompany?: string
  previousRole?: string
}

export const employeesData: Employee[] = [
  {
    id: 1,
    firstName: 'Sarah',
    lastName: 'Chen',
    role: 'Senior Frontend Developer',
    project: 'Digital Banking Platform',
    manager: 'Michael Johnson',
    type: 'Consultant',
    status: 'Active',
    lastActiveTime: '2025-06-24T09:00:00',
    nextActiveTime: '2025-06-25T09:00:00',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b65d4e90?w=150',
    email: 'sarah.chen@company.com',
    phone: '+1-555-0123',
    address: '123 Tech Street, San Francisco, CA 94105',
    dateOfBirth: '1990-03-15',
    hireDate: '2023-01-15',
    department: 'Engineering',
    teamLead: 'Alex Rodriguez',
    workLocation: 'San Francisco Office',
    contractType: 'Full-time',
    performance: 'Excellent',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    certifications: ['AWS Certified Developer', 'React Professional'],
    employeeId: 'EMP001',
    classificationRank: '2',
    classificationType: 'civil',
    classificationStatus: 'active',
    toBeContactedAt: 'sarah.chen@personal.com',
    category: 'expert',
    domain: 'FE',
    technology: 'React',
    yearsOfExpertise: '5-10',
    currentCompany: 'TechCorp Inc',
    currentRole: 'Senior Frontend Developer',
    previousCompany: 'StartupXYZ',
    previousRole: 'Frontend Developer',
    daysHistory: [
      { date: '2025-06-24', timeIn: '09:00', timeOut: '17:30' },
      { date: '2025-06-23', timeIn: '08:45', timeOut: '17:15' },
      { date: '2025-06-22', timeIn: '09:15', timeOut: '18:00' }
    ],
    assessments: [
      { date: '2025-03-15', score: 4.5, feedback: 'Excellent technical skills and leadership', assessor: 'Michael Johnson' },
      { date: '2024-09-15', score: 4.2, feedback: 'Strong performance in React development', assessor: 'Alex Rodriguez' }
    ]
  },
  {
    id: 2,
    firstName: 'David',
    lastName: 'Kim',
    role: 'Backend Engineer',
    project: 'API Gateway System',
    manager: 'Lisa Wang',
    type: 'Reserve',
    status: 'Active',
    lastActiveTime: '2025-06-24T08:30:00',
    nextActiveTime: '2025-06-25T08:30:00',
    email: 'david.kim@company.com',
    phone: '+1-555-0124',
    address: '456 Developer Ave, Austin, TX 78701',
    dateOfBirth: '1988-07-22',
    hireDate: '2022-08-01',
    department: 'Engineering',
    teamLead: 'Carlos Martinez',
    workLocation: 'Austin Office',
    contractType: 'Part-time',
    performance: 'Good',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    certifications: ['AWS Solutions Architect', 'Python Professional'],
    employeeId: 'EMP002',
    classificationRank: '1',
    classificationType: 'military',
    classificationStatus: 'active',
    toBeContactedAt: 'david.kim.personal@gmail.com',
    category: 'consultant',
    domain: 'BE',
    technology: 'LLM',
    yearsOfExpertise: '10-15',
    currentCompany: 'TechCorp Inc',
    currentRole: 'Backend Engineer',
    previousCompany: 'DataFlow Systems',
    previousRole: 'Python Developer',
    daysHistory: [
      { date: '2025-06-24', timeIn: '08:30', timeOut: '16:30' },
      { date: '2025-06-23', timeIn: '08:45', timeOut: '16:45' }
    ],
    assessments: [
      { date: '2025-02-28', score: 4.0, feedback: 'Solid backend development skills', assessor: 'Lisa Wang' }
    ]
  },
  {
    id: 3,
    firstName: 'Maria',
    lastName: 'Rodriguez',
    role: 'Algorithm Specialist',
    project: 'ML Research Platform',
    manager: 'Dr. Robert Singh',
    type: 'Consultant',
    status: 'Active',
    lastActiveTime: '2025-06-24T10:00:00',
    nextActiveTime: '2025-06-25T10:00:00',
    email: 'maria.rodriguez@company.com',
    phone: '+1-555-0125',
    address: '789 Research Blvd, Boston, MA 02101',
    dateOfBirth: '1985-11-08',
    hireDate: '2021-03-10',
    department: 'Research & Development',
    teamLead: 'Dr. Robert Singh',
    workLocation: 'Boston Lab',
    contractType: 'Full-time',
    performance: 'Outstanding',
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'Mathematics'],
    certifications: ['Deep Learning Specialization', 'ML Engineering'],
    employeeId: 'EMP003',
    classificationRank: '3',
    classificationType: 'both',
    classificationStatus: 'active',
    toBeContactedAt: 'maria.r.personal@outlook.com',
    category: 'team lead',
    domain: 'Algo',
    technology: 'NLP',
    yearsOfExpertise: 'over 15',
    currentCompany: 'TechCorp Inc',
    currentRole: 'Algorithm Specialist',
    previousCompany: 'AI Research Institute',
    previousRole: 'Research Scientist',
    daysHistory: [
      { date: '2025-06-24', timeIn: '10:00', timeOut: '18:30' },
      { date: '2025-06-23', timeIn: '09:30', timeOut: '18:00' },
      { date: '2025-06-22', timeIn: '10:15', timeOut: '19:00' }
    ],
    assessments: [
      { date: '2025-04-01', score: 4.8, feedback: 'Exceptional research contributions and team leadership', assessor: 'Dr. Robert Singh' },
      { date: '2024-10-01', score: 4.6, feedback: 'Outstanding algorithm development', assessor: 'Dr. Robert Singh' }
    ]
  },
  {
    id: 4,
    firstName: 'Ahmed',
    lastName: 'Hassan',
    role: 'RF Engineer',
    project: 'Wireless Communication System',
    manager: 'Jennifer Liu',
    type: 'Reserve',
    status: 'Inactive',
    lastActiveTime: '2025-06-20T09:00:00',
    nextActiveTime: '2025-06-26T09:00:00',
    email: 'ahmed.hassan@company.com',
    phone: '+1-555-0126',
    address: '321 Signal Way, Seattle, WA 98101',
    dateOfBirth: '1992-01-30',
    hireDate: '2023-06-15',
    department: 'Hardware Engineering',
    teamLead: 'Steve Thompson',
    workLocation: 'Seattle Lab',
    contractType: 'Contract',
    performance: 'Good',
    skills: ['RF Design', 'MATLAB', 'Antenna Design', 'Signal Processing'],
    certifications: ['RF Engineering Certification', 'Wireless Communications'],
    employeeId: 'EMP004',
    classificationRank: '2',
    classificationType: 'military',
    classificationStatus: 'potential',
    toBeContactedAt: 'ahmed.hassan.mil@secure.gov',
    category: 'consultant',
    domain: 'RF',
    technology: 'React', // This might seem odd but keeping as per interface
    yearsOfExpertise: 'up to 5',
    currentCompany: 'TechCorp Inc',
    currentRole: 'RF Engineer',
    previousCompany: 'Defense Systems Ltd',
    previousRole: 'Junior RF Engineer',
    daysHistory: [
      { date: '2025-06-20', timeIn: '09:00', timeOut: '17:00' },
      { date: '2025-06-19', timeIn: '08:45', timeOut: '16:45' }
    ],
    assessments: [
      { date: '2025-01-15', score: 3.8, feedback: 'Good technical skills, room for leadership growth', assessor: 'Jennifer Liu' }
    ]
  },
  {
    id: 5,
    firstName: 'Emma',
    lastName: 'Wilson',
    role: 'Full Stack Developer',
    project: 'E-commerce Platform',
    manager: 'Tom Bradley',
    type: 'Consultant',
    status: 'Active',
    lastActiveTime: '2025-06-24T09:15:00',
    nextActiveTime: '2025-06-25T09:15:00',
    email: 'emma.wilson@company.com',
    phone: '+1-555-0127',
    address: '654 Code Street, Denver, CO 80202',
    dateOfBirth: '1993-09-12',
    hireDate: '2022-11-01',
    department: 'Engineering',
    teamLead: 'Rachel Green',
    workLocation: 'Denver Office',
    contractType: 'Full-time',
    performance: 'Very Good',
    skills: ['React', 'Node.js', 'MongoDB', 'AWS'],
    certifications: ['Full Stack Developer', 'AWS Cloud Practitioner'],
    employeeId: 'EMP005',
    classificationRank: 'none',
    classificationType: 'civil',
    classificationStatus: 'civil',
    toBeContactedAt: 'emma.wilson.dev@gmail.com',
    category: 'other',
    domain: 'FE',
    technology: 'React',
    yearsOfExpertise: '5-10',
    currentCompany: 'TechCorp Inc',
    currentRole: 'Full Stack Developer',
    previousCompany: 'WebDev Solutions',
    previousRole: 'Frontend Developer',
    daysHistory: [
      { date: '2025-06-24', timeIn: '09:15', timeOut: '17:45' },
      { date: '2025-06-23', timeIn: '09:00', timeOut: '17:30' },
      { date: '2025-06-22', timeIn: '09:30', timeOut: '18:00' }
    ],
    assessments: [
      { date: '2025-05-01', score: 4.1, feedback: 'Strong full-stack capabilities, good team player', assessor: 'Tom Bradley' }
    ]
  }
]