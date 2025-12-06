import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { id: 'employees', path: '/employees', icon: 'fa-users', label: 'Employees' },
    { id: 'attendance', path: '/attendance', icon: 'fa-clock', label: 'Attendance' },
    { id: 'payroll', path: '/payroll', icon: 'fa-money-bill-wave', label: 'Payroll' },
    { id: 'performance', path: '/performance', icon: 'fa-star', label: 'Performance' },
    { id: 'reports', path: '/reports', icon: 'fa-file-alt', label: 'Reports' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <i className="fas fa-briefcase"></i>
        <h2>Humanage</h2>
      </div>
      <div className="sidebar-menu">
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
          >
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;