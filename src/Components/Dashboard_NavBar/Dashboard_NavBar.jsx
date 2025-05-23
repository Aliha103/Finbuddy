import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  FaBars,
  FaTimes,
  FaHome,
  FaUserCircle,
  FaSignOutAlt,
  FaBell,
  FaCog,
  FaChartPie,
} from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo/finbuddy_logo.png'
import './Dashboard_NavBar.css'

function DashboardNavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [visible, setVisible] = useState(true)

  const prevScrollPos = useRef(window.scrollY)
  const menuRef = useRef()
  const profileRef = useRef()
  const navigate = useNavigate()

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const toggleProfile = () => setProfileOpen((prev) => !prev)

  const handleLogout = useCallback(() => {
    // Replace with secure auth logic
    navigate('/login', { replace: true })
  }, [navigate])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-hide navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setVisible(prevScrollPos.current > current || current < 10)
      prevScrollPos.current = current
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`dashboard-navbar ${visible ? 'visible' : 'hidden'}`}>
      <div className="navbar-left">
        <Link to="/dashboard" aria-label="Dashboard">
          <img src={logo} alt="FinBuddy Logo" className="navbar-logo" />
        </Link>
      </div>

      <div className="navbar-right desktop-nav">
        <Link to="/dashboard" className="nav-link">
          <FaHome /> Dashboard
        </Link>
        <Link to="/analytics" className="nav-link">
          <FaChartPie /> Analytics
        </Link>
        <button className="nav-link" aria-label="Notifications">
          <FaBell />
        </button>

        <div className="profile-wrapper" ref={profileRef}>
          <button
            className="nav-link"
            onClick={toggleProfile}
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            <FaUserCircle /> John Doe
          </button>
          {profileOpen && (
            <div className="profile-dropdown">
              <Link to="/profile" className="menu-item">
                Profile
              </Link>
              <Link to="/settings" className="menu-item">
                Settings
              </Link>
              <button className="menu-item logout" onClick={handleLogout}>
                <FaSignOutAlt /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right mobile-nav">
        <button
          className="menu-toggle"
          aria-label="Open menu"
          onClick={toggleMenu}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu" ref={menuRef}>
          <Link to="/dashboard" className="menu-item" onClick={toggleMenu}>
            <FaHome /> Dashboard
          </Link>
          <Link to="/analytics" className="menu-item" onClick={toggleMenu}>
            <FaChartPie /> Analytics
          </Link>
          <Link to="/profile" className="menu-item" onClick={toggleMenu}>
            <FaUserCircle /> Profile
          </Link>
          <Link to="/settings" className="menu-item" onClick={toggleMenu}>
            <FaCog /> Settings
          </Link>
          <button className="menu-item logout" onClick={handleLogout}>
            <FaSignOutAlt /> Log Out
          </button>
        </div>
      )}
    </nav>
  )
}

export default DashboardNavBar
