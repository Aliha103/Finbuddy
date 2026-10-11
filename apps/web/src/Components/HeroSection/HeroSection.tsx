import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaArrowRight, FaChartLine, FaShieldAlt, FaBolt } from 'react-icons/fa'
import './HeroSection.css'

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-bg-glow"></div>
      <div className="hero-container">
        {/* LEFT CONTENT */}
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="hero-badge-capsule">
            <span className="badge-dot"></span>
            <span>FinBuddy AI 2.0 is live</span>
          </div>
          <h1>
            The Future of <br/>
            <span className="gradient-text">Personal Finance</span>
          </h1>
          <p>
            Experience the next generation of money management. Split bills instantly, track wealth in real-time, and let AI optimize your spending.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="hero-btn primary-btn">
              Get Started <FaArrowRight className="btn-icon" />
            </Link>
            <Link to="/login" className="hero-btn secondary-btn">
              View Demo
            </Link>
          </div>
          <div className="hero-stats-row">
            <div className="stat-item">
              <strong>$2M+</strong>
              <span>Transactions</span>
            </div>
            <div className="stat-item">
              <strong>50k+</strong>
              <span>Users</span>
            </div>
            <div className="stat-item">
              <strong>4.9/5</strong>
              <span>Rating</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT CONTENT: CSS MOCKUP */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="mockup-container">
            {/* Main Card */}
            <div className="app-card main-card">
              <div className="card-header">
                <div className="card-avatar"></div>
                <div className="card-user">
                  <div className="line line-short"></div>
                  <div className="line line-long"></div>
                </div>
              </div>
              <div className="card-balance">
                <span>Total Balance</span>
                <h3>$12,450.00</h3>
              </div>
              <div className="card-graph">
                <svg viewBox="0 0 100 40" className="wave-svg">
                  <path d="M0 30 Q 10 20, 20 25 T 40 20 T 60 10 T 80 15 T 100 5" fill="none" stroke="#4ECDC4" strokeWidth="2" />
                  <path d="M0 30 Q 10 20, 20 25 T 40 20 T 60 10 T 80 15 T 100 5 V 40 H 0 Z" fill="url(#gradient)" opacity="0.2" />
                  <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4ECDC4" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="card-actions">
                <div className="action-btn"></div>
                <div className="action-btn"></div>
                <div className="action-btn"></div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              className="floating-badge badge-1"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="badge-icon"><FaBolt /></div>
              <div className="badge-text">
                <span>Income</span>
                <strong>+$2,400</strong>
              </div>
            </motion.div>

            <motion.div
              className="floating-badge badge-2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="badge-icon icon-red"><FaChartLine /></div>
              <div className="badge-text">
                <span>Savings</span>
                <strong>+15%</strong>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HeroSection
