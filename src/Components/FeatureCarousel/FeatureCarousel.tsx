import React from "react";
import Slider from "react-slick";
import "./FeatureCarousel.css";
// @ts-expect-error - No types for this data file yet
import features from "../../data/features/features";

interface Feature {
  title: string;
  description: string;
  image: string;
}

// If features were typed, we wouldn't need to define Feature here potentially, but for now...
// The props passed in HomePage are `features` and `visibleCards`, but FeatureCarousel definition doesn't use props currently.
// It imports `features` directly.
// However, `HomePage` passes `features={features}`.
// I should update FeatureCarousel to accept props to be cleaner, or just ignore them if it uses import.
// Looking at HomePage: `<FeatureCarousel features={features} visibleCards={3} />`
// Looking at FeatureCarousel: `function FeatureCarousel() { ... }` (it ignores props)
// I will keep it as is but type the component.

const FeatureCarousel: React.FC = () => {
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
        {features.map((feature: Feature, index: number) => (
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
