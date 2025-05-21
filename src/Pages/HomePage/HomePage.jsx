import React, { useEffect, useState } from "react";
import NavBar from "../../Components/NavBar/NavBar";
import NewsletterPopup from "../../Components/NewsletterPopup/NewsletterPopup";
import HeroSection from "../../Components/HeroSection/HeroSection";
import FeatureCarousel from "../../Components/FeatureCarousel/FeatureCarousel";
import AppPromo from "../../Components/AppPromo/AppPromo";
import WhyChoose from "../../Components/WhyChoose/WhyChoose";
import Testimonials from "../../Components/Testimonials/Testimonials";

import features from "../../data/features/features";
import testimonials from "../../data/testimonials/testimonials";

import "./HomePage.css";

function HomePage() {
  const [showNewsletter, setShowNewsletter] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem("hasVisited");
    if (visited !== "true") {
      setTimeout(() => setShowNewsletter(true), 3000);
      localStorage.setItem("hasVisited", "true");
    }
  }, []);

  return (
    <div className="homepage">
      <NavBar />

      {showNewsletter && (
        <NewsletterPopup onClose={() => setShowNewsletter(false)} />
      )}

      {/* === HERO SECTION === */}
      <HeroSection />

      {/* === FEATURES CAROUSEL === */}
      <FeatureCarousel features={features} visibleCards={3} />

      {/* === WHY CHOOSE US === */}
      <WhyChoose />

      {/* === USER TESTIMONIALS === */}
      <Testimonials testimonials={testimonials} />

      {/* === MOBILE APP PROMO === */}
      <AppPromo />
    </div>
  );
}

export default HomePage;
