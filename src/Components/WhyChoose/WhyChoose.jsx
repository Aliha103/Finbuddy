import React from "react";
import "./WhyChoose.css";

function WhyChoose() {
  return (
    <section className="why-finbuddy">
      <h2>Why People Choose FinBuddy</h2>
      <div className="why-cards">
        <div>
          <strong>🔐 Security First</strong>
          <p>Military-grade encryption and private by design.</p>
        </div>
        <div>
          <strong>📡 Real-Time Sync</strong>
          <p>Access your data across devices instantly.</p>
        </div>
        <div>
          <strong>👥 Made for Groups</strong>
          <p>Split, settle, and share expenses effortlessly.</p>
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;
