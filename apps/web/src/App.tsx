// App.jsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './Pages/HomePage/HomePage'
import LogIn from './Pages/LogIn/LogIn'
import SignUp from './Pages/SignUp/SignUp'
import Dashboard from './Pages/Dashboard/DashboardHome'
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary'
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Nested dashboard route for protected content like /dashboard/balance */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </div>
    </AuthProvider>
  )
}

export default App
