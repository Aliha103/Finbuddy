import React from "react";
import Slider from "react-slick";
import "./FeatureCarousel.css";
import features from "../../data/features/features";

function FeatureCarousel() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <section className="feature-slider">
      <h2 className="section-title">Everything You Need</h2>
      <Slider {...settings}>
        {features.map((feature, index) => (
          <div key={index}>
            <div className="feature-slide-inner">
              <img
                src={feature.image}
                alt={feature.title}
                className="feature-bg"
                loading="lazy"
              />
              <div className="feature-overlay-text">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}

export default FeatureCarousel;
