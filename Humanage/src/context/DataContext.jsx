// context/DataContext.jsx - FIXED VERSION with API Integration
import React, { createContext, useContext, useState, useEffect } from 'react';
import { employeesAPI, attendanceAPI, payrollAPI, performanceAPI } from '../services/api';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==================== FETCH DATA ON MOUNT ====================
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEmployees(),
        fetchAttendance(),
        fetchPayroll(),
        fetchPerformance()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== EMPLOYEES ====================
  const fetchEmployees = async (filters = {}) => {
    try {
      const response = await employeesAPI.getAll(filters);
      if (response.success) {
        setEmployees(response.data);
      }
      return response;
    } catch (err) {
      console.error('Error fetching employees:', err);
      throw err;
    }
  };

  const addEmployee = async (employeeData) => {
    try {
      setLoading(true);
      const response = await employeesAPI.create(employeeData);
      if (response.success) {
        setEmployees([...employees, response.data]);
        return { success: true, data: response.data };
      }
      return response;
    } catch (err) {
      console.error('Error adding employee:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateEmployee = async (id, updatedData) => {
    try {
      setLoading(true);
      const response = await employeesAPI.update(id, updatedData);
      if (response.success) {
        setEmployees(employees.map(emp => 
          emp._id === id ? response.data : emp
        ));
        return { success: true, data: response.data };
      }
      return response;
    } catch (err) {
      console.error('Error updating employee:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (id) => {
    try {
      setLoading(true);
      const response = await employeesAPI.delete(id);
      if (response.success) {
        setEmployees(employees.filter(emp => emp._id !== id));
        return { success: true };
      }
      return response;
    } catch (err) {
      console.error('Error deleting employee:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ==================== ATTENDANCE ====================
  const fetchAttendance = async (filters = {}) => {
    try {
      const response = await attendanceAPI.getAll(filters);
      if (response.success) {
        setAttendanceData(response.data);
      }
      return response;
    } catch (err) {
      console.error('Error fetching attendance:', err);
      throw err;
    }
  };

  const addAttendance = async (attendanceRecord) => {
    try {
      setLoading(true);
      const response = await attendanceAPI.create(attendanceRecord);
      if (response.success) {
        setAttendanceData([...attendanceData, response.data]);
        return { success: true, data: response.data };
      }
      return response;
    } catch (err) {
      console.error('Error adding attendance:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (id, updatedData) => {
    try {
      setLoading(true);
      const response = await attendanceAPI.update(id, updatedData);
      if (response.success) {
        setAttendanceData(attendanceData.map(att => 
          att._id === id ? response.data : att
        ));
        return { success: true, data: response.data };
      }
      return response;
    } catch (err) {
      console.error('Error updating attendance:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteAttendance = async (id) => {
    try {
      setLoading(true);
      const response = await attendanceAPI.delete(id);
      if (response.success) {
        setAttendanceData(attendanceData.filter(att => att._id !== id));
        return { success: true };
      }
      return response;
    } catch (err) {
      console.error('Error deleting attendance:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ==================== PAYROLL ====================
  const fetchPayroll = async (filters = {}) => {
    try {
      const response = await payrollAPI.getAll(filters);
      if (response.success) {
        setPayrollData(response.data);
      }
      return response;
    } catch (err) {
      console.error('Error fetching payroll:', err);
      throw err;
    }
  };

  const addPayroll = async (payrollRecord) => {
    try {
      setLoading(true);
      const response = await payrollAPI.create(payrollRecord);
      if (response.success) {
        setPayrollData([...payrollData, response.data]);
        return { success: true, data: response.data };
      }
      return response;
    } catch (err) {
      console.error('Error adding payroll:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updatePayroll = async (id, updatedData) => {
    try {
      setLoading(true);
      const response = await payrollAPI.update(id, updatedData);
      if (response.success) {
        setPayrollData(payrollData.map(pay => 
          pay._id === id ? response.data : pay
        ));
        return { success: true, data: response.data };
      }
      return response;
    } catch (err) {
      console.error('Error updating payroll:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deletePayroll = async (id) => {
    try {
      setLoading(true);
      const response = await payrollAPI.delete(id);
      if (response.success) {
        setPayrollData(payrollData.filter(pay => pay._id !== id));
        return { success: true };
      }
      return response;
    } catch (err) {
      console.error('Error deleting payroll:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ==================== PERFORMANCE ====================
  const fetchPerformance = async (filters = {}) => {
    try {
      const response = await performanceAPI.getAll(filters);
      if (response.success) {
        setPerformanceData(response.data);
      }
      return response;
    } catch (err) {
      console.error('Error fetching performance:', err);
      throw err;
    }
  };

  const addPerformance = async (performanceRecord) => {
    try {
      setLoading(true);
      const response = await performanceAPI.create(performanceRecord);
      if (response.success) {
        setPerformanceData([...performanceData, response.data]);
        return { success: true, data: response.data };
      }
      return response;
    } catch (err) {
      console.error('Error adding performance:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updatePerformance = async (id, updatedData) => {
    try {
      setLoading(true);
      const response = await performanceAPI.update(id, updatedData);
      if (response.success) {
        setPerformanceData(performanceData.map(perf => 
          perf._id === id ? response.data : perf
        ));
        return { success: true, data: response.data };
      }
      return response;
    } catch (err) {
      console.error('Error updating performance:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deletePerformance = async (id) => {
    try {
      setLoading(true);
      const response = await performanceAPI.delete(id);
      if (response.success) {
        setPerformanceData(performanceData.filter(perf => perf._id !== id));
        return { success: true };
      }
      return response;
    } catch (err) {
      console.error('Error deleting performance:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Data
    employees,
    attendanceData,
    payrollData,
    performanceData,
    loading,
    error,
    
    // Fetch methods
    fetchEmployees,
    fetchAttendance,
    fetchPayroll,
    fetchPerformance,
    fetchAllData,
    
    // Employee operations
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Attendance operations
    addAttendance,
    updateAttendance,
    deleteAttendance,
    
    // Payroll operations
    addPayroll,
    updatePayroll,
    deletePayroll,
    
    // Performance operations
    addPerformance,
    updatePerformance,
    deletePerformance
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};