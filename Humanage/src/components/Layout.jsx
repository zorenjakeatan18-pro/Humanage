import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
    { path: '/employees', icon: 'fa-users', label: 'Employees' },
    { path: '/attendance', icon: 'fa-calendar-check', label: 'Attendance' },
    { path: '/payroll', icon: 'fa-dollar-sign', label: 'Payroll' },
    { path: '/performance', icon: 'fa-chart-line', label: 'Performance' },
    { path: '/reports', icon: 'fa-file-alt', label: 'Reports' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>
            <i className="fas fa-briefcase"></i> Humanage
          </h2>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1>
              {menuItems.find(item => item.path === location.pathname)?.label || 
               'Dashboard'}
            </h1>
          </div>

          <div className="header-right">

            {/* User Menu */}
            <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="user-info">
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name || 'Admin'}</div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>{user?.role || 'Administrator'}</div>
              </div>
              <i className={`fas fa-chevron-down ${showUserMenu ? 'rotate' : ''}`}></i>

              {showUserMenu && (
                <div className="dropdown-menu show">
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-user"></i>
                    Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-cog"></i>
                    Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;