import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NavBar from '../../Components/NavBar/NavBar'
import './SignUp.css'

function SignUp() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')

  const { login } = useAuth() // we call login to simulate "authenticated" state
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.includes('@')) errs.email = 'Valid email required'
    if (form.password.length < 6)
      errs.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      if (form.email === 'test@fail.com') {
        setGeneralError('Email already exists. Please try logging in.')
      } else {
        login() // mark user as authenticated
        navigate('/dashboard') // redirect to dashboard
      }
    }
  }

  return (
    <>
      <NavBar />
      <div className="signup-container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>Create Your Account</h2>

          {generalError && (
            <div className="error-message">
              <span className="close-btn" onClick={() => setGeneralError('')}>
                ×
              </span>
              <p>
                <strong>{generalError}</strong>
              </p>
              <p>
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          )}

          <div className="signup-main-container">
            <div className="signup-box">
              <label>
                Full Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && <span className="error">{errors.name}</span>}
              </label>
            </div>

            <div className="signup-box">
              <label>
                Email Address
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </label>
            </div>

            <div className="signup-box">
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && (
                  <span className="error">{errors.password}</span>
                )}
              </label>
            </div>

            <div className="signup-box">
              <label>
                Confirm Password
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && (
                  <span className="error">{errors.confirmPassword}</span>
                )}
              </label>
            </div>
          </div>

          <button type="submit" className="signup-btn">
            Sign Up
          </button>

          <p className="signin-link">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </form>
      </div>
    </>
  )
}

export default SignUp
