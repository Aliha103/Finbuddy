import React, { useEffect, useState } from 'react'
import './NewsletterPopup.css'

function NewsletterPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem('finbuddy_newsletter_seen')
    if (!hasSeen) {
      const timer = setTimeout(() => setVisible(true), 2000) // show after 2s
      return () => clearTimeout(timer) // clean up timer if component unmounts
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('finbuddy_newsletter_seen', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="newsletter-popup">
      <div className="newsletter-content">
        <h3>Join Our Newsletter</h3>
        <p>Get smart financial tips and product updates monthly!</p>
        <input type="email" placeholder="Enter your email" />
        <button>Subscribe</button>
        <span onClick={handleClose} className="close-btn">
          &times;
        </span>
      </div>
    </div>
  )
}

export default NewsletterPopup
