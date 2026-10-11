import React from 'react'
import { FaShieldAlt, FaSyncAlt, FaUsers, FaChartPie, FaMobileAlt, FaRobot } from 'react-icons/fa'
import './WhyChoose.css'

function WhyChoose() {
  const features = [
    {
      icon: <FaShieldAlt />,
      title: "Bank-Grade Security",
      desc: "Your data is encrypted with military-grade 256-bit encryption. We prioritize your privacy above all else."
    },
    {
      icon: <FaSyncAlt />,
      title: "Real-Time Sync",
      desc: "Access your financial data across all your devices instantly. Changes update in real-time."
    },
    {
      icon: <FaUsers />,
      title: "Group Management",
      desc: "Split bills, manage shared expenses, and settle debts with friends, roommates, or partners."
    },
    {
      icon: <FaChartPie />,
      title: "Smart Analytics",
      desc: "Visualize your spending habits with intuitive charts and gain actionable insights to save more."
    },
    {
      icon: <FaMobileAlt />,
      title: "Mobile First",
      desc: "Designed for on-the-go finance management. A seamless experience on both iOS and Android."
    },
    {
      icon: <FaRobot />,
      title: "AI Financial Advisor",
      desc: "Get personalized tips and spending warnings from our advanced AI assistant."
    }
  ]

  return (
    <section className="why-choose-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-badge">Why FinBuddy</span>
          <h2>The Smart Way to Manage Money</h2>
          <p>Everything you need to take control of your financial life, all in one place.</p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyChoose
