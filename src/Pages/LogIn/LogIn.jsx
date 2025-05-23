import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NavBar from '../../Components/NavBar/NavBar'
import './LogIn.css'

function LogIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setError('')
    login() // authenticate user via context
    navigate('/dashboard') // redirect to protected route
  }

  return (
    <>
      <NavBar />
      <div className="login-page">
        <div className="login-container">
          <form onSubmit={handleSubmit} className="login-form">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Login to your FinBuddy account</p>

            {error && <div className="error-message">{error}</div>}

            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
              required
            />

            <button type="submit" className="login-btn">
              Log In
            </button>
            <p className="login-footer">
              Don’t have an account? <Link to="/signup">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  )
}

export default LogIn
