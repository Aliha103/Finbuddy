import React from 'react'
import DashboardNavBar from '../../Components/Dashboard_NavBar/Dashboard_NavBar'
import './Dashboard.css'

function Dashboard() {
  return (
    <>
      <DashboardNavBar />
      <div className="dashboard-container">
        <h1 className="dashboard-heading">Welcome to FinBuddy</h1>
        <p className="dashboard-subheading">
          Here's an overview of your financial activity.
        </p>

        <div className="dashboard-widgets">
          <div className="widget">
            <h3>Balance</h3>
            <p>$0.00</p>
          </div>
          <div className="widget">
            <h3>Expenses</h3>
            <p>$0.00</p>
          </div>
          <div className="widget">
            <h3>Savings</h3>
            <p>$0.00</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <button className="dashboard-btn">Add Transaction</button>
          <button className="dashboard-btn outline">View Reports</button>
        </div>
      </div>
    </>
  )
}

export default Dashboard
