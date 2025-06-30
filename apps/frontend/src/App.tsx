import './App.css'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Pages/Dashboard'
import PersonnelPage from './components/Pages/Personnel'
import { Projects } from './components/Pages/Projects'
import { TodaysOverview } from './components/Pages/TodaysOverview'
import DialogRefProvider from './providers/DialogRefProvider'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const useRouter = () => {
    return createBrowserRouter([
        {
            path: '/',
            element: <Layout />,
            children: [
                { index: true, element: <TodaysOverview /> },
                { path: 'dashboard', element: <Dashboard /> },
                { path: 'personnel', element: <PersonnelPage /> },
                { path: 'personnel/:employeeId', element: <PersonnelPage /> },
                { path: 'personnel/new', element: <PersonnelPage /> },
                { path: 'projects', element: <Projects /> },
                //     { path: 'settings', element: <Settings /> },
            ],
        },
    ])
}
function App() {
    return (
        <DialogRefProvider>
            <RouterProvider router={useRouter()} />
        </DialogRefProvider>
    )
}

export default App
