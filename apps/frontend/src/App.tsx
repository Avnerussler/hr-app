import './App.css'
import { Layout } from './components/Layout'
import { DynamicFormPage } from './components/Pages/DynamicFormPage'
import DialogRefProvider from './providers/DialogRefProvider'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useFormsQuery } from './hooks/queries/useFormQueries'
import { Box, Spinner, Center } from '@chakra-ui/react'
import { TodaysOverview } from './components/Pages/TodaysOverview'
import { Dashboard } from './components/Pages/Dashboard'
import WorkHours from './components/Pages/WorkHours'

const LoadingSpinner = () => (
    <Center h="100vh">
        <Box textAlign="center">
            <Spinner size="xl" />
            <Box mt={4}>Loading application...</Box>
        </Box>
    </Center>
)

// Static routes
const staticRoutes = [
    { path: 'overview', element: <TodaysOverview /> },
    { path: 'dashboard', element: <Dashboard /> },
    { path: 'work-hours', element: <WorkHours /> },
]
const createDynamicRouter = (formsData: any) => {
    const dynamicRoutes = formsData?.forms
        ? formsData.forms.flatMap((form: any) => [
              {
                  path: `${form.formName}/${form._id}`,
                  element: (
                      <DynamicFormPage
                          formId={form._id}
                          formName={form.formName}
                      />
                  ),
              },
              {
                  path: `${form.formName}/${form._id}/edit/:itemId`,
                  element: (
                      <DynamicFormPage
                          formId={form._id}
                          formName={form.formName}
                      />
                  ),
              },
              {
                  path: `${form.formName}/${form._id}/new`,
                  element: (
                      <DynamicFormPage
                          formId={form._id}
                          formName={form.formName}
                      />
                  ),
              },
          ])
        : []

    return createBrowserRouter([
        {
            path: '/',
            element: <Layout />,
            children: [
                {
                    index: true,
                    element: <Navigate to="/overview" replace />,
                },
                ...staticRoutes,
                ...dynamicRoutes,
                {
                    path: '*',
                    element: <Navigate to="/overview" replace />,
                },
            ],
        },
    ])
}
function App() {
    const { data: formsData, isSuccess, isLoading } = useFormsQuery()

    // Show loading state while fetching forms
    if (isLoading) {
        return (
            <DialogRefProvider>
                <LoadingSpinner />
            </DialogRefProvider>
        )
    }

    // Show error state if query failed
    if (!isSuccess) {
        return (
            <DialogRefProvider>
                <Center h="100vh">
                    <Box textAlign="center">
                        <Box>Failed to load application</Box>
                    </Box>
                </Center>
            </DialogRefProvider>
        )
    }

    return (
        <DialogRefProvider>
            <RouterProvider router={createDynamicRouter(formsData)} />
        </DialogRefProvider>
    )
}

export default App
