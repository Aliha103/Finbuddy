import React, { useState, useEffect, useRef } from "react";
import logo from "../../assets/logo/finbuddy_logo.png";
import { FaSearch, FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(window.scrollY);
  const [visible, setVisible] = useState(true);
  const menuRef = useRef();

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-hide navbar on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  return (
    <nav
      className={`navbar ${visible ? "navbar-visible" : "navbar-hidden"}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="navbar-left">
        <Link to="/">
          <img src={logo} alt="FinBuddy Logo" className="navbar-logo" />
        </Link>
      </div>

      <div className="navbar-right">
        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          onClick={toggleMenu}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div className="navbar-center">
        <div className="navbar-search">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search..." aria-label="Search" />
        </div>
      </div>

      <div ref={menuRef} className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <Link to="/login" className="btn btn-outline">
          Login
        </Link>
        <Link to="/signup" className="btn btn-primary">
          Sign Up
        </Link>
      </div>
    </nav>
  );
}

export default NavBar;
