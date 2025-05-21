import React from "react";
import "./AppPromo.css";

function AppPromo() {
  return (
    <section className="app-preview">
      <h2>Mobile-Ready</h2>
      <p>Use FinBuddy on any device with a seamless experience.</p>
      <img
        src="/assets/images/mobile-preview.png"
        alt="FinBuddy Mobile App"
        className="app-preview-img"
      />
      <div className="store-buttons">
        <a href="/playstore">Google Play</a>
        <a href="/appstore">App Store</a>
      </div>
    </section>
  );
}

export default AppPromo;
