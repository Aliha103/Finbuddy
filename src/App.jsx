// App.jsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './Pages/HomePage/HomePage'
import LogIn from './Pages/LogIn/LogIn'
import SignUp from './Pages/SignUp/SignUp'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </div>
  )
}

export default App
