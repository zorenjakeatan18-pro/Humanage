import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ title }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfile = () => {
    setShowDropdown(false);
    navigate('/profile');
  };

  const handleSettings = () => {
    setShowDropdown(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="header">
      <div className="header-left">
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        <div 
          className="user-profile" 
          onClick={() => setShowDropdown(!showDropdown)}
          ref={dropdownRef}
        >
          <div className="user-avatar">{user?.avatar || 'AD'}</div>
          <span>{user?.name || 'Admin'}</span>
          <i className={`fas fa-chevron-down ${showDropdown ? 'rotate' : ''}`}></i>
          <div className={`dropdown-menu ${showDropdown ? 'show' : ''}`}>
            <div className="dropdown-item" onClick={handleProfile}>
              <i className="fas fa-user"></i>
              <span>Profile</span>
            </div>
            <div className="dropdown-item" onClick={handleSettings}>
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;