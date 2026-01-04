import React from 'react'
import { FaApple, FaGooglePlay, FaStar } from 'react-icons/fa'
import { motion } from 'framer-motion'
import './AppPromo.css'

function AppPromo() {
  return (
    <section className="app-promo-section">
      <div className="app-promo-container">
        <div className="promo-content">
          <div className="promo-badge">Coming Soon</div>
          <h2>Carry Your Finances<br />In Your Pocket</h2>
          <p>
            Experience the full power of FinBuddy on iOS and Android.
            Real-time notifications, camera receipt scanning, and instant group splitting.
          </p>

          <div className="app-rating">
            <div className="stars">
              <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
            </div>
            <span>5.0 based on beta tester feedback</span>
          </div>

          <div className="store-buttons">
            <button className="store-btn">
              <FaApple className="store-icon" />
              <div className="btn-text">
                <small>Download on the</small>
                <strong>App Store</strong>
              </div>
            </button>
            <button className="store-btn">
              <FaGooglePlay className="store-icon" />
              <div className="btn-text">
                <small>Get it on</small>
                <strong>Google Play</strong>
              </div>
            </button>
          </div>
        </div>

        <div className="promo-visual">
          <motion.div
            className="phone-mockup"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="notch"></div>
            <div className="screen">
              {/* Abstract UI representing the app */}
              <div className="app-header">
                <div className="menu-icon"></div>
                <div className="profile-icon"></div>
              </div>
              <div className="app-balance">
                <small>Total Balance</small>
                <h3>$4,250.00</h3>
              </div>
              <div className="app-chart"></div>
              <div className="app-list">
                <div className="list-item"></div>
                <div className="list-item"></div>
                <div className="list-item"></div>
              </div>
              <div className="fab-btn">+</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AppPromo
