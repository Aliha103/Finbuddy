import React from "react";
import { Link } from "react-router-dom";
import "./HeroSection.css"; // Ensure to create matching CSS

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>Smarter Finance Starts Here</h1>
        <p>
          All-in-one personal finance platform built for simplicity and insight.
        </p>
        <Link to="/signup" className="hero-btn">
          Get Started Free
        </Link>
      </div>
    </section>
  );
}

export default HeroSection;