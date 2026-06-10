import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import SuccessPage from './pages/SuccessPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin and Success pages have no shared Header */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/success" element={<SuccessPage />} />

        {/* Main layout with header */}
        <Route path="/*" element={
          <>
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}
