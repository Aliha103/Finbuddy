import React from "react";
import logo from "../../assets/logo/finbuddy_logo.png";
import "./NavBar.css";

function NavBar() {
  return (
    <nav className="NavBar_container">
      <a href="/">
        <img
          src={logo}
          alt="FinBuddy Logo"
          style={{ height: "70px" }}
          className="NaBar_logo"
        />
      </a>
      <div className="NavBar_links">
        <a href="/" className="NavBar_link">
          Login
        </a>
        <a className="NavBar_link" href="/">
          SignUp
        </a>
      </div>
    </nav>
  );
}

export default NavBar;
