// App.jsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './Pages/HomePage/HomePage'
import LogIn from './Pages/LogIn/LogIn'
import SignUp from './Pages/SignUp/SignUp'
import Dashboard from './Pages/Dashboard/Dashboard'
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
