import React from 'react'
import { TestimonialData } from '../../data/testimonials/testimonials'
import './Testimonials.css'

interface TestimonialsProps {
  testimonials: TestimonialData[]
}

function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <section className="testimonials-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-badge">Community Love</span>
          <h2>Trusted by Thousands</h2>
          <p>Join over 50,000 users who are already mastering their finances with FinBuddy.</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <div key={idx} className="testimonial-card">
              <div className="quote-mark">“</div>
              <p className="testimonial-text">{t.quote}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.emoji}</div>
                <div className="author-info">
                  <strong>{t.name}</strong>
                  <span>{t.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
