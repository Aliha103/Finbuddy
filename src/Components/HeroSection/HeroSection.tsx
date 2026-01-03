import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import heroImage from '../../assets/images/Financial Dashboard Overview.png'
import './HeroSection.css'

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="hero-badge">New: AI Financial Assistant 🤖</span>
          <h1>
            Master Your Money with <span className="gradient-text">FinBuddy</span>
          </h1>
          <p>
            The all-in-one platform to track expenses, split bills, and grow your wealth using AI-driven insights. Join thousands of smart savers today.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="hero-btn primary-btn">
              Get Started Free
            </Link>
            <Link to="/login" className="hero-btn secondary-btn">
              Live Demo
            </Link>
          </div>
          <div className="hero-trust">
            <span>Trusted by 10,000+ users</span>
            <div className="trust-dots">
              <span className="dot" style={{backgroundColor: '#FF6B6B'}}></span>
              <span className="dot" style={{backgroundColor: '#4ECDC4'}}></span>
              <span className="dot" style={{backgroundColor: '#FFE66D'}}></span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero-image-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="hero-blob"></div>
          <img
            src={heroImage}
            alt="FinBuddy Dashboard Overview"
            className="hero-image"
            loading="eager"
          />
          <motion.div
            className="hero-floating-card card-1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <span>💰 Savings</span>
            <strong>+12%</strong>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default HeroSection
