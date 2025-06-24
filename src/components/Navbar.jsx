import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">AI Chat Widget</Link>
      </div>
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/api-key-manager" className="nav-link">API Keys</Link>
        <Link to="/embedding-insert" className="nav-link">Embeddings</Link>
      </div>
    </nav>
  );
};

export default Navbar; 