import React from 'react'
import { Link } from 'react-router-dom'
import { FaTwitter, FaLinkedin, FaInstagram, FaGithub, FaShieldAlt } from 'react-icons/fa'
import logo from '../../assets/logo/finbuddy_logo.png'
import './Footer.css'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="footer-logo-link">
            <img src={logo} alt="FinBuddy" className="footer-logo" />
            <span className="footer-brand-name">FinBuddy</span>
          </Link>
          <p>
            The financial super-app for the modern generation. Track, split, and grow your wealth in one place.
          </p>
          <div className="footer-socials">
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="GitHub"><FaGithub /></a>
          </div>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>Product</h4>
            <Link to="/features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/cards">Cards</Link>
            <Link to="/ai">AI Assistant</Link>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/press">Press</Link>
          </div>
          <div className="footer-column">
            <h4>Support</h4>
            <Link to="/help">Help Center</Link>
            <Link to="/community">Community</Link>
            <Link to="/status">System Status</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/security">Security <FaShieldAlt className="tiny-icon" /></Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} FinBuddy Technologies Inc. All rights reserved.</p>
        <div className="footer-bottom-links">
          <Link to="/cookies">Cookie Settings</Link>
          <span className="separator">•</span>
          <Link to="/accessibility">Accessibility</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
