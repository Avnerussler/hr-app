import './App.css'
import { Layout } from './components/Layout'
import DialogRefProvider from './providers/DialogRefProvider'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Dashboard } from './components/Pages/Dashboard'
import QuotaManagement from './components/Pages/QuotaManagement'
import ErrorElement from './components/common/ErrorElement'
import { ProjectListPage } from './components/Pages/ProjectListPage'
import { PersonnelListPage } from './components/Pages/PersonnelListPage'
import { ReserveDayListPage } from './components/Pages/ReserveDayListPage'

// formName segment is kept literal for e2e URL parity; formId segment is a stable
// placeholder (no longer a real "form definition" id).
const entityRoutes = [
    {
        path: 'project_management/default',
        element: <ProjectListPage />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'project_management/default/new',
        element: <ProjectListPage />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'project_management/default/edit/:itemId',
        element: <ProjectListPage />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'personnel/default',
        element: <PersonnelListPage />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'personnel/default/new',
        element: <PersonnelListPage />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'personnel/default/edit/:itemId',
        element: <PersonnelListPage />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'reserve_days_management/default',
        element: <ReserveDayListPage />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'reserve_days_management/default/new',
        element: <ReserveDayListPage />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'reserve_days_management/default/edit/:itemId',
        element: <ReserveDayListPage />,
        errorElement: <ErrorElement />,
    },
]

const staticRoutes = [
    {
        path: 'quota-management',
        element: <QuotaManagement />,
        errorElement: <ErrorElement />,
    },
    {
        path: 'dashboard',
        element: <Dashboard />,
        errorElement: <ErrorElement />,
    },
]

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        errorElement: <ErrorElement />,
        children: [
            {
                index: true,
                element: <Navigate to="/quota-management" replace />,
            },
            ...staticRoutes,
            ...entityRoutes,
            {
                path: '*',
                element: <Navigate to="/quota-management" replace />,
            },
        ],
    },
])

function App() {
    return (
        <DialogRefProvider>
            <RouterProvider router={router} />
        </DialogRefProvider>
    )
}

export default App
