import React from 'react';

const DashboardCard = ({ title, value, icon, iconColor, subtitle }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          <div className="card-value">{value}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
        <div className={`card-icon bg-${iconColor}`}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
