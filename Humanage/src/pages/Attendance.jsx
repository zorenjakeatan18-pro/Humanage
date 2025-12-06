import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Attendance = ({ showToast }) => {
  const { employees, attendanceData, addAttendance, updateAttendance, deleteAttendance } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [checkoutRecord, setCheckoutRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [reportConfig, setReportConfig] = useState({
    employeeId: '',
    month: new Date().toISOString().slice(0, 7)
  });
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    timeIn: '',
    timeOut: '',
    status: 'Present',
    overtime: '0',
    undertime: '0',
    late: '0',
    isAbsent: false
  });
  const [checkoutData, setCheckoutData] = useState({
    timeOut: ''
  });

  // Safe showToast wrapper
  const safeShowToast = (message, type = 'info') => {
    if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}]: ${message}`);
      alert(message);
    }
  };

  // Format date for display (e.g., "Dec 5, 2025")
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format hours to show in hours and minutes (e.g., "1.5h" becomes "1h 30m")
  const formatHours = (hours) => {
    if (!hours || hours === '0' || hours === 0) return '0h';
    
    const numHours = parseFloat(hours);
    const wholeHours = Math.floor(numHours);
    const minutes = Math.round((numHours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    
    return `${wholeHours}h ${minutes}m`;
  };

  // Get unique departments
  const departments = ['All', ...new Set(employees.map(emp => emp.department).filter(Boolean))];

  // Standard work hours (8 hours) and times
  const STANDARD_HOURS = 8;
  const STANDARD_TIME_IN = '08:00';
  const STANDARD_TIME_OUT = '16:00'; // 8 AM + 8 hours = 4 PM

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // If marking as absent, clear time fields
    if (name === 'isAbsent' && checked) {
      setFormData(prev => ({
        ...prev,
        isAbsent: true,
        timeIn: '',
        timeOut: '',
        hoursWorked: '0',
        late: '0',
        overtime: '0',
        undertime: '0',
        status: 'Absent'
      }));
      return;
    }
    
    // If unchecking absent, reset to present
    if (name === 'isAbsent' && !checked) {
      setFormData(prev => ({
        ...prev,
        isAbsent: false,
        status: 'Present'
      }));
      return;
    }
    
    // Auto-calculate metrics when time changes (only if not absent)
    if ((name === 'timeIn' || name === 'timeOut') && !formData.isAbsent) {
      const timeIn = name === 'timeIn' ? value : formData.timeIn;
      const timeOut = name === 'timeOut' ? value : formData.timeOut;
      
      if (timeIn && timeOut) {
        const metrics = calculateAttendanceMetrics(timeIn, timeOut);
        setFormData(prev => ({
          ...prev,
          hoursWorked: metrics.hoursWorked,
          late: metrics.late,
          overtime: metrics.overtime,
          undertime: metrics.undertime,
          status: metrics.status
        }));
      }
    }
  };

  const handleCheckoutChange = (e) => {
    const { name, value } = e.target;
    setCheckoutData(prev => ({ ...prev, [name]: value }));
  };

  const handleReportConfigChange = (e) => {
    const { name, value } = e.target;
    setReportConfig(prev => ({ ...prev, [name]: value }));
  };

  const calculateHours = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return 0;
    const [inHour, inMin] = timeIn.split(':').map(Number);
    const [outHour, outMin] = timeOut.split(':').map(Number);
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(1);
  };

  const calculateAttendanceMetrics = (timeIn, timeOut) => {
    const hoursWorked = parseFloat(calculateHours(timeIn, timeOut));
    
    // Calculate Late (compared to 8:00 AM)
    const [inHour, inMin] = timeIn.split(':').map(Number);
    const [standardInHour, standardInMin] = STANDARD_TIME_IN.split(':').map(Number);
    const actualIn = inHour * 60 + inMin;
    const standardIn = standardInHour * 60 + standardInMin;
    const lateMinutes = Math.max(0, actualIn - standardIn);
    const lateHours = (lateMinutes / 60).toFixed(1);
    
    // Calculate Overtime and Undertime
    let overtime = '0.0';
    let undertime = '0.0';
    let status = 'Present';
    
    if (hoursWorked > STANDARD_HOURS) {
      overtime = (hoursWorked - STANDARD_HOURS).toFixed(1);
      status = 'Present'; // Has overtime but still present
    } else if (hoursWorked < STANDARD_HOURS) {
      undertime = (STANDARD_HOURS - hoursWorked).toFixed(1);
      
      // Determine if it's Half Day or Undertime
      if (hoursWorked <= 4) {
        status = 'Half Day';
      } else {
        status = 'Present'; // Undertime but still present
      }
    }
    
    // Override status if employee was late (more than 15 minutes)
    if (lateMinutes > 15 && status === 'Present') {
      status = 'Late';
    }
    
    return {
      hoursWorked: hoursWorked.toFixed(1),
      late: lateHours,
      overtime: overtime,
      undertime: undertime,
      status: status
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.employeeId) {
      safeShowToast('Please select an employee', 'error');
      return;
    }

    // If marking as absent, no need for time validation
    if (formData.isAbsent || formData.status === 'Absent') {
      const employee = employees.find(emp => (emp._id || emp.id) === formData.employeeId);
      
      if (!employee) {
        safeShowToast('Employee not found', 'error');
        return;
      }
      
      const attendanceRecord = {
        employeeId: formData.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department || 'N/A',
        date: formData.date,
        timeIn: '',
        timeOut: '',
        hoursWorked: '0',
        late: '0',
        overtime: '0',
        undertime: '0',
        status: 'Absent'
      };
      
      console.log('Saving absent record:', attendanceRecord);
      addAttendance(attendanceRecord);
      safeShowToast('Absence recorded successfully', 'success');
      handleCloseModal();
      return;
    }

    // Regular attendance with time validation
    if (!formData.timeIn || !formData.timeOut) {
      safeShowToast('Please enter both Time In and Time Out', 'error');
      return;
    }

    const metrics = calculateAttendanceMetrics(formData.timeIn, formData.timeOut);
    const employee = employees.find(emp => (emp._id || emp.id) === formData.employeeId);
    
    if (!employee) {
      safeShowToast('Employee not found', 'error');
      return;
    }
    
    const attendanceRecord = {
      employeeId: formData.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      department: employee.department || 'N/A',
      date: formData.date,
      timeIn: formData.timeIn,
      timeOut: formData.timeOut,
      hoursWorked: metrics.hoursWorked,
      late: metrics.late,
      overtime: metrics.overtime,
      undertime: metrics.undertime,
      status: metrics.status
    };
    
    console.log('Saving attendance record:', attendanceRecord);
    addAttendance(attendanceRecord);
    safeShowToast('Attendance recorded successfully', 'success');
    handleCloseModal();
  };

  const handleCheckout = (attendance) => {
    setCheckoutRecord(attendance);
    setCheckoutData({
      timeOut: attendance.timeOut || ''
    });
    setIsCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    
    if (!checkoutData.timeOut) {
      safeShowToast('Please enter time out', 'error');
      return;
    }

    const metrics = calculateAttendanceMetrics(checkoutRecord.timeIn, checkoutData.timeOut);
    
    const updatedRecord = {
      employeeId: checkoutRecord.employeeId,
      employeeName: checkoutRecord.employeeName,
      department: checkoutRecord.department,
      date: checkoutRecord.date,
      timeIn: checkoutRecord.timeIn,
      timeOut: checkoutData.timeOut,
      hoursWorked: metrics.hoursWorked,
      late: metrics.late,
      overtime: metrics.overtime,
      undertime: metrics.undertime,
      status: metrics.status
    };
    
    console.log('Updating attendance with:', updatedRecord); // Debug log
    updateAttendance(checkoutRecord._id || checkoutRecord.id, updatedRecord);
    safeShowToast('Check-out time updated successfully', 'success');
    handleCloseCheckoutModal();
  };

  const handleView = (attendance) => {
    setEditingAttendance(attendance);
    setFormData(attendance);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      deleteAttendance(id);
      safeShowToast('Attendance record deleted successfully', 'success');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAttendance(null);
    setFormData({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      timeIn: '',
      timeOut: '',
      status: 'Present',
      overtime: '0',
      undertime: '0',
      late: '0',
      isAbsent: false
    });
  };

  const handleCloseCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
    setCheckoutRecord(null);
    setCheckoutData({
      timeOut: ''
    });
  };

  const getMonthlyAttendance = (employeeId, month) => {
    return attendanceData.filter(att => {
      const attMonth = att.date.slice(0, 7);
      return (att.employeeId === employeeId || att.employeeId === employeeId) && attMonth === month;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const generatePDFReport = () => {
    try {
      // Validate employee selection
      if (!reportConfig.employeeId) {
        safeShowToast('Please select an employee', 'error');
        return;
      }

      const employee = employees.find(emp => (emp._id || emp.id) === reportConfig.employeeId);
      if (!employee) {
        safeShowToast('Employee not found', 'error');
        return;
      }

      // Validate month selection
      if (!reportConfig.month) {
        safeShowToast('Please select a month', 'error');
        return;
      }

      const monthlyData = getMonthlyAttendance(reportConfig.employeeId, reportConfig.month);
      
      if (monthlyData.length === 0) {
        safeShowToast('No attendance records found for this period', 'error');
        return;
      }

      // Create new PDF document
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Header - Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Attendance Report', 105, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Employee Information
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee: ${employee.firstName} ${employee.lastName}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Department: ${employee.department || 'N/A'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Month: ${reportConfig.month}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Report Generated: ${formatDate(new Date().toISOString())}`, 20, yPosition);
      yPosition += 10;
      
      // Calculate totals
      const totals = monthlyData.reduce((acc, record) => ({
        hoursWorked: acc.hoursWorked + parseFloat(record.hoursWorked || 0),
        overtime: acc.overtime + parseFloat(record.overtime || 0),
        undertime: acc.undertime + parseFloat(record.undertime || 0),
        late: acc.late + parseFloat(record.late || 0),
        present: acc.present + (record.status === 'Present' ? 1 : 0),
        absent: acc.absent + (record.status === 'Absent' ? 1 : 0),
        lateStatus: acc.lateStatus + (record.status === 'Late' ? 1 : 0),
        halfDay: acc.halfDay + (record.status === 'Half Day' ? 1 : 0)
      }), { hoursWorked: 0, overtime: 0, undertime: 0, late: 0, present: 0, absent: 0, lateStatus: 0, halfDay: 0 });

      // Summary Box with background
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPosition, 170, 45, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 25, yPosition + 8);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Left column
      doc.text(`Days Present: ${totals.present}`, 25, yPosition + 18);
      doc.text(`Days Absent: ${totals.absent}`, 25, yPosition + 26);
      doc.text(`Days Late: ${totals.lateStatus}`, 25, yPosition + 34);
      doc.text(`Half Days: ${totals.halfDay}`, 25, yPosition + 42);
      
      // Right column - with better formatting
      doc.text(`Total Hours Worked: ${formatHours(totals.hoursWorked.toFixed(1))}`, 110, yPosition + 18);
      doc.text(`Total Overtime: ${formatHours(totals.overtime.toFixed(1))}`, 110, yPosition + 26);
      doc.text(`Total Undertime: ${formatHours(totals.undertime.toFixed(1))}`, 110, yPosition + 34);
      doc.text(`Total Late Hours: ${formatHours(totals.late.toFixed(1))}`, 110, yPosition + 42);
      
      yPosition += 55;
      
      // Prepare table data with formatted hours
      const tableData = monthlyData.map(record => [
        formatDate(record.date) || 'N/A',
        record.timeIn || 'N/A',
        record.timeOut || 'N/A',
        formatHours(record.hoursWorked || '0'),
        record.status || 'N/A',
        formatHours(record.late || '0'),
        formatHours(record.overtime || '0'),
        formatHours(record.undertime || '0')
      ]);

      // Add table using autoTable
      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Time In', 'Time Out', 'Hours', 'Status', 'Late', 'OT', 'UT']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 18, halign: 'center' }
        },
        margin: { top: 10, left: 20, right: 20 }
      });

      // Add page numbers to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Generate filename
      const fileName = `Attendance_${employee.firstName}_${employee.lastName}_${reportConfig.month.replace('-', '_')}.pdf`;
      
      // Save the PDF
      doc.save(fileName);
      
      // Show success message and close modal
      safeShowToast('PDF report generated successfully!', 'success');
      setIsReportModalOpen(false);
      
      // Reset report config
      setReportConfig({
        employeeId: '',
        month: new Date().toISOString().slice(0, 7)
      });
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      safeShowToast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  const filteredAttendance = attendanceData.filter(att => {
    const employee = employees.find(emp => (emp._id || emp.id) === att.employeeId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : '';
    const department = employee ? employee.department : '';
    
    const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           att.date.includes(searchTerm) ||
           att.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'All' || department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  }).map(att => {
    // Ensure employee data is present
    const employee = employees.find(emp => (emp._id || emp.id) === att.employeeId);
    
    // Recalculate metrics if they're missing or zero
    let metrics = {
      hoursWorked: att.hoursWorked,
      late: att.late,
      overtime: att.overtime,
      undertime: att.undertime,
      status: att.status
    };
    
    // If metrics are missing or invalid, recalculate them
    if (att.timeIn && att.timeOut && (!att.hoursWorked || att.hoursWorked === '0' || att.hoursWorked === 0)) {
      metrics = calculateAttendanceMetrics(att.timeIn, att.timeOut);
    }
    
    return {
      ...att,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : att.employeeName || 'Unknown',
      department: employee ? employee.department : att.department || 'N/A',
      hoursWorked: metrics.hoursWorked || att.hoursWorked || '0',
      late: metrics.late || att.late || '0',
      overtime: metrics.overtime || att.overtime || '0',
      undertime: metrics.undertime || att.undertime || '0',
      status: metrics.status || att.status || 'Present'
    };
  });

  return (
    <div>
      <div className="page-header">
        <div className="header-actions">
          <select
            className="search-input"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{ width: '200px', marginRight: '10px' }}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search attendance..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-info" onClick={() => setIsReportModalOpen(true)} style={{ marginRight: '10px' }}>
            <i className="fas fa-file-pdf"></i> Export to PDF
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Record Attendance
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Late</th>
                <th>OT</th>
                <th>UT</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>
                    No attendance records found
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(attendance => {
                  return (
                    <tr key={attendance._id || attendance.id}>
                      <td>{attendance.employeeName}</td>
                      <td>{attendance.department}</td>
                      <td>{formatDate(attendance.date)}</td>
                      <td>{attendance.timeIn || '-'}</td>
                      <td>{attendance.timeOut || '-'}</td>
                      <td>{formatHours(attendance.hoursWorked || '0')}</td>
                      <td>
                        <span className={`badge badge-${
                          attendance.status === 'Present' ? 'success' :
                          attendance.status === 'Late' ? 'warning' :
                          attendance.status === 'Absent' ? 'danger' : 
                          attendance.status === 'Half Day' ? 'info' : 'secondary'
                        }`}>
                          {attendance.status || 'Present'}
                        </span>
                      </td>
                      <td>{formatHours(attendance.late || '0')}</td>
                      <td>{formatHours(attendance.overtime || '0')}</td>
                      <td>{formatHours(attendance.undertime || '0')}</td>
                      <td>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleCheckout(attendance)} 
                          title="Edit Check-out"
                        >
                          <i className="fas fa-sign-out-alt"></i>
                        </button>
                        <button className="btn-icon" onClick={() => handleView(attendance)} title="View">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(attendance._id || attendance.id)} title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record/View Attendance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAttendance ? 'View Attendance Record' : 'Record Attendance'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee *</label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              required
              disabled={editingAttendance}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.firstName} {emp.lastName} - {emp.department || 'No Department'}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              disabled={editingAttendance}
            />
          </div>
          
          {/* Absent Checkbox */}
          {!editingAttendance && (
            <div className="form-group" style={{ 
              padding: '15px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '8px',
              border: '1px solid #ffc107',
              marginBottom: '15px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  name="isAbsent"
                  checked={formData.isAbsent}
                  onChange={handleInputChange}
                  style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#856404' }}>
                  <i className="fas fa-user-times"></i> Mark as Absent
                </span>
              </label>
              <small style={{ display: 'block', marginTop: '5px', marginLeft: '28px', color: '#856404' }}>
                Check this if the employee was absent on this day (no time entry required)
              </small>
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group">
              <label>Time In * {!formData.isAbsent && '(Standard: 8:00 AM)'}</label>
              <input
                type="time"
                name="timeIn"
                value={formData.timeIn}
                onChange={handleInputChange}
                required={!formData.isAbsent}
                disabled={editingAttendance || formData.isAbsent}
                style={formData.isAbsent ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
              />
              {formData.isAbsent && (
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Time entry disabled for absent employees
                </small>
              )}
            </div>
            <div className="form-group">
              <label>Time Out * {!formData.isAbsent && '(Standard: 4:00 PM)'}</label>
              <input
                type="time"
                name="timeOut"
                value={formData.timeOut}
                onChange={handleInputChange}
                required={!formData.isAbsent}
                disabled={editingAttendance || formData.isAbsent}
                style={formData.isAbsent ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
              />
              {formData.isAbsent && (
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  Time entry disabled for absent employees
                </small>
              )}
            </div>
          </div>
          
          {/* Absent Status Display */}
          {!editingAttendance && formData.isAbsent && (
            <div style={{
              padding: '15px',
              backgroundColor: '#ffebee',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #f44336',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#d32f2f', fontSize: '16px' }}>
                <i className="fas fa-user-times"></i> Absent
              </h4>
              <p style={{ margin: '0', fontSize: '13px', color: '#d32f2f' }}>
                Employee will be marked as absent for this day
              </p>
            </div>
          )}
          
          {/* Auto-calculated Status Display */}
          {!editingAttendance && !formData.isAbsent && formData.timeIn && formData.timeOut && (
            <div style={{
              padding: '15px',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #2196F3'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1976D2', fontSize: '14px' }}>
                <i className="fas fa-calculator"></i> Auto-Calculated Metrics
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>
                  <strong>Status:</strong> <span className={`badge badge-${
                    formData.status === 'Present' ? 'success' :
                    formData.status === 'Late' ? 'warning' :
                    formData.status === 'Half Day' ? 'info' : 'secondary'
                  }`}>{formData.status}</span>
                </div>
                <div><strong>Hours Worked:</strong> {formatHours(formData.hoursWorked || '0')}</div>
                <div><strong>Late:</strong> {formatHours(formData.late || '0')}</div>
                <div><strong>Overtime:</strong> {formatHours(formData.overtime || '0')}</div>
                <div><strong>Undertime:</strong> {formatHours(formData.undertime || '0')}</div>
              </div>
            </div>
          )}
          
          {editingAttendance && (
            <>
              <div className="form-group">
                <label>Status</label>
                <input
                  type="text"
                  value={formData.status}
                  disabled
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Hours Worked</label>
                  <input
                    type="text"
                    value={formatHours(formData.hoursWorked || '0')}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
                <div className="form-group">
                  <label>Late</label>
                  <input
                    type="text"
                    value={formatHours(formData.late || '0')}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Overtime</label>
                  <input
                    type="text"
                    value={formatHours(formData.overtime || '0')}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
                <div className="form-group">
                  <label>Undertime</label>
                  <input
                    type="text"
                    value={formatHours(formData.undertime || '0')}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              {editingAttendance ? 'Close' : 'Cancel'}
            </button>
            {!editingAttendance && (
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-check"></i> {formData.isAbsent ? 'Record Absence' : 'Record Attendance'}
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Check-out Edit Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={handleCloseCheckoutModal}
        title="Edit Check-out Time"
      >
        {checkoutRecord && (
          <>
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Employee:</strong> {checkoutRecord.employeeName}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Date:</strong> {formatDate(checkoutRecord.date)}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Time In:</strong> {checkoutRecord.timeIn}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Current Time Out:</strong> {checkoutRecord.timeOut || 'Not set'}
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              <div className="form-group">
                <label>New Check-out Time * (Standard: 4:00 PM)</label>
                <input
                  type="time"
                  name="timeOut"
                  value={checkoutData.timeOut}
                  onChange={handleCheckoutChange}
                  required
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                  Hours beyond 4:00 PM will be counted as overtime
                </small>
              </div>

              <div style={{ 
                padding: '15px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '8px', 
                marginTop: '15px',
                border: '1px solid #ffc107'
              }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#856404' }}>
                  <i className="fas fa-info-circle"></i> <strong>Note:</strong> Editing check-out time will automatically recalculate hours worked, overtime, undertime, late hours, and status based on the standard schedule (8:00 AM - 4:00 PM, 8 hours).
                </p>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseCheckoutModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-check"></i> Update Check-out
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Generate PDF Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Export Monthly Attendance to PDF"
      >
        <div className="form-group">
          <label>Select Employee *</label>
          <select
            name="employeeId"
            value={reportConfig.employeeId}
            onChange={handleReportConfigChange}
            required
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id || emp.id} value={emp._id || emp.id}>
                {emp.firstName} {emp.lastName} - {emp.department || 'No Department'}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Select Month *</label>
          <input
            type="month"
            name="month"
            value={reportConfig.month}
            onChange={handleReportConfigChange}
            required
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setIsReportModalOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={generatePDFReport}>
            <i className="fas fa-file-pdf"></i> Generate PDF
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;