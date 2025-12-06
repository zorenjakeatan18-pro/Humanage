import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import DashboardCard from '../components/DashboardCard';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {
  const { employees, attendanceData, payrollData, performanceData } = useData();
  
  // Calendar and Notes state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState('');

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceData.filter(att => att.date === today);
  const presentToday = todayAttendance.filter(att => att.status === 'Present').length;
  
  const totalPayroll = payrollData
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + parseFloat(p.netPay || 0), 0);

  // ===== BIRTHDAY LOGIC =====
  const checkBirthdayToday = (birthday) => {
    if (!birthday) return false;
    const birthDate = new Date(birthday);
    const today = new Date();
    return birthDate.getMonth() === today.getMonth() && 
           birthDate.getDate() === today.getDate();
  };

  const calculateAge = (birthday) => {
    if (!birthday) return 0;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const birthdayEmployees = employees.filter(emp => checkBirthdayToday(emp.birthday));

  // ===== CALENDAR LOGIC =====
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(clickedDate);
    const dateKey = clickedDate.toISOString().split('T')[0];
    setCurrentNote(notes[dateKey] || '');
  };

  const handleSaveNote = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    if (currentNote.trim()) {
      setNotes(prev => ({ ...prev, [dateKey]: currentNote }));
    } else {
      const newNotes = { ...notes };
      delete newNotes[dateKey];
      setNotes(newNotes);
    }
  };

  const handleDeleteNote = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const newNotes = { ...notes };
    delete newNotes[dateKey];
    setNotes(newNotes);
    setCurrentNote('');
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const hasNote = notes[dateKey];

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          style={{
            padding: '0.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            background: isSelected ? '#4361ee' : isToday ? '#e3f2fd' : hasNote ? '#fff3e0' : 'transparent',
            color: isSelected ? 'white' : '#212529',
            fontWeight: isToday || isSelected ? '700' : '500',
            border: isToday && !isSelected ? '2px solid #4361ee' : 'none',
            position: 'relative',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.target.style.background = '#f8f9fa';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.target.style.background = isToday ? '#e3f2fd' : hasNote ? '#fff3e0' : 'transparent';
            }
          }}
        >
          {day}
          {hasNote && (
            <div style={{
              position: 'absolute',
              bottom: '2px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: isSelected ? 'white' : '#f72585'
            }}></div>
          )}
        </div>
      );
    }

    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Department distribution chart data
  const deptCount = {};
  employees.forEach(emp => {
    deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
  });

  const departmentChartData = {
    labels: Object.keys(deptCount).length > 0 ? Object.keys(deptCount) : ['No Data'],
    datasets: [{
      data: Object.keys(deptCount).length > 0 ? Object.values(deptCount) : [1],
      backgroundColor: [
        '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0',
        '#560bad', '#b5179e', '#480ca8', '#3f37c9', '#4895ef'
      ],
      borderWidth: 0
    }]
  };

  // Payroll chart data
  const months = [];
  const monthlyTotals = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    months.push(monthYear);
    
    const monthlyTotal = payrollData
      .filter(p => p.period === monthYear && p.status === 'Paid')
      .reduce((sum, p) => sum + parseFloat(p.netPay || 0), 0);
    monthlyTotals.push(monthlyTotal);
  }

  const payrollChartData = {
    labels: months,
    datasets: [{
      label: 'Monthly Payroll (₱)',
      data: monthlyTotals,
      backgroundColor: '#4361ee',
      borderColor: '#3a0ca3',
      borderWidth: 0
    }]
  };

  const payrollOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₱' + (value / 1000).toFixed(0) + 'K';
          }
        }
      }
    }
  };

  return (
    <div>
      {/* ===== CALENDAR AND BIRTHDAY SECTION ===== */}
      <div style={{
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: '2rem'
      }}>
        {/* Space for Birthday Notifications */}
        <div style={{
          minHeight: birthdayEmployees.length > 0 ? 'auto' : '80px',
          marginBottom: '1.5rem'
        }}>
          {birthdayEmployees.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fff9e6 0%, #ffe8cc 100%)',
              border: '2px solid #f72585',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 8px 24px rgba(247, 37, 133, 0.2)',
              animation: 'slideDown 0.5s ease-out'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  animation: 'bounce 1s infinite'
                }}>🎉</div>
                <div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#f72585',
                    margin: 0
                  }}>
                    Birthday Today!
                  </h3>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.85rem',
                    color: '#6c757d'
                  }}>
                    {birthdayEmployees.length === 1 
                      ? '1 employee celebrating' 
                      : `${birthdayEmployees.length} employees celebrating`}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '0.75rem',
                maxHeight: '300px',
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}>
                {birthdayEmployees.map(employee => (
                  <div key={employee.id} style={{
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #f72585',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f72585 0%, #b5179e 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      color: 'white',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: '#212529',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {employee.firstName} {employee.lastName}
                      </h4>
                      <p style={{
                        margin: '2px 0 0 0',
                        fontSize: '0.8rem',
                        color: '#6c757d'
                      }}>
                        {employee.position} • {employee.department}
                      </p>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, #f72585 0%, #b5179e 100%)',
                      color: 'white',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        lineHeight: 1
                      }}>
                        {calculateAge(employee.birthday) + 1}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        opacity: 0.95,
                        marginTop: '2px'
                      }}>
                        years
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(247, 37, 133, 0.05)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  👏 Don't forget to wish them a happy birthday! 🎈
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Calendar with Notes */}
        <div style={{
          background: 'white',
          border: '2px solid #e9ecef',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <button
              onClick={handlePrevMonth}
              style={{
                background: '#4361ee',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              ‹
            </button>
            <h3 style={{
              margin: 0,
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#212529'
            }}>
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              style={{
                background: '#4361ee',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              ›
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '1rem'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{
                textAlign: 'center',
                fontWeight: '700',
                fontSize: '0.85rem',
                color: '#6c757d',
                padding: '0.5rem'
              }}>
                {day}
              </div>
            ))}
            {renderCalendar()}
          </div>

          {/* Notes Section */}
          <div style={{
            borderTop: '2px solid #e9ecef',
            paddingTop: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: '700',
                color: '#212529'
              }}>
                📝 Notes for {formatDate(selectedDate.toISOString())}
              </h4>
            </div>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Add a note for this date..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '0.9rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '0.75rem'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={handleSaveNote}
                style={{
                  flex: 1,
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#218838'}
                onMouseLeave={(e) => e.target.style.background = '#28a745'}
              >
                💾 Save Note
              </button>
              <button
                onClick={handleDeleteNote}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#c82333'}
                onMouseLeave={(e) => e.target.style.background = '#dc3545'}
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Total Employees"
          value={totalEmployees}
          icon="fa-users"
          iconColor="primary"
          subtitle={`${activeEmployees} active`}
        />
        <DashboardCard
          title="Present Today"
          value={presentToday}
          icon="fa-user-check"
          iconColor="success"
          subtitle={`Out of ${totalEmployees}`}
        />
        <DashboardCard
          title="Total Payroll"
          value={`₱${totalPayroll.toLocaleString()}`}
          icon="fa-money-bill-wave"
          iconColor="warning"
          subtitle="This month"
        />
        <DashboardCard
          title="Performance Reviews"
          value={performanceData.length}
          icon="fa-star"
          iconColor="info"
          subtitle="Total evaluations"
        />
      </div>

      <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="card">
          <h3 className="card-title">Department Distribution</h3>
          <div style={{ height: '300px', padding: '1rem' }}>
            <Doughnut data={departmentChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Payroll Overview</h3>
          <div style={{ height: '300px', padding: '1rem' }}>
            <Bar data={payrollChartData} options={payrollOptions} />
          </div>
        </div>
      </div>

      {/* ===== ANIMATIONS ===== */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @media (max-width: 1200px) {
          .charts-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;