import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';

const Employees = ({ showToast }) => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
  
  // Safety wrapper for showToast
  const safeShowToast = (message, type = 'info') => {
    if (typeof showToast === 'function') {
      safeShowToast(message, type);
    } else {
      // Fallback to console if showToast is not provided
      console.log(`[${type.toUpperCase()}]: ${message}`);
      alert(message);
    }
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [performanceAlerts, setPerformanceAlerts] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    birthplace: '',
    gender: '',
    maritalStatus: '',
    houseNo: '',
    street: '',
    barangay: '',
    city: '',
    municipality: '',
    department: '',
    position: '',
    basicSalary: '', // Changed from salary to basicSalary
    hireDate: '',
    employmentStatus: 'Regular',
    philhealthId: '',
    sssNo: '',
    tinNo: '',
    hdmfId: '',
    status: 'Active'
  });

  // State for tracking duplicate fields
  const [duplicateErrors, setDuplicateErrors] = useState({
    phone: false,
    email: false,
    name: false
  });

  // State for tracking locked/unlocked fields (for edit mode)
  const [lockedFields, setLockedFields] = useState({
    firstName: true,
    lastName: true,
    birthday: true,
    birthplace: true,
    gender: true,
    maritalStatus: true,
    hireDate: true,
    basicSalary: true,
    employmentStatus: true,
    philhealthId: true,
    sssNo: true,
    tinNo: true,
    hdmfId: true
  });

  // Check for 180-day performance evaluation on component mount and when employees change
  useEffect(() => {
    checkPerformanceEvaluations();
  }, [employees]);

  // Calculate days since hire date
  const calculateDaysSinceHire = (hireDate) => {
    if (!hireDate) return 0;
    const hire = new Date(hireDate);
    const today = new Date();
    const diffTime = Math.abs(today - hire);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format day(s) text
  const formatDays = (days) => {
    return days === 1 ? `${days} day` : `${days} days`;
  };

  // Check which employees need performance evaluation (180 days)
  const checkPerformanceEvaluations = () => {
    const alerts = employees
      .filter(emp => {
        const days = calculateDaysSinceHire(emp.hireDate);
        // Check if within 7 days of 180 days (173-187 days) and status is Active
        return days >= 173 && days <= 187 && emp.status === 'Active';
      })
      .map(emp => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        days: calculateDaysSinceHire(emp.hireDate),
        hireDate: emp.hireDate
      }));
    
    setPerformanceAlerts(alerts);
  };

  // Check for duplicate phone number
  const isDuplicatePhone = (phone, currentEmployeeId = null) => {
    return employees.some(emp => 
      emp.phone === phone && emp.id !== currentEmployeeId
    );
  };

  // Check for duplicate email
  const isDuplicateEmail = (email, currentEmployeeId = null) => {
    return employees.some(emp => 
      emp.email.toLowerCase() === email.toLowerCase() && emp.id !== currentEmployeeId
    );
  };

  // Check for duplicate name combination
  const isDuplicateName = (firstName, lastName, currentEmployeeId = null) => {
    return employees.some(emp => 
      emp.firstName.toLowerCase() === firstName.toLowerCase() && 
      emp.lastName.toLowerCase() === lastName.toLowerCase() && 
      emp.id !== currentEmployeeId
    );
  };

  // Capitalize first letter of each word
  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Capitalize first letter only
  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Format salary with commas (e.g., 25000 -> 25,000)
  const formatSalaryWithCommas = (value) => {
    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Split by decimal point
    const parts = cleanValue.split('.');
    
    // Format the integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return formatted value (with decimal if exists)
    return parts.join('.');
  };

  // Remove commas from salary for storage
  const removeSalaryCommas = (value) => {
    return value.replace(/,/g, '');
  };

  // Calculate half month salary (basic salary × 15 days)
  const calculateHalfMonthSalary = (basicSalary) => {
    if (!basicSalary) return 0;
    const dailySalary = parseFloat(removeSalaryCommas(basicSalary));
    return (dailySalary * 15).toFixed(2);
  };

  // Calculate monthly salary (basic salary × 30 days)
  const calculateMonthlySalary = (basicSalary) => {
    if (!basicSalary) return 0;
    const dailySalary = parseFloat(removeSalaryCommas(basicSalary));
    return (dailySalary * 30).toFixed(2);
  };

  // Toggle lock/unlock for specific field
  const toggleFieldLock = (fieldName) => {
    setLockedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Helper function to render lock toggle button (icon only - cleaner UI)
  const renderLockToggle = (fieldName) => {
    if (!editingEmployee || !formData[fieldName]) return null;
    
    return (
      <button
        type="button"
        onClick={() => toggleFieldLock(fieldName)}
        style={{
          marginLeft: '8px',
          padding: '4px 8px',
          fontSize: '0.85rem',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          background: 'transparent',
          color: lockedFields[fieldName] ? '#dc3545' : '#28a745',
          transition: 'all 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={lockedFields[fieldName] ? 'Click to unlock and edit' : 'Click to lock'}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <i className={`fas fa-${lockedFields[fieldName] ? 'lock' : 'lock-open'}`}></i>
      </button>
    );
  };

  // Get position choices based on department
  const getPositionChoices = (department) => {
    const positions = {
      'HR': ['HR Staff'],
      'Treasury': ['Treasury Staff', 'Treasury Manager'],
      'Accounting': ['Accounting Staff', 'Accounting Manager'],
      'Employee': ['Driver', 'Runner', 'Technician']
    };
    return positions[department] || [];
  };

  // Reset position when department changes
  const handleDepartmentChange = (e) => {
    const newDepartment = e.target.value;
    setFormData(prev => ({
      ...prev,
      department: newDepartment,
      position: '' // Reset position when department changes
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    const currentEmployeeId = editingEmployee ? editingEmployee.id : null;
    
    // Phone number validation - only accept numbers
    if (name === 'phone') {
      // Remove all non-numeric characters
      const numbersOnly = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      
      // Check for duplicate phone (only if 11 digits)
      if (numbersOnly.length === 11) {
        const isDupe = isDuplicatePhone(numbersOnly, currentEmployeeId);
        setDuplicateErrors(prev => ({ ...prev, phone: isDupe }));
      } else {
        setDuplicateErrors(prev => ({ ...prev, phone: false }));
      }
    }
    // Government IDs - only accept numbers
    else if (name === 'philhealthId' || name === 'sssNo' || name === 'tinNo' || name === 'hdmfId') {
      // Remove all non-numeric characters
      const numbersOnly = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
    }
    // Basic Salary - format with commas as user types
    else if (name === 'basicSalary') {
      const formatted = formatSalaryWithCommas(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Auto-capitalize first name and last name (each word)
    else if (name === 'firstName' || name === 'lastName') {
      setFormData(prev => ({ ...prev, [name]: capitalizeWords(value) }));
      
      // Check for duplicate name combination
      const firstName = name === 'firstName' ? capitalizeWords(value) : formData.firstName;
      const lastName = name === 'lastName' ? capitalizeWords(value) : formData.lastName;
      
      if (firstName && lastName) {
        const isDupe = isDuplicateName(firstName, lastName, currentEmployeeId);
        setDuplicateErrors(prev => ({ ...prev, name: isDupe }));
      } else {
        setDuplicateErrors(prev => ({ ...prev, name: false }));
      }
    }
    // Auto-capitalize position (each word)
    else if (name === 'position') {
      setFormData(prev => ({ ...prev, [name]: capitalizeWords(value) }));
    }
    // Auto-capitalize birthplace (each word)
    else if (name === 'birthplace') {
      setFormData(prev => ({ ...prev, [name]: capitalizeWords(value) }));
    }
    // Auto-capitalize address fields (each word)
    else if (name === 'street' || name === 'barangay' || name === 'city' || name === 'municipality') {
      setFormData(prev => ({ ...prev, [name]: capitalizeWords(value) }));
    }
    // House number - capitalize first letter
    else if (name === 'houseNo') {
      setFormData(prev => ({ ...prev, [name]: capitalizeFirst(value) }));
    }
    // Keep email lowercase for consistency
    else if (name === 'email') {
      const lowerEmail = value.toLowerCase();
      setFormData(prev => ({ ...prev, [name]: lowerEmail }));
      
      // Check for duplicate email
      const isDupe = isDuplicateEmail(lowerEmail, currentEmployeeId);
      setDuplicateErrors(prev => ({ ...prev, email: isDupe }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate phone number length (Exactly 11 digits)
    if (formData.phone.length !== 11) {
      safeShowToast('Phone number must be exactly 11 digits', 'error');
      return;
    }

    // Check for duplicate phone number
    const currentEmployeeId = editingEmployee ? editingEmployee.id : null;
    if (isDuplicatePhone(formData.phone, currentEmployeeId)) {
      safeShowToast('This phone number is already registered to another employee', 'error');
      return;
    }

    // Check for duplicate email
    if (isDuplicateEmail(formData.email, currentEmployeeId)) {
      safeShowToast('This email address is already registered to another employee', 'error');
      return;
    }

    // Check for duplicate name
    if (isDuplicateName(formData.firstName, formData.lastName, currentEmployeeId)) {
      safeShowToast('An employee with this exact name already exists', 'error');
      return;
    }

    // Calculate age from birthday
    const birthDate = new Date(formData.birthday);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age;
    
    // Check if employee is at least 18 years old
    if (actualAge < 18) {
      safeShowToast('Employee must be at least 18 years old', 'error');
      return;
    }

    // Remove commas from basic salary before saving
    const dataToSave = {
      ...formData,
      basicSalary: removeSalaryCommas(formData.basicSalary),
      // For backward compatibility, also store as 'salary'
      salary: removeSalaryCommas(formData.basicSalary)
    };
    
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, dataToSave);
      safeShowToast('Employee updated successfully', 'success');
      // ✅ CLOSE MODAL AFTER UPDATE - NO AUTO VIEW
      handleCloseModal();
    } else {
      const savedEmployee = addEmployee(dataToSave);
      safeShowToast('Employee added successfully', 'success');
      
      // ✅ CLOSE EDIT MODAL
      handleCloseModal();
      
      // ✅ AUTOMATICALLY OPEN VIEW MODAL with saved employee (for new employees only)
      setTimeout(() => {
        setViewingEmployee(savedEmployee);
        setIsViewModalOpen(true);
      }, 300); // Small delay for smooth transition
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    // Format salary with commas when editing
    // Use basicSalary if available, otherwise fall back to salary
    const salaryValue = employee.basicSalary || employee.salary;
    const formattedEmployee = {
      ...employee,
      basicSalary: formatSalaryWithCommas(salaryValue.toString()),
      // Preserve all existing data including new fields
      gender: employee.gender || '',
      maritalStatus: employee.maritalStatus || '',
      employmentStatus: employee.employmentStatus || 'Regular',
      philhealthId: employee.philhealthId || '',
      sssNo: employee.sssNo || '',
      tinNo: employee.tinNo || '',
      hdmfId: employee.hdmfId || '',
      birthday: employee.birthday || '',
      hireDate: employee.hireDate || ''
    };
    setFormData(formattedEmployee);
    // Reset duplicate errors when opening edit modal
    setDuplicateErrors({ phone: false, email: false, name: false });
    // Reset locked fields - all personal info locked by default in edit mode
    setLockedFields({
      firstName: true,
      lastName: true,
      birthday: true,
      birthplace: true,
      gender: true,
      maritalStatus: true,
      hireDate: true,
      basicSalary: true,
      employmentStatus: true,
      philhealthId: true,
      sssNo: true,
      tinNo: true,
      hdmfId: true
    });
    setIsModalOpen(true);
  };

  const handleView = (employee) => {
    setViewingEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(id);
      safeShowToast('Employee deleted successfully', 'success');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthday: '',
      birthplace: '',
      gender: '',
      maritalStatus: '',
      houseNo: '',
      street: '',
      barangay: '',
      city: '',
      municipality: '',
      department: '',
      position: '',
      basicSalary: '',
      hireDate: '',
      employmentStatus: 'Regular',
      philhealthId: '',
      sssNo: '',
      tinNo: '',
      hdmfId: '',
      status: 'Active'
    });
    // Reset duplicate errors when closing modal
    setDuplicateErrors({ phone: false, email: false, name: false });
    // Reset locked fields
    setLockedFields({
      firstName: true,
      lastName: true,
      birthday: true,
      birthplace: true,
      gender: true,
      maritalStatus: true,
      hireDate: true,
      basicSalary: true,
      employmentStatus: true,
      philhealthId: true,
      sssNo: true,
      tinNo: true,
      hdmfId: true
    });
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingEmployee(null);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'All' || emp.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments for filter dropdown
  const departments = ['All', ...new Set(employees.map(emp => emp.department).filter(Boolean))].sort();

  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return '-';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format complete address for display (single line)
  const formatAddress = (employee) => {
    const parts = [];
    if (employee.houseNo) parts.push(employee.houseNo);
    if (employee.street) parts.push(employee.street);
    if (employee.barangay) parts.push(employee.barangay);
    if (employee.city) parts.push(employee.city);
    if (employee.municipality) parts.push(employee.municipality);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  // Truncate text with ellipsis
  const truncateText = (text, maxLength = 30) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Format phone number for display (Philippine format: 0917-123-4567)
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    if (phone.length === 11) {
      return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get performance evaluation badge
  const getPerformanceEvaluationBadge = (hireDate) => {
    const days = calculateDaysSinceHire(hireDate);
    
    if (days >= 173 && days <= 187) {
      return (
        <span style={{
          display: 'inline-block',
          background: '#f72585',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          marginLeft: '8px',
          animation: 'pulse 2s infinite'
        }}>
          📋 Evaluation Due!
        </span>
      );
    }
    return null;
  };

  // Get salary value (backward compatible)
  const getSalaryValue = (employee) => {
    return employee.basicSalary || employee.salary || 0;
  };

  return (
    <div>
      {/* ===== PERFORMANCE EVALUATION ALERTS ===== */}
      {performanceAlerts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
          border: '2px solid #f72585',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(247, 37, 133, 0.2)'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#f72585',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-clipboard-check" style={{ fontSize: '1.3rem' }}></i>
            Performance Evaluation Alert - 180 Day(s)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {performanceAlerts.map(alert => (
              <div key={alert.id} style={{
                background: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <strong style={{ color: '#212529', fontSize: '1rem' }}>{alert.name}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6c757d' }}>
                    Hired: {formatDate(alert.hireDate)} • 
                    <span style={{ fontWeight: '600', color: '#f72585' }}> {formatDays(alert.days)} ago</span>
                  </p>
                </div>
                <button 
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  onClick={() => {
                    const employee = employees.find(e => e.id === alert.id);
                    if (employee) handleView(employee);
                  }}
                >
                  <i className="fas fa-clipboard-check"></i> Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-header">
        <h2>Employee Management</h2>
        <div className="header-actions">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="department-filter"
            style={{
              padding: '0.5rem 2rem 0.5rem 0.75rem',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              backgroundColor: 'white',
              cursor: 'pointer',
              marginRight: '0.5rem',
              minWidth: '180px'
            }}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search employees..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Add Employee
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Age</th>
                <th>Department</th>
                <th>Position</th>
                <th>Day(s) Employed</th>
                <th>Daily Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                    <i className="fas fa-inbox" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }}></i>
                    <p style={{ color: '#999', fontSize: '1rem' }}>No employees found</p>
                    <small style={{ color: '#bbb' }}>Add your first employee to get started</small>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(employee => {
                  const daysEmployed = calculateDaysSinceHire(employee.hireDate);
                  const needsEvaluation = daysEmployed >= 173 && daysEmployed <= 187;
                  
                  return (
                    <tr key={employee.id} style={needsEvaluation ? { background: '#fff3e0' } : {}}>
                      {/* Name Column */}
                      <td>
                        <strong style={{ color: '#212529' }}>
                          {employee.firstName} {employee.lastName}
                        </strong>
                        {needsEvaluation && getPerformanceEvaluationBadge(employee.hireDate)}
                      </td>

                      {/* Contact Column (Email + Phone) */}
                      <td>
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                          <div title={employee.email}>
                            <i className="fas fa-envelope" style={{ color: '#4361ee', marginRight: '4px' }}></i>
                            {truncateText(employee.email, 20)}
                          </div>
                          <div>
                            <i className="fas fa-phone" style={{ color: '#28a745', marginRight: '4px' }}></i>
                            {formatPhoneNumber(employee.phone)}
                          </div>
                        </div>
                      </td>

                      {/* Address Column (Clickable) */}
                      <td>
                        <div 
                          style={{ 
                            fontSize: '0.85rem', 
                            cursor: 'pointer',
                            color: '#4361ee',
                            textDecoration: 'underline',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => handleView(employee)}
                          title="Click to view full details"
                        >
                          <i className="fas fa-map-marker-alt"></i>
                          {truncateText(formatAddress(employee), 25)}
                        </div>
                      </td>

                      {/* Age Column */}
                      <td>
                        <span style={{ fontWeight: '500' }}>
                          {calculateAge(employee.birthday)} yr(s)
                        </span>
                      </td>

                      {/* Department Column */}
                      <td>
                        <span className="badge badge-info">{employee.department}</span>
                      </td>

                      {/* Position Column */}
                      <td>{truncateText(employee.position, 20)}</td>

                      {/* Day(s) Employed Column */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ 
                            fontWeight: needsEvaluation ? '700' : '500',
                            color: needsEvaluation ? '#f72585' : '#212529',
                            fontSize: '0.95rem'
                          }}>
                            {formatDays(daysEmployed)}
                          </span>
                          {needsEvaluation && (
                            <small style={{ 
                              color: '#f72585', 
                              fontWeight: '600',
                              fontSize: '0.7rem'
                            }}>
                              ⚠️ ~180 day(s)
                            </small>
                          )}
                        </div>
                      </td>

                      {/* Salary Column */}
                      <td style={{ fontWeight: '600' }}>₱{parseFloat(getSalaryValue(employee)).toLocaleString()}</td>

                      {/* Status Column */}
                      <td>
                        <span className={`badge badge-${employee.status === 'Active' ? 'success' : employee.status === 'On Leave' ? 'warning' : 'danger'}`}>
                          {employee.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleView(employee)}
                          title="View Details"
                          style={{ marginRight: '5px', color: '#4361ee' }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleEdit(employee)}
                          title="Edit Employee"
                          style={{ marginRight: '5px' }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleDelete(employee.id)}
                          title="Delete Employee"
                          style={{ color: '#e63946' }}
                        >
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

      {/* ===== VIEW EMPLOYEE MODAL (Read-Only) ===== */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Employee Details"
      >
        {viewingEmployee && (
          <div style={{ padding: '1rem' }}>
            {/* Performance Evaluation Warning */}
            {(() => {
              const days = calculateDaysSinceHire(viewingEmployee.hireDate);
              if (days >= 173 && days <= 187 && viewingEmployee.status === 'Active') {
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #f72585 0%, #e63946 100%)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 12px rgba(247, 37, 133, 0.3)',
                    animation: 'pulse 2s infinite'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem' }}></i>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700' }}>
                          Performance Evaluation Required!
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.95 }}>
                          This employee has been employed for <strong>{formatDays(days)}</strong> (approximately 6 months).
                          Please conduct their performance evaluation.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Employment Duration Info */}
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              borderLeft: '4px solid #4361ee'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem', display: 'block' }}>
                    Employment Duration
                  </label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: '700', color: '#4361ee' }}>
                    {formatDays(calculateDaysSinceHire(viewingEmployee.hireDate))}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem', display: 'block' }}>
                    Hire Date
                  </label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '600', color: '#212529' }}>
                    {formatDate(viewingEmployee.hireDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#4361ee',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0.5rem'
              }}>
                <i className="fas fa-user-circle"></i> Personal Information
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Full Name</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.firstName} {viewingEmployee.lastName}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Birthday</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {formatDate(viewingEmployee.birthday)} ({calculateAge(viewingEmployee.birthday)} year(s) old)
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Birthplace</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.birthplace || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Gender</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.gender || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Marital Status</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.maritalStatus || '-'}
                  </p>
                </div>
              </div>

              {/* Government IDs Section in View Modal */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #7209b7'
              }}>
                <h5 style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: '#7209b7',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="fas fa-id-card"></i> Government IDs
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>PhilHealth ID</label>
                    <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                      {viewingEmployee.philhealthId || '-'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>SSS No.</label>
                    <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                      {viewingEmployee.sssNo || '-'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>TIN No.</label>
                    <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                      {viewingEmployee.tinNo || '-'}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>HDMF ID (Pag-IBIG)</label>
                    <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                      {viewingEmployee.hdmfId || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#f72585',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0.5rem'
              }}>
                <i className="fas fa-map-marker-alt"></i> Address
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>House/Lot No.</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.houseNo || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Street</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.street || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Barangay</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.barangay || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>City</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.city || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Municipality/Province</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.municipality || '-'}
                  </p>
                </div>
              </div>
              
              {/* Full Address Display */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #f72585'
              }}>
                <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Complete Address</label>
                <p style={{ margin: '4px 0', fontSize: '0.95rem', color: '#212529' }}>
                  {formatAddress(viewingEmployee)}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#4cc9f0',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0.5rem'
              }}>
                <i className="fas fa-address-book"></i> Contact Information
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Email Address</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.email || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Phone Number</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {formatPhoneNumber(viewingEmployee.phone)}
                  </p>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#28a745',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0.5rem'
              }}>
                <i className="fas fa-briefcase"></i> Employment Information
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Department</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    <span className="badge badge-info">{viewingEmployee.department || '-'}</span>
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Position</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {viewingEmployee.position || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Basic Salary (Daily Rate)</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#4361ee', fontWeight: '600' }}>
                    ₱{parseFloat(getSalaryValue(viewingEmployee)).toLocaleString()} / day
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Half Month Salary (15 days)</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#28a745', fontWeight: '600' }}>
                    ₱{parseFloat(calculateHalfMonthSalary(getSalaryValue(viewingEmployee).toString())).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Monthly Salary (30 days)</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#28a745', fontWeight: '600' }}>
                    ₱{parseFloat(calculateMonthlySalary(getSalaryValue(viewingEmployee).toString())).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Hire Date</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    {formatDate(viewingEmployee.hireDate)}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Employment Status</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    <span className="badge badge-info">
                      {viewingEmployee.employmentStatus || 'Regular'}
                    </span>
                  </p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '600', color: '#6c757d', fontSize: '0.85rem' }}>Activity Status</label>
                  <p style={{ margin: '4px 0', fontSize: '1rem', color: '#212529' }}>
                    <span className={`badge badge-${viewingEmployee.status === 'Active' ? 'success' : viewingEmployee.status === 'On Leave' ? 'warning' : 'danger'}`}>
                      {viewingEmployee.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleCloseViewModal}
                style={{ minWidth: '150px' }}
              >
                <i className="fas fa-times"></i> Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== ADD/EDIT EMPLOYEE MODAL ===== */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      >
        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 5px' }}>
          
          {/* ===== PERSONAL INFORMATION SECTION ===== */}
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)', 
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#4361ee', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-user-circle"></i> Personal Information
            </h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>
                  First Name *
                  {renderLockToggle('firstName')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Juan"
                    required
                    disabled={editingEmployee && formData.firstName && lockedFields.firstName}
                    style={{
                      borderColor: duplicateErrors.name ? '#dc3545' : (editingEmployee && formData.firstName && !lockedFields.firstName) ? '#28a745' : '',
                      paddingRight: duplicateErrors.name ? '40px' : '0.75rem',
                      backgroundColor: (editingEmployee && formData.firstName && lockedFields.firstName) ? '#f0f0f0' : 'white',
                      cursor: (editingEmployee && formData.firstName && lockedFields.firstName) ? 'not-allowed' : 'text'
                    }}
                  />
                  {duplicateErrors.name && (
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#dc3545',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>✗</span>
                  )}
                </div>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.7rem', 
                  color: duplicateErrors.name ? '#dc3545' : (editingEmployee && formData.firstName && lockedFields.firstName) ? '#dc3545' : (editingEmployee && formData.firstName && !lockedFields.firstName) ? '#28a745' : '#4361ee', 
                  marginTop: '4px',
                  fontStyle: 'italic',
                  fontWeight: duplicateErrors.name || (editingEmployee && formData.firstName) ? '600' : 'normal'
                }}>
                  {duplicateErrors.name 
                    ? '⚠️ This name already exists!' 
                    : (editingEmployee && formData.firstName && lockedFields.firstName)
                    ? '🔒 Locked - Click icon to unlock'
                    : (editingEmployee && formData.firstName && !lockedFields.firstName)
                    ? '🔓 Unlocked - Editable'
                    : '✨ Auto-capitalizes each word'}
                </small>
              </div>
              <div className="form-group">
                <label>
                  Last Name *
                  {renderLockToggle('lastName')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Dela Cruz"
                    required
                    disabled={editingEmployee && formData.lastName && lockedFields.lastName}
                    style={{
                      borderColor: duplicateErrors.name ? '#dc3545' : (editingEmployee && formData.lastName && !lockedFields.lastName) ? '#28a745' : '',
                      paddingRight: duplicateErrors.name ? '40px' : '0.75rem',
                      backgroundColor: (editingEmployee && formData.lastName && lockedFields.lastName) ? '#f0f0f0' : 'white',
                      cursor: (editingEmployee && formData.lastName && lockedFields.lastName) ? 'not-allowed' : 'text'
                    }}
                  />
                  {duplicateErrors.name && (
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#dc3545',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>✗</span>
                  )}
                </div>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.7rem', 
                  color: duplicateErrors.name ? '#dc3545' : (editingEmployee && formData.lastName && lockedFields.lastName) ? '#dc3545' : (editingEmployee && formData.lastName && !lockedFields.lastName) ? '#28a745' : '#4361ee', 
                  marginTop: '4px',
                  fontStyle: 'italic',
                  fontWeight: duplicateErrors.name || (editingEmployee && formData.lastName) ? '600' : 'normal'
                }}>
                  {duplicateErrors.name 
                    ? '⚠️ This name already exists!' 
                    : (editingEmployee && formData.lastName && lockedFields.lastName)
                    ? '🔒 Locked - Click icon to unlock'
                    : (editingEmployee && formData.lastName && !lockedFields.lastName)
                    ? '🔓 Unlocked - Editable'
                    : '✨ Auto-capitalizes each word'}
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Birthday *</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  required
                  disabled={editingEmployee && formData.birthday}
                  style={{
                    backgroundColor: (editingEmployee && formData.birthday) ? '#f0f0f0' : 'white',
                    cursor: (editingEmployee && formData.birthday) ? 'not-allowed' : 'text',
                    color: (editingEmployee && formData.birthday) ? '#495057' : 'inherit'
                  }}
                />
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: (editingEmployee && formData.birthday) ? '#dc3545' : '#6c757d', 
                  marginTop: '4px',
                  fontWeight: (editingEmployee && formData.birthday) ? '600' : 'normal'
                }}>
                  {(editingEmployee && formData.birthday) 
                    ? '🔒 Fixed - Cannot be changed after creation' 
                    : 'Employee must be at least 18 years old'}
                </small>
              </div>
              <div className="form-group">
                <label>
                  Birthplace 
                  {renderLockToggle('birthplace')}
                </label>
                <input
                  type="text"
                  name="birthplace"
                  value={formData.birthplace}
                  onChange={handleInputChange}
                  placeholder="Manila, Philippines"
                 
                  disabled={editingEmployee && formData.birthplace && lockedFields.birthplace}
                  style={{
                    backgroundColor: (editingEmployee && formData.birthplace && lockedFields.birthplace) ? '#f0f0f0' : 'white',
                    cursor: (editingEmployee && formData.birthplace && lockedFields.birthplace) ? 'not-allowed' : 'text',
                    borderColor: (editingEmployee && formData.birthplace && !lockedFields.birthplace) ? '#28a745' : ''
                  }}
                />
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.7rem', 
                  color: (editingEmployee && formData.birthplace && lockedFields.birthplace) ? '#dc3545' : (editingEmployee && formData.birthplace && !lockedFields.birthplace) ? '#28a745' : '#4361ee', 
                  marginTop: '4px',
                  fontStyle: 'italic',
                  fontWeight: (editingEmployee && formData.birthplace) ? '600' : 'normal'
                }}>
                  {(editingEmployee && formData.birthplace && lockedFields.birthplace)
                    ? '🔒 Locked - Click icon to unlock'
                    : (editingEmployee && formData.birthplace && !lockedFields.birthplace)
                    ? '🔓 Unlocked - Editable'
                    : '✨ Auto-capitalizes each word'}
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Gender 
                  {renderLockToggle('gender')}
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                 
                  disabled={editingEmployee && formData.gender && lockedFields.gender}
                  style={{
                    backgroundColor: (editingEmployee && formData.gender && lockedFields.gender) ? '#f0f0f0' : 'white',
                    cursor: (editingEmployee && formData.gender && lockedFields.gender) ? 'not-allowed' : 'pointer',
                    borderColor: (editingEmployee && formData.gender && !lockedFields.gender) ? '#28a745' : ''
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: (editingEmployee && formData.gender && lockedFields.gender) ? '#dc3545' : (editingEmployee && formData.gender && !lockedFields.gender) ? '#28a745' : '#6c757d', 
                  marginTop: '4px',
                  fontWeight: (editingEmployee && formData.gender) ? '600' : 'normal'
                }}>
                  {(editingEmployee && formData.gender && lockedFields.gender)
                    ? '🔒 Locked - Click icon to unlock'
                    : (editingEmployee && formData.gender && !lockedFields.gender)
                    ? '🔓 Unlocked - Editable'
                    : 'Required field'}
                </small>
              </div>
              <div className="form-group">
                <label>
                  Marital Status
                  {renderLockToggle('maritalStatus')}
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                 
                  disabled={editingEmployee && formData.maritalStatus && lockedFields.maritalStatus}
                  style={{
                    backgroundColor: (editingEmployee && formData.maritalStatus && lockedFields.maritalStatus) ? '#f0f0f0' : 'white',
                    cursor: (editingEmployee && formData.maritalStatus && lockedFields.maritalStatus) ? 'not-allowed' : 'pointer',
                    borderColor: (editingEmployee && formData.maritalStatus && !lockedFields.maritalStatus) ? '#28a745' : ''
                  }}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: (editingEmployee && formData.maritalStatus && lockedFields.maritalStatus) ? '#dc3545' : (editingEmployee && formData.maritalStatus && !lockedFields.maritalStatus) ? '#28a745' : '#6c757d', 
                  marginTop: '4px',
                  fontWeight: (editingEmployee && formData.maritalStatus) ? '600' : 'normal'
                }}>
                  {(editingEmployee && formData.maritalStatus && lockedFields.maritalStatus)
                    ? '🔒 Locked - Click icon to unlock'
                    : (editingEmployee && formData.maritalStatus && !lockedFields.maritalStatus)
                    ? '🔓 Unlocked - Editable'
                    : 'Required field'}
                </small>
              </div>
            </div>

            {/* Government IDs Section */}
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              border: '1px dashed #7209b7'
            }}>
              <h5 style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: '#7209b7',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fas fa-id-card"></i> Government IDs
              </h5>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    PhilHealth ID
                    {renderLockToggle('philhealthId')}
                  </label>
                  <input
                    type="text"
                    name="philhealthId"
                    value={formData.philhealthId}
                    onChange={handleInputChange}
                    placeholder="1234567890123" // Numbers only
                   
                    disabled={editingEmployee && formData.philhealthId && lockedFields.philhealthId}
                    style={{
                      backgroundColor: (editingEmployee && formData.philhealthId && lockedFields.philhealthId) ? '#f0f0f0' : 'white',
                      cursor: (editingEmployee && formData.philhealthId && lockedFields.philhealthId) ? 'not-allowed' : 'text',
                      borderColor: (editingEmployee && formData.philhealthId && !lockedFields.philhealthId) ? '#28a745' : ''
                    }}
                  />
                  <small style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    color: (editingEmployee && formData.philhealthId && lockedFields.philhealthId) ? '#dc3545' : (editingEmployee && formData.philhealthId && !lockedFields.philhealthId) ? '#28a745' : '#6c757d', 
                    marginTop: '4px',
                    fontWeight: (editingEmployee && formData.philhealthId) ? '600' : 'normal'
                  }}>
                    {(editingEmployee && formData.philhealthId && lockedFields.philhealthId)
                      ? '🔒 Locked - Click icon to unlock'
                      : (editingEmployee && formData.philhealthId && !lockedFields.philhealthId)
                      ? '🔓 Unlocked - Editable'
                      : 'Required field'}
                  </small>
                </div>
                <div className="form-group">
                  <label>
                    SSS No.
                    {renderLockToggle('sssNo')}
                  </label>
                  <input
                    type="text"
                    name="sssNo"
                    value={formData.sssNo}
                    onChange={handleInputChange}
                    placeholder="341234567" // Numbers only
                   
                    disabled={editingEmployee && formData.sssNo && lockedFields.sssNo}
                    style={{
                      backgroundColor: (editingEmployee && formData.sssNo && lockedFields.sssNo) ? '#f0f0f0' : 'white',
                      cursor: (editingEmployee && formData.sssNo && lockedFields.sssNo) ? 'not-allowed' : 'text',
                      borderColor: (editingEmployee && formData.sssNo && !lockedFields.sssNo) ? '#28a745' : ''
                    }}
                  />
                  <small style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    color: (editingEmployee && formData.sssNo && lockedFields.sssNo) ? '#dc3545' : (editingEmployee && formData.sssNo && !lockedFields.sssNo) ? '#28a745' : '#6c757d', 
                    marginTop: '4px',
                    fontWeight: (editingEmployee && formData.sssNo) ? '600' : 'normal'
                  }}>
                    {(editingEmployee && formData.sssNo && lockedFields.sssNo)
                      ? '🔒 Locked - Click icon to unlock'
                      : (editingEmployee && formData.sssNo && !lockedFields.sssNo)
                      ? '🔓 Unlocked - Editable'
                      : 'Required field'}
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    TIN No.
                    {renderLockToggle('tinNo')}
                  </label>
                  <input
                    type="text"
                    name="tinNo"
                    value={formData.tinNo}
                    onChange={handleInputChange}
                    placeholder="123456789000" // Numbers only
                   
                    disabled={editingEmployee && formData.tinNo && lockedFields.tinNo}
                    style={{
                      backgroundColor: (editingEmployee && formData.tinNo && lockedFields.tinNo) ? '#f0f0f0' : 'white',
                      cursor: (editingEmployee && formData.tinNo && lockedFields.tinNo) ? 'not-allowed' : 'text',
                      borderColor: (editingEmployee && formData.tinNo && !lockedFields.tinNo) ? '#28a745' : ''
                    }}
                  />
                  <small style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    color: (editingEmployee && formData.tinNo && lockedFields.tinNo) ? '#dc3545' : (editingEmployee && formData.tinNo && !lockedFields.tinNo) ? '#28a745' : '#6c757d', 
                    marginTop: '4px',
                    fontWeight: (editingEmployee && formData.tinNo) ? '600' : 'normal'
                  }}>
                    {(editingEmployee && formData.tinNo && lockedFields.tinNo)
                      ? '🔒 Locked - Click icon to unlock'
                      : (editingEmployee && formData.tinNo && !lockedFields.tinNo)
                      ? '🔓 Unlocked - Editable'
                      : 'Required field'}
                  </small>
                </div>
                <div className="form-group">
                  <label>
                    HDMF ID (Pag-IBIG)
                    {renderLockToggle('hdmfId')}
                  </label>
                  <input
                    type="text"
                    name="hdmfId"
                    value={formData.hdmfId}
                    onChange={handleInputChange}
                    placeholder="123456789012" // Numbers only
                   
                    disabled={editingEmployee && formData.hdmfId && lockedFields.hdmfId}
                    style={{
                      backgroundColor: (editingEmployee && formData.hdmfId && lockedFields.hdmfId) ? '#f0f0f0' : 'white',
                      cursor: (editingEmployee && formData.hdmfId && lockedFields.hdmfId) ? 'not-allowed' : 'text',
                      borderColor: (editingEmployee && formData.hdmfId && !lockedFields.hdmfId) ? '#28a745' : ''
                    }}
                  />
                  <small style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    color: (editingEmployee && formData.hdmfId && lockedFields.hdmfId) ? '#dc3545' : (editingEmployee && formData.hdmfId && !lockedFields.hdmfId) ? '#28a745' : '#6c757d', 
                    marginTop: '4px',
                    fontWeight: (editingEmployee && formData.hdmfId) ? '600' : 'normal'
                  }}>
                    {(editingEmployee && formData.hdmfId && lockedFields.hdmfId)
                      ? '🔒 Locked - Click icon to unlock'
                      : (editingEmployee && formData.hdmfId && !lockedFields.hdmfId)
                      ? '🔓 Unlocked - Editable'
                      : 'Required field'}
                  </small>
                </div>
              </div>
            </div>

            {/* ADDRESS FIELDS */}
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              border: '1px dashed #4361ee'
            }}>
              <h5 style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: '#4361ee',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fas fa-map-marker-alt"></i> Complete Address
              </h5>

              <div className="form-row">
                <div className="form-group">
                  <label>House/Lot No. *</label>
                  <input
                    type="text"
                    name="houseNo"
                    value={formData.houseNo}
                    onChange={handleInputChange}
                    placeholder="e.g., 123, Blk 4 Lot 5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Street *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="e.g., Sampaguita St."
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Barangay *</label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    placeholder="e.g., Barangay San Roque"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Quezon City"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Municipality/Province *</label>
                  <input
                    type="text"
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleInputChange}
                    placeholder="e.g., Metro Manila"
                    required
                  />
                </div>
              </div>

              {/* Address Preview */}
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '0.75rem', 
                background: 'rgba(67, 97, 238, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(67, 97, 238, 0.2)'
              }}>
                <small style={{ color: '#6c757d', fontWeight: '500' }}>📍 Address Preview:</small>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '0.85rem', 
                  color: '#212529',
                  fontWeight: '500'
                }}>
                  {formData.houseNo || '[House/Lot]'}
                  {formData.street ? `, ${formData.street}` : ', [Street]'}
                  {formData.barangay ? `, ${formData.barangay}` : ', [Barangay]'}
                  {formData.city ? `, ${formData.city}` : ', [City]'}
                  {formData.municipality ? `, ${formData.municipality}` : ', [Municipality]'}
                </p>
              </div>
            </div>
          </div>

          {/* ===== CONTACT INFORMATION SECTION ===== */}
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', 
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#f72585', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-address-book"></i> Contact Information
            </h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="juan.delacruz@email.com"
                    required
                    style={{
                      borderColor: duplicateErrors.email ? '#dc3545' : '',
                      paddingRight: duplicateErrors.email ? '40px' : '0.75rem'
                    }}
                  />
                  {duplicateErrors.email && (
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#dc3545',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>✗</span>
                  )}
                </div>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.7rem', 
                  color: duplicateErrors.email ? '#dc3545' : '#f72585', 
                  marginTop: '4px',
                  fontStyle: 'italic',
                  fontWeight: duplicateErrors.email ? '600' : 'normal'
                }}>
                  {duplicateErrors.email ? '⚠️ This email is already registered!' : '✨ Auto-converts to lowercase'}
                </small>
              </div>
              <div className="form-group">
                <label>Phone Number (11 digits) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="09171234567"
                    maxLength="11"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    style={{
                      borderColor: duplicateErrors.phone ? '#dc3545' : '',
                      paddingRight: duplicateErrors.phone ? '40px' : '0.75rem'
                    }}
                  />
                  {duplicateErrors.phone && (
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#dc3545',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>✗</span>
                  )}
                </div>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: duplicateErrors.phone ? '#dc3545' : (formData.phone.length === 11 ? '#28a745' : '#dc3545'), 
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  {duplicateErrors.phone 
                    ? '⚠️ This phone number is already registered!' 
                    : (formData.phone.length === 0 
                      ? '✨ Numbers only (Exactly 11 digits) • No duplicates allowed' 
                      : `${formData.phone.length}/11 digits ${formData.phone.length === 11 ? '✓' : '✗'}`
                    )
                  }
                </small>
              </div>
            </div>
          </div>

          {/* ===== EMPLOYMENT INFORMATION SECTION ===== */}
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', 
            borderRadius: '12px',
            border: '1px solid #e0e0e0'
          }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#4cc9f0', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-briefcase"></i> Employment Information
            </h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="HR">HR</option>
                  <option value="Treasury">Treasury</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <div className="form-group">
                <label>Position *</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.department}
                >
                  <option value="">Select Position</option>
                  {getPositionChoices(formData.department).map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.7rem', 
                  color: '#4cc9f0', 
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  {!formData.department ? '⚠️ Select department first' : '✨ Positions based on department'}
                </small>
              </div>
            </div>

            {/* SALARY SECTION WITH CALCULATIONS */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '8px',
              border: '2px solid #28a745'
            }}>
              <h5 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#28a745',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fas fa-money-bill-wave"></i> Salary Information
              </h5>

              <div className="form-group">
                <label>
                  Basic Salary (Daily Rate) *
                  {renderLockToggle('basicSalary')}
                </label>
                <input
                  type="text"
                  name="basicSalary"
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  placeholder="500.00"
                  required
                  disabled={editingEmployee && formData.basicSalary && lockedFields.basicSalary}
                  style={{
                    backgroundColor: (editingEmployee && formData.basicSalary && lockedFields.basicSalary) ? '#f0f0f0' : 'white',
                    cursor: (editingEmployee && formData.basicSalary && lockedFields.basicSalary) ? 'not-allowed' : 'text',
                    borderColor: (editingEmployee && formData.basicSalary && !lockedFields.basicSalary) ? '#28a745' : ''
                  }}
                />
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: (editingEmployee && formData.basicSalary && lockedFields.basicSalary) ? '#dc3545' : (editingEmployee && formData.basicSalary && !lockedFields.basicSalary) ? '#28a745' : '#28a745', 
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  {(editingEmployee && formData.basicSalary && lockedFields.basicSalary)
                    ? '🔒 Locked - Click icon to unlock'
                    : (editingEmployee && formData.basicSalary && !lockedFields.basicSalary)
                    ? '🔓 Unlocked - Editable'
                    : '✨ Enter daily wage • Auto-calculates half month (×15) and monthly (×30)'}
                </small>
              </div>

              {/* Salary Breakdown */}
              {formData.basicSalary && parseFloat(removeSalaryCommas(formData.basicSalary)) > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(40, 167, 69, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(40, 167, 69, 0.2)'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ 
                      fontSize: '0.75rem', 
                      color: '#6c757d', 
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      💵 Daily Rate
                    </label>
                    <p style={{
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#4361ee'
                    }}>
                      ₱{parseFloat(removeSalaryCommas(formData.basicSalary)).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ 
                        fontSize: '0.75rem', 
                        color: '#6c757d', 
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        💰 Half Month (15 days)
                      </label>
                      <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#28a745'
                      }}>
                        ₱{parseFloat(calculateHalfMonthSalary(formData.basicSalary)).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label style={{ 
                        fontSize: '0.75rem', 
                        color: '#6c757d', 
                        fontWeight: '600',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        💵 Monthly (30 days)
                      </label>
                      <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#28a745'
                      }}>
                        ₱{parseFloat(calculateMonthlySalary(formData.basicSalary)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <small style={{
                    display: 'block',
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    color: '#6c757d',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    ℹ️ Half Month = Daily Rate × 15 days | Monthly = Daily Rate × 30 days
                  </small>
                </div>
              )}
            </div>

            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Hire Date *</label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  disabled={editingEmployee && formData.hireDate}
                  style={{
                    backgroundColor: (editingEmployee && formData.hireDate) ? '#f0f0f0' : 'white',
                    cursor: (editingEmployee && formData.hireDate) ? 'not-allowed' : 'text',
                    color: (editingEmployee && formData.hireDate) ? '#495057' : 'inherit'
                  }}
                />
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: (editingEmployee && formData.hireDate) ? '#dc3545' : '#6c757d', 
                  marginTop: '4px',
                  fontWeight: (editingEmployee && formData.hireDate) ? '600' : 'normal'
                }}>
                  {(editingEmployee && formData.hireDate) 
                    ? '🔒 Fixed - Cannot be changed after creation' 
                    : 'Date employee was hired'}
                </small>
              </div>
              <div className="form-group">
                <label>
                  Employment Status
                  {renderLockToggle('employmentStatus')}
                </label>
                <select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleInputChange}
                 
                  disabled={editingEmployee && formData.employmentStatus && lockedFields.employmentStatus}
                  style={{
                    backgroundColor: (editingEmployee && formData.employmentStatus && lockedFields.employmentStatus) ? '#f0f0f0' : 'white',
                    cursor: (editingEmployee && formData.employmentStatus && lockedFields.employmentStatus) ? 'not-allowed' : 'pointer',
                    borderColor: (editingEmployee && formData.employmentStatus && !lockedFields.employmentStatus) ? '#28a745' : ''
                  }}
                >
                  <option value="Regular">Regular</option>
                  <option value="Probationary">Probationary</option>
                </select>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: (editingEmployee && formData.employmentStatus && lockedFields.employmentStatus) ? '#dc3545' : (editingEmployee && formData.employmentStatus && !lockedFields.employmentStatus) ? '#28a745' : '#6c757d', 
                  marginTop: '4px',
                  fontWeight: (editingEmployee && formData.employmentStatus) ? '600' : 'normal'
                }}>
                  {(editingEmployee && formData.employmentStatus && lockedFields.employmentStatus)
                    ? '🔒 Locked - Click icon to unlock'
                    : (editingEmployee && formData.employmentStatus && !lockedFields.employmentStatus)
                    ? '🔓 Unlocked - Editable'
                    : 'Regular or Probationary'}
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Activity Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                </select>
                <small style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  color: '#6c757d', 
                  marginTop: '4px'
                }}>
                  Current activity status (can be changed anytime)
                </small>
              </div>
            </div>
          </div>

          {/* ===== FORM FOOTER ===== */}
          <div className="modal-footer" style={{ 
            position: 'sticky', 
            bottom: 0, 
            background: 'white',
            padding: '1rem 0',
            borderTop: '1px solid #e9ecef',
            marginTop: '1rem'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCloseModal}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <i className={`fas fa-${editingEmployee ? 'save' : 'plus'}`}></i> 
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== INLINE STYLES ===== */}
      <style jsx>{`
        .badge-info {
          background-color: #7209b7;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .badge-warning {
          background-color: #f72585;
          color: white;
        }

        .btn-icon:hover {
          background-color: #f8f9fa;
          border-radius: 6px;
          transform: scale(1.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #212529;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #4361ee;
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .form-group input:disabled {
          opacity: 0.7;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Employees;