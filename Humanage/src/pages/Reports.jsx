import React from 'react';
import { useData } from '../context/DataContext';

const Reports = () => {
  const { employees, attendanceData, payrollData, performanceData } = useData();

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const inactiveEmployees = employees.filter(emp => emp.status === 'Inactive').length;

  // Department statistics
  const deptStats = {};
  employees.forEach(emp => {
    if (!deptStats[emp.department]) {
      deptStats[emp.department] = 0;
    }
    deptStats[emp.department]++;
  });

  // Attendance statistics
  const presentCount = attendanceData.filter(att => att.status === 'Present').length;
  const absentCount = attendanceData.filter(att => att.status === 'Absent').length;
  const lateCount = attendanceData.filter(att => att.status === 'Late').length;

  // Payroll statistics
  const totalPayroll = payrollData.reduce((sum, p) => sum + parseFloat(p.netPay || 0), 0);
  const paidPayroll = payrollData.filter(p => p.status === 'Paid').length;
  const pendingPayroll = payrollData.filter(p => p.status === 'Pending').length;

  // Performance statistics
  const ratingStats = {
    Excellent: performanceData.filter(p => p.rating === 'Excellent').length,
    Good: performanceData.filter(p => p.rating === 'Good').length,
    Satisfactory: performanceData.filter(p => p.rating === 'Satisfactory').length,
    'Needs Improvement': performanceData.filter(p => p.rating === 'Needs Improvement').length
  };

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Reports & Analytics</h2>

      {/* Employee Statistics */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">Employee Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="stat-box">
            <div className="stat-label">Total Employees</div>
            <div className="stat-value">{totalEmployees}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Active</div>
            <div className="stat-value" style={{ color: '#4cc9f0' }}>{activeEmployees}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Inactive</div>
            <div className="stat-value" style={{ color: '#e63946' }}>{inactiveEmployees}</div>
          </div>
        </div>

        <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Department Distribution</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Employee Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(deptStats).map(([dept, count]) => (
              <tr key={dept}>
                <td>{dept}</td>
                <td>{count}</td>
                <td>{((count / totalEmployees) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Attendance Report */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">Attendance Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="stat-box">
            <div className="stat-label">Total Records</div>
            <div className="stat-value">{attendanceData.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Present</div>
            <div className="stat-value" style={{ color: '#4cc9f0' }}>{presentCount}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Late</div>
            <div className="stat-value" style={{ color: '#f72585' }}>{lateCount}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Absent</div>
            <div className="stat-value" style={{ color: '#e63946' }}>{absentCount}</div>
          </div>
        </div>
      </div>

      {/* Payroll Report */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">Payroll Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="stat-box">
            <div className="stat-label">Total Payroll</div>
            <div className="stat-value">₱{totalPayroll.toLocaleString()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Paid</div>
            <div className="stat-value" style={{ color: '#4cc9f0' }}>{paidPayroll}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Pending</div>
            <div className="stat-value" style={{ color: '#f72585' }}>{pendingPayroll}</div>
          </div>
        </div>
      </div>

      {/* Performance Report */}
      <div className="card">
        <h3 className="card-title">Performance Review Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="stat-box">
            <div className="stat-label">Total Reviews</div>
            <div className="stat-value">{performanceData.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Excellent</div>
            <div className="stat-value" style={{ color: '#4cc9f0' }}>{ratingStats.Excellent}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Good</div>
            <div className="stat-value" style={{ color: '#4cc9f0' }}>{ratingStats.Good}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Satisfactory</div>
            <div className="stat-value" style={{ color: '#f72585' }}>{ratingStats.Satisfactory}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Needs Improvement</div>
            <div className="stat-value" style={{ color: '#e63946' }}>{ratingStats['Needs Improvement']}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
