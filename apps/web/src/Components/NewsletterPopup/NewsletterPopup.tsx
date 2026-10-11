import React, { useEffect, useState } from 'react'
import { FaPaperPlane, FaTimes } from 'react-icons/fa'
import './NewsletterPopup.css'

interface NewsletterPopupProps {
  onClose?: () => void
}

function NewsletterPopup({ onClose }: NewsletterPopupProps) {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const hasSeen = localStorage.getItem('finbuddy_newsletter_seen')
    if (!hasSeen) {
      const timer = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('finbuddy_newsletter_seen', 'true')
    setVisible(false)
    if (onClose) onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock submit
    localStorage.setItem('finbuddy_newsletter_seen', 'true')
    setVisible(false)
    if (onClose) onClose()
    alert('Subscribed!')
  }

  if (!visible) return null

  return (
    <div className="newsletter-overlay">
      <div className="newsletter-card">
        <button className="close-btn-icon" onClick={handleClose}>
          <FaTimes />
        </button>
        <div className="newsletter-icon">
          <FaPaperPlane />
        </div>
        <h3>Financial Wisdom,<br/>Delivered.</h3>
        <p>Join 10,000+ others getting our weekly money tips and market insights.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit">Subscribe Free</button>
        </form>
        <div className="newsletter-footer">
          No spam, unsubscribe anytime.
        </div>
      </div>
    </div>
  )
}

export default NewsletterPopup
