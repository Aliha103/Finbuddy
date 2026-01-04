import React from "react";
import Slider from "react-slick";
import "./FeatureCarousel.css";
import features, { FeatureItem } from "../../data/features/features";

const FeatureCarousel: React.FC = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
    pauseOnHover: true,
    cssEase: "cubic-bezier(0.87, 0, 0.13, 1)",
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1, centerMode: true, centerPadding: '20px' },
      },
    ],
  };

  return (
    <section className="feature-slider">
      <div className="feature-header">
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-subtitle">Powerful tools to manage your financial life</p>
      </div>

      <Slider {...settings}>
        {features.map((feature: FeatureItem, index: number) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="feature-slide-wrapper">
              <div className="feature-card">
                <div
                  className="feature-icon-wrapper"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  <Icon className="feature-icon" />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-card-decoration" style={{ backgroundColor: feature.color }}></div>
              </div>
            </div>
          )
        })}
      </Slider>
    </section>
  );
}

export default FeatureCarousel;
