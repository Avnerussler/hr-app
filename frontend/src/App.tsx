import './App.css'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './components/Home/Home'
import DialogRefProvider from './providers/DialogRefProvider'

function App() {
    return (
        <DialogRefProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    {/* <Route path="/form/:formId" element={<RecruitForm />} /> */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        </DialogRefProvider>
    )
}

export default App
