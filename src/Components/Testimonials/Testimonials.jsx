function Testimonials({ testimonials }) {
  return (
    <section className="testimonials">
      <h2>What Our Users Say</h2>
      <div className="testimonial-grid">
        {testimonials.map((t, idx) => (
          <div key={idx} className="testimonial-card">
            <div className="quote-icon">“</div>
            <p>{t.quote}</p>
            <span>
              {t.emoji} <strong>{t.name}</strong>, <em>{t.title}</em>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
