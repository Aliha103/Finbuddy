import React, { useEffect, useState } from "react";
import NavBar from "../../Components/NavBar/NavBar";
import NewsletterPopup from "../../Components/NewsletterPopup/NewsletterPopup";
import HeroSection from "../../Components/HeroSection/HeroSection";
import FeatureCarousel from "../../Components/FeatureCarousel/FeatureCarousel";
import AppPromo from "../../Components/AppPromo/AppPromo";
import WhyChoose from "../../Components/WhyChoose/WhyChoose";
import Testimonials from "../../Components/Testimonials/Testimonials";

// @ts-expect-error - No types for this data file yet
import features from "../../data/features/features";
// @ts-expect-error - No types for this data file yet
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
      {/* Note: FeatureCarousel currently ignores props and uses internal import, but we keep passing them for now */}
      {/* @ts-expect-error - FeatureCarousel props mismatch */}
      <FeatureCarousel features={features} visibleCards={3} />

      {/* === WHY CHOOSE US === */}
      <WhyChoose />

      {/* === USER TESTIMONIALS === */}
      {/* @ts-expect-error - Testimonials props mismatch */}
      <Testimonials testimonials={testimonials} />

      {/* === MOBILE APP PROMO === */}
      <AppPromo />
    </div>
  );
}

export default HomePage;
