import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const Payroll = () => {
  const { employees, payrollData, addPayroll, updatePayroll, deletePayroll } = useData();

  // ========== PHILIPPINE LABOR LAW CONSTANTS ==========
  const WORKING_DAYS_PER_HALF_MONTH = 13; // Half month = ~13 days
  const HOURS_PER_DAY = 8;
  const MINIMUM_DAILY_WAGE = 685; // NCR minimum wage
  
  // Overtime rates
  const OT_REGULAR = 1.25;
  const OT_REST_DAY = 1.30;
  const OT_HOLIDAY = 2.0;
  
  // Night differential
  const NIGHT_DIFF_RATE = 0.10; // 10% of hourly rate
  
  // Government contribution rates
  const SSS_RATE = 0.05;
  const SSS_CAP = 1350;
  const PHILHEALTH_RATE = 0.025;
  const PHILHEALTH_CAP = 2500;
  const PAGIBIG_RATE = 0.02;
  const PAGIBIG_CAP_LOW = 100;
  const PAGIBIG_CAP_HIGH = 200;
  const PAGIBIG_THRESHOLD = 5000;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [viewingPayroll, setViewingPayroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    department: '',
    position: '',
    period: '',
    periodMonth: '',
    periodRange: '',
    daysOfWork: '',
    
    // Auto-calculated fields (FROM EMPLOYEE DAILY RATE)
    dailyRate: 0, // ← FROM EMPLOYEE basicSalary
    hourlyRate: 0,
    basicSalary: 0, // Will be calculated as dailyRate × daysOfWork
    
    // Premium inputs
    nightDiffHrs: '',
    nightDiffAmt: 0,
    overtimeRegularHrs: '',
    overtimeRestDayHrs: '',
    overtimeHolidayHrs: '',
    overtimeHrs: 0,
    overtimeAmt: 0,
    holidayWorkedDays: '',
    restDayPremiums: 0,
    
    // Additional earnings
    allowances: '',
    bonus: '',
    
    // Deductions
    lateHours: '',
    lateDeduction: 0,
    absenceDays: '',
    absenceDeduction: 0,
    
    // Loans
    hdmfLoan: '',
    sssCalamityLoan: '',
    pagibigLoan: '',
    emergencyLoan: '',
    shortage: '',
    otherDeductions: '',
    
    // Auto-calculated government contributions
    grossPay: 0,
    sss: 0,
    philhealth: 0,
    pagibig: 0,
    withholdingTax: 0,
    taxableSalary: 0,
    totalDeductions: 0,
    netPay: 0,
    isBelowMinimum: false,
    
    status: 'Pending',
    notes: ''
  });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const formatCurrency = (value) => {
    return `₱${Number(value || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

  // ========== AUTOMATED CALCULATIONS ==========
  
  /**
   * 🤖 AUTO-CALCULATE: All rates (BASED ON EMPLOYEE DAILY RATE)
   */
  const calculateRates = (employee, daysOfWork) => {
    if (!employee) return {};
    
    // ✅ GET EMPLOYEE'S DAILY RATE (from Employee basicSalary)
    const dailyRate = Number(employee?.basicSalary || employee?.salary || 0);
    const hourlyRate = round2(dailyRate / HOURS_PER_DAY);
    
    // ✅ CALCULATE BASIC SALARY = Daily Rate × Days Worked
    const days = Number(daysOfWork) || 0;
    const basicSalary = round2(dailyRate * days);
    
    return {
      dailyRate,      // From employee record
      hourlyRate,     // Daily ÷ 8
      basicSalary     // Daily × Days Worked
    };
  };

  const calculateNightDiff = (hours, hourlyRate) => {
    const hrs = Number(hours || 0);
    if (hrs === 0) return 0;
    return round2(hrs * hourlyRate * NIGHT_DIFF_RATE);
  };

  const calculateOvertime = (regularHrs, restDayHrs, holidayHrs, hourlyRate) => {
    const regular = Number(regularHrs || 0) * hourlyRate * OT_REGULAR;
    const restDay = Number(restDayHrs || 0) * hourlyRate * OT_REST_DAY;
    const holiday = Number(holidayHrs || 0) * hourlyRate * OT_HOLIDAY;
    
    const totalHrs = Number(regularHrs || 0) + Number(restDayHrs || 0) + Number(holidayHrs || 0);
    const totalAmt = round2(regular + restDay + holiday);
    
    return { overtimeHrs: totalHrs, overtimeAmt: totalAmt };
  };

  const calculateRestDayPremiums = (holidayDays, dailyRate) => {
    const days = Number(holidayDays || 0);
    if (days === 0) return 0;
    return round2(days * dailyRate * 2.0);
  };

  const calculateLateDeduction = (lateHours, hourlyRate) => {
    const hrs = Number(lateHours || 0);
    if (hrs === 0) return 0;
    return round2(hrs * hourlyRate);
  };

  const calculateAbsenceDeduction = (absenceDays, dailyRate) => {
    const days = Number(absenceDays || 0);
    if (days === 0) return 0;
    return round2(days * dailyRate);
  };

  const calculateSSS = (grossPay) => {
    if (!grossPay || grossPay <= 0) return 0;
    return round2(Math.min(grossPay * SSS_RATE, SSS_CAP));
  };

  const calculatePhilHealth = (grossPay) => {
    if (!grossPay || grossPay <= 0) return 0;
    return round2(Math.min(grossPay * PHILHEALTH_RATE, PHILHEALTH_CAP));
  };

  const calculatePagIBIG = (grossPay) => {
    if (!grossPay || grossPay <= 0) return 0;
    const contribution = grossPay * PAGIBIG_RATE;
    const cap = grossPay <= PAGIBIG_THRESHOLD ? PAGIBIG_CAP_LOW : PAGIBIG_CAP_HIGH;
    return round2(Math.min(contribution, cap));
  };

  const calculateWithholdingTax = (taxableIncome, isBelowMinimum) => {
    if (isBelowMinimum) return 0;
    
    const taxable = Number(taxableIncome || 0);
    
    if (taxable <= 20833) return 0;
    if (taxable <= 33332) return round2((taxable - 20833) * 0.20);
    if (taxable <= 66666) return round2(2500 + (taxable - 33333) * 0.25);
    if (taxable <= 166666) return round2(10833.33 + (taxable - 66667) * 0.30);
    if (taxable <= 666666) return round2(40833.33 + (taxable - 166667) * 0.32);
    return round2(200833.33 + (taxable - 666667) * 0.35);
  };

  /**
   * 🤖 MASTER AUTO-CALCULATE
   */
  const autoCalculatePayroll = (data) => {
    const employee = employees.find(emp => (emp._id || emp.id) === data.employeeId);
    if (!employee) return data;

    // ✅ CALCULATE BASED ON EMPLOYEE DAILY RATE
    const rates = calculateRates(employee, data.daysOfWork);
    
    const nightDiffAmt = calculateNightDiff(data.nightDiffHrs, rates.hourlyRate);
    const { overtimeHrs, overtimeAmt } = calculateOvertime(
      data.overtimeRegularHrs,
      data.overtimeRestDayHrs,
      data.overtimeHolidayHrs,
      rates.hourlyRate
    );
    const restDayPremiums = calculateRestDayPremiums(data.holidayWorkedDays, rates.dailyRate);
    
    const allowances = Number(data.allowances || 0);
    const bonus = Number(data.bonus || 0);
    
    // ✅ GROSS PAY = (Daily Rate × Days) + Premiums + Allowances
    const grossPay = round2(
      rates.basicSalary + nightDiffAmt + overtimeAmt + restDayPremiums + allowances
    );
    
    const lateDeduction = calculateLateDeduction(data.lateHours, rates.hourlyRate);
    const absenceDeduction = calculateAbsenceDeduction(data.absenceDays, rates.dailyRate);
    
    const adjustedGross = round2(grossPay - lateDeduction - absenceDeduction);
    
    const sss = calculateSSS(adjustedGross);
    const philhealth = calculatePhilHealth(adjustedGross);
    const pagibig = calculatePagIBIG(adjustedGross);
    
    const taxableSalary = round2(adjustedGross - sss - philhealth - pagibig);
    const isBelowMinimum = rates.dailyRate < MINIMUM_DAILY_WAGE;
    const withholdingTax = calculateWithholdingTax(taxableSalary, isBelowMinimum);
    
    const hdmfLoan = Number(data.hdmfLoan || 0);
    const sssCalamityLoan = Number(data.sssCalamityLoan || 0);
    const pagibigLoan = Number(data.pagibigLoan || 0);
    const emergencyLoan = Number(data.emergencyLoan || 0);
    const shortage = Number(data.shortage || 0);
    const otherDeductions = Number(data.otherDeductions || 0);
    
    const totalDeductions = round2(
      sss + philhealth + pagibig + withholdingTax +
      lateDeduction + absenceDeduction +
      hdmfLoan + sssCalamityLoan + pagibigLoan +
      emergencyLoan + shortage + otherDeductions
    );
    
    const totalEarnings = round2(grossPay + bonus);
    const netPay = round2(totalEarnings - totalDeductions);

    return {
      ...data,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      department: employee.department,
      position: employee.position,
      ...rates,
      nightDiffAmt,
      overtimeHrs,
      overtimeAmt,
      restDayPremiums,
      grossPay,
      lateDeduction,
      absenceDeduction,
      sss,
      philhealth,
      pagibig,
      withholdingTax,
      taxableSalary,
      totalDeductions,
      netPay,
      isBelowMinimum
    };
  };

  // ========== AUTO-RECALCULATE ==========
  useEffect(() => {
    if (formData.employeeId && employees.length > 0) {
      const calculated = autoCalculatePayroll(formData);
      
      // Only update if meaningful values changed (avoid infinite loop)
      const hasChanges = 
        calculated.grossPay !== formData.grossPay ||
        calculated.netPay !== formData.netPay ||
        calculated.basicSalary !== formData.basicSalary ||
        calculated.dailyRate !== formData.dailyRate;
      
      if (hasChanges) {
        setFormData(calculated);
      }
    }
  }, [
    employees,
    formData.employeeId,
    formData.daysOfWork,
    formData.nightDiffHrs,
    formData.overtimeRegularHrs,
    formData.overtimeRestDayHrs,
    formData.overtimeHolidayHrs,
    formData.holidayWorkedDays,
    formData.allowances,
    formData.bonus,
    formData.lateHours,
    formData.absenceDays,
    formData.hdmfLoan,
    formData.sssCalamityLoan,
    formData.pagibigLoan,
    formData.emergencyLoan,
    formData.shortage,
    formData.otherDeductions
  ]);

  // ========== EVENT HANDLERS ==========

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeId) {
      showToast('Please select an employee', 'error');
      return;
    }

    if (!formData.period || formData.period.trim() === '') {
      showToast('Please enter the pay period', 'error');
      return;
    }

    const daysOfWorkNum = Number(formData.daysOfWork);
    if (!formData.daysOfWork || isNaN(daysOfWorkNum) || daysOfWorkNum <= 0) {
      showToast('Please enter valid days of work (must be greater than 0)', 'error');
      return;
    }

    const isDuplicate = payrollData.some(p =>
      p.employeeId === formData.employeeId &&
      p.period === formData.period &&
      (p._id || p.id) !== (editingPayroll?._id || editingPayroll?.id)
    );

    if (isDuplicate) {
      showToast('Duplicate payroll! This employee already has a payroll record for this period.', 'error');
      return;
    }

    const payrollRecord = {
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      department: formData.department,
      position: formData.position,
      period: formData.period.trim(),
      daysOfWork: daysOfWorkNum,
      basicSalary: Number(formData.basicSalary || 0),
      ratePerDay: Number(formData.dailyRate || 0),
      nightDiffHrs: Number(formData.nightDiffHrs || 0),
      nightDiffAmt: Number(formData.nightDiffAmt || 0),
      overtimeHrs: Number(formData.overtimeHrs || 0),
      overtimeAmt: Number(formData.overtimeAmt || 0),
      restDayPremiums: Number(formData.restDayPremiums || 0),
      grossPay: Number(formData.grossPay || 0),
      sss: Number(formData.sss || 0),
      philhealth: Number(formData.philhealth || 0),
      pagibig: Number(formData.pagibig || 0),
      withholdingTax: Number(formData.withholdingTax || 0),
      taxableSalary: Number(formData.taxableSalary || 0),
      hdmfLoan: Number(formData.hdmfLoan || 0),
      sssCalamityLoan: Number(formData.sssCalamityLoan || 0),
      pagibigLoan: Number(formData.pagibigLoan || 0),
      emergencyLoan: Number(formData.emergencyLoan || 0),
      shortage: Number(formData.shortage || 0),
      otherDeductions: Number(formData.otherDeductions || 0),
      totalDeductions: Number(formData.totalDeductions || 0),
      netPay: Number(formData.netPay || 0),
      isBelowMinimum: Boolean(formData.isBelowMinimum),
      status: formData.status,
      notes: formData.notes || ''
    };

    console.log('🤖 AUTO-CALCULATED PAYROLL (DAILY RATE REFERENCE):', payrollRecord);

    try {
      let result;
      if (editingPayroll) {
        result = await updatePayroll(editingPayroll._id || editingPayroll.id, payrollRecord);
        if (result.success) {
          showToast('✅ Payroll updated successfully', 'success');
        } else {
          throw new Error(result.error || 'Update failed');
        }
      } else {
        result = await addPayroll(payrollRecord);
        if (result.success) {
          showToast('✅ Payroll added successfully', 'success');
        } else {
          throw new Error(result.error || 'Creation failed');
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error('❌ Payroll submit error:', error);
      showToast(error.message || 'An error occurred. Please try again.', 'error');
    }
  };

  const handleEdit = (payroll) => {
    setEditingPayroll(payroll);
    
    setFormData({
      employeeId: payroll.employeeId,
      employeeName: payroll.employeeName,
      department: payroll.department,
      position: payroll.position,
      period: payroll.period || '',
      periodMonth: '',
      periodRange: '',
      daysOfWork: payroll.daysOfWork || '',
      nightDiffHrs: payroll.nightDiffHrs || '',
      overtimeRegularHrs: '',
      overtimeRestDayHrs: '',
      overtimeHolidayHrs: '',
      holidayWorkedDays: '',
      allowances: '',
      bonus: '',
      lateHours: '',
      absenceDays: '',
      hdmfLoan: payroll.hdmfLoan || '',
      sssCalamityLoan: payroll.sssCalamityLoan || '',
      pagibigLoan: payroll.pagibigLoan || '',
      emergencyLoan: payroll.emergencyLoan || '',
      shortage: payroll.shortage || '',
      otherDeductions: payroll.otherDeductions || '',
      status: payroll.status || 'Pending',
      notes: payroll.notes || '',
      dailyRate: 0,
      hourlyRate: 0,
      basicSalary: 0,
      nightDiffAmt: 0,
      overtimeHrs: 0,
      overtimeAmt: 0,
      restDayPremiums: 0,
      grossPay: 0,
      lateDeduction: 0,
      absenceDeduction: 0,
      sss: 0,
      philhealth: 0,
      pagibig: 0,
      withholdingTax: 0,
      taxableSalary: 0,
      totalDeductions: 0,
      netPay: 0,
      isBelowMinimum: false
    });
    setIsModalOpen(true);
  };

  const handleView = (payroll) => {
    setViewingPayroll(payroll);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      const result = await deletePayroll(id);
      if (result.success) {
        showToast('Payroll deleted successfully', 'success');
      } else {
        showToast('Failed to delete payroll', 'error');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const payroll = payrollData.find(p => (p._id || p.id) === id);
    if (payroll) {
      const result = await updatePayroll(id, { ...payroll, status: newStatus });
      if (result.success) {
        showToast(`Payroll status updated to ${newStatus}`, 'success');
      } else {
        showToast('Failed to update status', 'error');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayroll(null);
    setFormData({
      employeeId: '',
      employeeName: '',
      department: '',
      position: '',
      period: '',
      periodMonth: '',
      periodRange: '',
      daysOfWork: '',
      dailyRate: 0,
      hourlyRate: 0,
      basicSalary: 0,
      nightDiffHrs: '',
      nightDiffAmt: 0,
      overtimeRegularHrs: '',
      overtimeRestDayHrs: '',
      overtimeHolidayHrs: '',
      overtimeHrs: 0,
      overtimeAmt: 0,
      holidayWorkedDays: '',
      restDayPremiums: 0,
      allowances: '',
      bonus: '',
      lateHours: '',
      lateDeduction: 0,
      absenceDays: '',
      absenceDeduction: 0,
      hdmfLoan: '',
      sssCalamityLoan: '',
      pagibigLoan: '',
      emergencyLoan: '',
      shortage: '',
      otherDeductions: '',
      grossPay: 0,
      sss: 0,
      philhealth: 0,
      pagibig: 0,
      withholdingTax: 0,
      taxableSalary: 0,
      totalDeductions: 0,
      netPay: 0,
      isBelowMinimum: false,
      status: 'Pending',
      notes: ''
    });
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingPayroll(null);
  };

  // ========== PDF EXPORT FUNCTION (INDIVIDUAL PAYSLIPS) ==========
  const exportToPDF = () => {
    if (filteredPayroll.length === 0) {
      showToast('No payroll records to export', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    const payslipsHTML = filteredPayroll.map((payroll, index) => {
      const employee = employees.find(emp => (emp._id || emp.id) === payroll.employeeId);
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : payroll.employeeName || 'Unknown';
      
      return `
        <div class="payslip" ${index < filteredPayroll.length - 1 ? 'style="page-break-after: always;"' : ''}>
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <h1>HUMANAGE HR MANAGEMENT SYSTEM</h1>
              <p>Automated Payroll System</p>
            </div>
            <div class="payslip-title">
              <h2>PAYSLIP</h2>
              <p class="period">${payroll.period || 'N/A'}</p>
            </div>
          </div>

          <!-- Employee Information -->
          <div class="section">
            <h3>EMPLOYEE INFORMATION</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Employee Name:</span>
                <span class="value">${employeeName}</span>
              </div>
              <div class="info-item">
                <span class="label">Department:</span>
                <span class="value">${payroll.department || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">Position:</span>
                <span class="value">${payroll.position || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">Days Worked:</span>
                <span class="value">${payroll.daysOfWork || 0} days</span>
              </div>
            </div>
          </div>

          <!-- Earnings & Deductions Side by Side -->
          <div class="earnings-deductions">
            <!-- Earnings -->
            <div class="earnings-section">
              <h3>EARNINGS</h3>
              <table class="details-table">
                <tr>
                  <td>Daily Rate:</td>
                  <td class="amount">${formatCurrency(payroll.ratePerDay || 0)}</td>
                </tr>
                <tr>
                  <td>Basic Salary (${payroll.daysOfWork || 0} days):</td>
                  <td class="amount">${formatCurrency(payroll.basicSalary || 0)}</td>
                </tr>
                ${payroll.nightDiffAmt > 0 ? `
                <tr>
                  <td>Night Differential (${payroll.nightDiffHrs || 0} hrs):</td>
                  <td class="amount">${formatCurrency(payroll.nightDiffAmt)}</td>
                </tr>
                ` : ''}
                ${payroll.overtimeAmt > 0 ? `
                <tr>
                  <td>Overtime (${payroll.overtimeHrs || 0} hrs):</td>
                  <td class="amount">${formatCurrency(payroll.overtimeAmt)}</td>
                </tr>
                ` : ''}
                ${payroll.restDayPremiums > 0 ? `
                <tr>
                  <td>Holiday/Rest Day Premium:</td>
                  <td class="amount">${formatCurrency(payroll.restDayPremiums)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td><strong>GROSS PAY:</strong></td>
                  <td class="amount gross"><strong>${formatCurrency(payroll.grossPay || 0)}</strong></td>
                </tr>
              </table>
            </div>

            <!-- Deductions -->
            <div class="deductions-section">
              <h3>DEDUCTIONS</h3>
              <table class="details-table">
                <tr>
                  <td>SSS Contribution:</td>
                  <td class="amount">${formatCurrency(payroll.sss || 0)}</td>
                </tr>
                <tr>
                  <td>PhilHealth:</td>
                  <td class="amount">${formatCurrency(payroll.philhealth || 0)}</td>
                </tr>
                <tr>
                  <td>Pag-IBIG:</td>
                  <td class="amount">${formatCurrency(payroll.pagibig || 0)}</td>
                </tr>
                <tr>
                  <td>Withholding Tax:</td>
                  <td class="amount">${formatCurrency(payroll.withholdingTax || 0)}</td>
                </tr>
                ${(payroll.hdmfLoan || 0) > 0 ? `
                <tr>
                  <td>HDMF Loan:</td>
                  <td class="amount">${formatCurrency(payroll.hdmfLoan)}</td>
                </tr>
                ` : ''}
                ${(payroll.sssCalamityLoan || 0) > 0 ? `
                <tr>
                  <td>SSS Calamity Loan:</td>
                  <td class="amount">${formatCurrency(payroll.sssCalamityLoan)}</td>
                </tr>
                ` : ''}
                ${(payroll.pagibigLoan || 0) > 0 ? `
                <tr>
                  <td>Pag-IBIG Loan:</td>
                  <td class="amount">${formatCurrency(payroll.pagibigLoan)}</td>
                </tr>
                ` : ''}
                ${(payroll.emergencyLoan || 0) > 0 ? `
                <tr>
                  <td>Emergency Loan:</td>
                  <td class="amount">${formatCurrency(payroll.emergencyLoan)}</td>
                </tr>
                ` : ''}
                ${(payroll.shortage || 0) > 0 ? `
                <tr>
                  <td>Shortage:</td>
                  <td class="amount">${formatCurrency(payroll.shortage)}</td>
                </tr>
                ` : ''}
                ${(payroll.otherDeductions || 0) > 0 ? `
                <tr>
                  <td>Other Deductions:</td>
                  <td class="amount">${formatCurrency(payroll.otherDeductions)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td><strong>TOTAL DEDUCTIONS:</strong></td>
                  <td class="amount deductions"><strong>${formatCurrency(payroll.totalDeductions || 0)}</strong></td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Net Pay -->
          <div class="net-pay-section">
            <div class="net-pay-box">
              <span class="net-label">NET PAY</span>
              <span class="net-amount">${formatCurrency(payroll.netPay || 0)}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="signatures">
              <div class="signature-box">
                <div class="signature-line"></div>
                <p>Employee Signature</p>
                <p class="date">Date: _____________</p>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <p>Authorized Signature</p>
                <p class="date">Date: _____________</p>
              </div>
            </div>
            <div class="notes">
              <p><strong>Note:</strong> This is a computer-generated payslip. No signature required for authenticity.</p>
              <p class="generated">Generated: ${new Date().toLocaleString('en-PH')}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslips - ${new Date().toLocaleDateString('en-PH')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #333;
    }
    
    .payslip {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      border: 3px solid #4361ee;
      background: white;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #4361ee;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header .company-info h1 {
      font-size: 20px;
      color: #4361ee;
      margin-bottom: 5px;
    }
    
    .header .company-info p {
      font-size: 11px;
      color: #666;
    }
    
    .header .payslip-title {
      margin-top: 10px;
    }
    
    .header .payslip-title h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 5px;
    }
    
    .header .period {
      font-size: 13px;
      font-weight: bold;
      color: #4361ee;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section h3 {
      font-size: 13px;
      background: #4361ee;
      color: white;
      padding: 8px 12px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    
    .info-item {
      display: flex;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .info-item .label {
      font-weight: bold;
      margin-right: 8px;
      min-width: 120px;
    }
    
    .info-item .value {
      flex: 1;
    }
    
    .earnings-deductions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .earnings-section h3 {
      background: #28a745;
    }
    
    .deductions-section h3 {
      background: #dc3545;
    }
    
    .details-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .details-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .details-table td:first-child {
      font-size: 10px;
    }
    
    .details-table .amount {
      text-align: right;
      font-weight: 600;
      font-size: 11px;
    }
    
    .details-table .total-row {
      border-top: 2px solid #333;
      background: #f8f9fa;
    }
    
    .details-table .total-row td {
      padding: 10px 8px;
      font-size: 12px;
    }
    
    .details-table .amount.gross {
      color: #28a745;
      font-size: 13px;
    }
    
    .details-table .amount.deductions {
      color: #dc3545;
      font-size: 13px;
    }
    
    .net-pay-section {
      margin: 20px 0;
    }
    
    .net-pay-box {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .net-label {
      font-size: 18px;
      font-weight: bold;
    }
    
    .net-amount {
      font-size: 28px;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 30px;
      border-top: 2px solid #e0e0e0;
      padding-top: 20px;
    }
    
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 20px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 2px solid #333;
      margin: 40px 20px 10px;
    }
    
    .signature-box p {
      font-size: 11px;
      margin-top: 5px;
    }
    
    .signature-box .date {
      font-size: 10px;
      color: #666;
      margin-top: 8px;
    }
    
    .notes {
      text-align: center;
      font-size: 10px;
      color: #666;
      margin-top: 15px;
    }
    
    .notes .generated {
      margin-top: 5px;
      font-style: italic;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  ${payslipsHTML}
  
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const periods = ['All', ...new Set(payrollData.map(p => p.period).filter(Boolean))].sort();
  const departments = ['All', ...new Set(payrollData.map(p => p.department).filter(Boolean))].sort();

  const filteredPayroll = payrollData.filter(pay => {
    const employee = employees.find(emp => (emp._id || emp.id) === pay.employeeId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : pay.employeeName || '';

    const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pay.period?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pay.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPeriod = filterPeriod === 'All' || pay.period === filterPeriod;
    const matchesStatus = filterStatus === 'All' || pay.status === filterStatus;
    const matchesDepartment = filterDepartment === 'All' || pay.department === filterDepartment;

    return matchesSearch && matchesPeriod && matchesStatus && matchesDepartment;
  });

  const totalGrossPay = filteredPayroll.reduce((sum, p) => sum + (Number(p.grossPay) || 0), 0);
  const totalNetPay = filteredPayroll.reduce((sum, p) => sum + (Number(p.netPay) || 0), 0);
  const totalDeductionsSum = filteredPayroll.reduce((sum, p) => sum + (Number(p.totalDeductions) || 0), 0);

  // ========== JSX RENDER ==========
  return (
    <div style={{ zoom: '0.85' }}>
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2>
          <i className="fas fa-robot"></i> Automated Payroll System
          <span style={{
            marginLeft: '1rem',
            fontSize: '0.7rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontWeight: '600'
          }}>
            🤖 DAILY RATE
          </span>
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-success" 
            onClick={exportToPDF}
            style={{ 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              border: 'none'
            }}
          >
            <i className="fas fa-file-pdf"></i> Export to PDF
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Add Payroll
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Records</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>{filteredPayroll.length}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Gross Pay</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatCurrency(totalGrossPay)}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Deductions</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatCurrency(totalDeductionsSum)}</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Net Pay</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatCurrency(totalNetPay)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '0.9rem',
            minWidth: '180px',
            backgroundColor: 'white',
            cursor: 'pointer'
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
          placeholder="🔍 Search by employee, period, or department..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '1', minWidth: '300px' }}
        />
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '0.9rem',
            minWidth: '150px'
          }}
        >
          {periods.map(period => (
            <option key={period} value={period}>{period === 'All' ? 'All Periods' : period}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '0.9rem',
            minWidth: '150px'
          }}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Payroll Table */}
      <div className="card">
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Period</th>
                <th>Days</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                    No payroll records found
                  </td>
                </tr>
              ) : (
                filteredPayroll.map(payroll => {
                  const employee = employees.find(emp => (emp._id || emp.id) === payroll.employeeId);
                  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : payroll.employeeName || 'Unknown';

                  return (
                    <tr key={payroll._id || payroll.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{employeeName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>{payroll.position}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{payroll.department}</span>
                      </td>
                      <td>{payroll.period}</td>
                      <td>{payroll.daysOfWork || 0}</td>
                      <td style={{ fontWeight: '700', color: '#4361ee' }}>{formatCurrency(payroll.grossPay)}</td>
                      <td style={{ color: '#dc3545' }}>{formatCurrency(payroll.totalDeductions)}</td>
                      <td style={{ fontWeight: '700', fontSize: '1.05rem', color: '#28a745' }}>
                        {formatCurrency(payroll.netPay)}
                      </td>
                      <td>
                        <select
                          className={`badge badge-${
                            payroll.status === 'Paid' ? 'success' :
                            payroll.status === 'Processing' ? 'warning' : 'secondary'
                          }`}
                          value={payroll.status}
                          onChange={(e) => handleStatusChange(payroll._id || payroll.id, e.target.value)}
                          style={{ border: 'none', cursor: 'pointer', fontWeight: '600' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleView(payroll)}
                            title="View Details"
                            style={{ color: '#4361ee' }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleEdit(payroll)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(payroll._id || payroll.id)}
                            title="Delete"
                            style={{ color: '#dc3545' }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-robot"></i>
            {editingPayroll ? 'Edit Payroll' : 'Add Payroll'}
            <span style={{
              fontSize: '0.7rem',
              background: '#4caf50',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              AUTO
            </span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1rem' }}>
          
          {/* AUTOMATION NOTICE */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <i className="fas fa-magic" style={{ fontSize: '2rem' }}></i>
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>🤖 Automated Payroll (Daily Rate × Days)</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                Uses employee's daily rate from their record. Just select month, period, and days!
              </div>
            </div>
          </div>

          {/* Employee & Basic Info */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            borderRadius: '12px',
            border: '2px solid #2196f3'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1976d2', marginBottom: '1rem' }}>
              👤 Employee Information
            </h4>
            
            <div className="form-group">
              {editingPayroll ? (
                <>
                  <label>Employee *</label>
                  <input
                    type="text"
                    value={formData.employeeName}
                    disabled
                    style={{
                      cursor: 'not-allowed',
                      opacity: 0.7,
                      backgroundColor: '#f5f5f5',
                      fontWeight: '600',
                      color: '#424242'
                    }}
                  />
                  <small style={{ color: '#d32f2f', fontSize: '0.75rem' }}>
                    🔒 Employee cannot be changed when editing
                  </small>
                </>
              ) : (
                <>
                  <label>Employee * (Auto-loads daily rate)</label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => {
                      const empDailyRate = emp.basicSalary || emp.salary || 0;
                      return (
                        <option key={emp._id || emp.id} value={emp._id || emp.id}>
                          {emp.firstName} {emp.lastName} - {emp.department} (₱{Number(empDailyRate).toLocaleString()}/day)
                        </option>
                      );
                    })}
                  </select>
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Month *</label>
                <select
                  name="periodMonth"
                  value={formData.periodMonth || ''}
                  onChange={(e) => {
                    const month = e.target.value;
                    const periodRange = formData.periodRange || '1-15';
                    const year = new Date().getFullYear();
                    const period = month ? `${month} ${periodRange}, ${year}` : '';
                    setFormData(prev => ({ 
                      ...prev, 
                      periodMonth: month,
                      period: period 
                    }));
                  }}
                  required
                >
                  <option value="">Select Month</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Pay Period *</label>
                <select
                  name="periodRange"
                  value={formData.periodRange || ''}
                  onChange={(e) => {
                    const periodRange = e.target.value;
                    const month = formData.periodMonth || '';
                    const year = new Date().getFullYear();
                    const period = month ? `${month} ${periodRange}, ${year}` : '';
                    setFormData(prev => ({ 
                      ...prev, 
                      periodRange: periodRange,
                      period: period 
                    }));
                  }}
                  required
                >
                  <option value="">Select Period</option>
                  <option value="1-15">1-15 (First Half)</option>
                  <option value="16-31">16-31 (Second Half)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Days of Work *</label>
                <select
                  name="daysOfWork"
                  value={formData.daysOfWork}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Days</option>
                  {[...Array(15)].map((_, i) => {
                    const day = i + 1;
                    return (
                      <option key={day} value={day}>
                        {day} {day === 1 ? 'day' : 'days'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* AUTO-CALCULATED DISPLAY */}
            {formData.employeeId && formData.daysOfWork && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(76, 175, 80, 0.1)',
                borderRadius: '8px',
                border: '2px solid #4caf50'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  color: '#2e7d32',
                  fontWeight: '600'
                }}>
                  <i className="fas fa-check-circle"></i>
                  AUTO-CALCULATED FROM EMPLOYEE DAILY RATE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>Daily Rate</label>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#2e7d32' }}>
                      {formatCurrency(formData.dailyRate)}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>Hourly (÷8)</label>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#2e7d32' }}>
                      {formatCurrency(formData.hourlyRate)}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>Basic Salary (×{formData.daysOfWork})</label>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#2e7d32' }}>
                      {formatCurrency(formData.basicSalary)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Premiums */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            borderRadius: '12px',
            border: '2px solid #ff9800'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#e65100', marginBottom: '0.5rem' }}>
              💰 Premiums (Enter hours → Auto-calculates)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Night Differential Hours (Max: 12 hrs/day)</label>
                <input
                  type="text"
                  name="nightDiffHrs"
                  placeholder="0"
                  value={formData.nightDiffHrs}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (numValue >= 0 && numValue <= 12)) {
                        handleInputChange(e);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  max="12"
                  step="0.5"
                />
                {formData.nightDiffAmt > 0 && (
                  <small style={{ color: '#e65100', fontWeight: '600' }}>
                    → {formatCurrency(formData.nightDiffAmt)}
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label>Regular OT Hours (Max: 4 hrs/day)</label>
                <input
                  type="text"
                  name="overtimeRegularHrs"
                  placeholder="0"
                  value={formData.overtimeRegularHrs}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (numValue >= 0 && numValue <= 60)) {
                        handleInputChange(e);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  max="60"
                  step="0.5"
                />
              </div>
              
              <div className="form-group">
                <label>Rest Day OT Hours (Max: 60 hrs/period)</label>
                <input
                  type="text"
                  name="overtimeRestDayHrs"
                  placeholder="0"
                  value={formData.overtimeRestDayHrs}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (numValue >= 0 && numValue <= 60)) {
                        handleInputChange(e);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  max="60"
                  step="0.5"
                />
              </div>
              
              <div className="form-group">
                <label>Holiday OT Hours (Max: 60 hrs/period)</label>
                <input
                  type="text"
                  name="overtimeHolidayHrs"
                  placeholder="0"
                  value={formData.overtimeHolidayHrs}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (numValue >= 0 && numValue <= 60)) {
                        handleInputChange(e);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  max="60"
                  step="0.5"
                />
              </div>
            </div>

            {formData.overtimeAmt > 0 && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(255, 152, 0, 0.15)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#e65100', fontWeight: '600' }}>
                  Total OT: {formData.overtimeHrs} hrs
                </span>
                <strong style={{ color: '#e65100', fontSize: '1.1rem' }}>
                  {formatCurrency(formData.overtimeAmt)}
                </strong>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Holiday/Rest Days Worked (Max: 8 days)</label>
              <input
                type="text"
                name="holidayWorkedDays"
                placeholder="0"
                value={formData.holidayWorkedDays}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    const numValue = parseFloat(value);
                    if (value === '' || (numValue >= 0 && numValue <= 8)) {
                      handleInputChange(e);
                    }
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                min="0"
                max="8"
                step="0.5"
              />
              {formData.restDayPremiums > 0 && (
                <small style={{ color: '#e65100', fontWeight: '600' }}>
                  → {formatCurrency(formData.restDayPremiums)}
                </small>
              )}
            </div>
          </div>

          {/* Additional Earnings */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            borderRadius: '12px',
            border: '2px solid #4caf50'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#2e7d32', marginBottom: '1rem' }}>
              💵 Additional Earnings
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Allowances (Max: ₱50,000)</label>
                <input
                  type="text"
                  name="allowances"
                  placeholder="0.00"
                  value={formData.allowances}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (numValue >= 0 && numValue <= 50000)) {
                        handleInputChange(e);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  max="50000"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Bonus (Max: ₱100,000)</label>
                <input
                  type="text"
                  name="bonus"
                  placeholder="0.00"
                  value={formData.bonus}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (numValue >= 0 && numValue <= 100000)) {
                        handleInputChange(e);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  max="100000"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            borderRadius: '12px',
            border: '2px solid #f44336'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#c62828', marginBottom: '1rem' }}>
              ➖ Deductions (Enter hours/days → Auto-deducts)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Late/Undertime Hours (Max: 120 hrs)</label>
                <input
                  type="text"
                  name="lateHours"
                  placeholder="0"
                  value={formData.lateHours}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (numValue >= 0 && numValue <= 120)) {
                        handleInputChange(e);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  max="120"
                  step="0.1"
                />
                {formData.lateDeduction > 0 && (
                  <small style={{ color: '#c62828', fontWeight: '600' }}>
                    → -{formatCurrency(formData.lateDeduction)}
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Absence Days (Max: 15 days)</label>
                <input
                  type="text"
                  name="absenceDays"
                  placeholder="0"
                  value={formData.absenceDays}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (numValue >= 0 && numValue <= 15)) {
                        handleInputChange(e);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  max="15"
                  step="0.5"
                />
                {formData.absenceDeduction > 0 && (
                  <small style={{ color: '#c62828', fontWeight: '600' }}>
                    → -{formatCurrency(formData.absenceDeduction)}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Loans */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
            borderRadius: '12px',
            border: '2px solid #9c27b0'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#7b1fa2', marginBottom: '1rem' }}>
              🏦 Loans & Other Deductions
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {['hdmfLoan', 'sssCalamityLoan', 'pagibigLoan', 'emergencyLoan', 'shortage', 'otherDeductions'].map(field => (
                <div className="form-group" key={field}>
                  <label>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (Max: ₱100,000)</label>
                  <input
                    type="text"
                    name={field}
                    placeholder="0.00"
                    value={formData[field]}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numValue = parseFloat(value);
                        if (value === '' || (numValue >= 0 && numValue <= 100000)) {
                          handleInputChange(e);
                        }
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    max="100000"
                    step="0.01"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Government Contributions & Summary */}
          {formData.employeeId && (
            <>
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                borderRadius: '12px',
                border: '2px solid #00bcd4'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#00838f',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🏛️ Government Contributions
                  <span style={{
                    fontSize: '0.65rem',
                    background: '#4caf50',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    AUTO
                  </span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>SSS (5%)</label>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#00838f' }}>
                      {formatCurrency(formData.sss)}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>PhilHealth (2.5%)</label>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#00838f' }}>
                      {formatCurrency(formData.philhealth)}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>Pag-IBIG (2%)</label>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#00838f' }}>
                      {formatCurrency(formData.pagibig)}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>Tax</label>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#00838f' }}>
                      {formatCurrency(formData.withholdingTax)}
                    </div>
                    {formData.isBelowMinimum && (
                      <small style={{ fontSize: '0.65rem', color: '#4caf50' }}>
                        ✓ Tax Exempt
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* FINAL SUMMARY */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                borderRadius: '12px',
                border: '3px solid #424242'
              }}>
                <h4 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '700', 
                  color: '#212529', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📊 Final Summary
                  <span style={{
                    fontSize: '0.65rem',
                    background: '#4caf50',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    LIVE
                  </span>
                </h4>

                <div style={{
                  padding: '1.5rem',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '2px solid #212529'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr auto 1fr auto 1fr', 
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Gross Pay</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4361ee' }}>
                        {formatCurrency(formData.grossPay)}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '1.5rem', color: '#999' }}>−</div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <label style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Deductions</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#dc3545' }}>
                        {formatCurrency(formData.totalDeductions)}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '1.5rem', color: '#999' }}>=</div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <label style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>NET PAY</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#28a745' }}>
                        {formatCurrency(formData.netPay)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '12px'
          }}>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Form Footer */}
          <div className="modal-footer" style={{
            position: 'sticky',
            bottom: 0,
            background: 'white',
            padding: '1rem 0',
            borderTop: '1px solid #e9ecef',
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              <i className="fas fa-info-circle"></i> All calculations are automatic
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                <i className="fas fa-times"></i> Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <i className={`fas fa-${editingPayroll ? 'save' : 'plus'}`}></i>
                {editingPayroll ? 'Update' : 'Add'} Payroll
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Payroll Details"
      >
        {viewingPayroll && (
          <div style={{ padding: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Employee</label>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{viewingPayroll.employeeName}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Department</label>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{viewingPayroll.department}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Period</label>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{viewingPayroll.period}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Days of Work</label>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{viewingPayroll.daysOfWork}</div>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Earnings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                <div>Basic Salary:</div>
                <div style={{ fontWeight: '600' }}>{formatCurrency(viewingPayroll.basicSalary)}</div>
                
                {viewingPayroll.nightDiffAmt > 0 && (
                  <>
                    <div>Night Differential:</div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(viewingPayroll.nightDiffAmt)}</div>
                  </>
                )}
                
                {viewingPayroll.overtimeAmt > 0 && (
                  <>
                    <div>Overtime:</div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(viewingPayroll.overtimeAmt)}</div>
                  </>
                )}
                
                {viewingPayroll.restDayPremiums > 0 && (
                  <>
                    <div>Holiday/Rest Day:</div>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(viewingPayroll.restDayPremiums)}</div>
                  </>
                )}
                
                <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <strong>Gross Pay:</strong>
                </div>
                <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: '700', color: '#4361ee' }}>
                  {formatCurrency(viewingPayroll.grossPay)}
                </div>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: '#fff3cd',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Deductions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                <div>SSS:</div>
                <div style={{ fontWeight: '600' }}>{formatCurrency(viewingPayroll.sss)}</div>
                
                <div>PhilHealth:</div>
                <div style={{ fontWeight: '600' }}>{formatCurrency(viewingPayroll.philhealth)}</div>
                
                <div>Pag-IBIG:</div>
                <div style={{ fontWeight: '600' }}>{formatCurrency(viewingPayroll.pagibig)}</div>
                
                <div>Withholding Tax:</div>
                <div style={{ fontWeight: '600' }}>{formatCurrency(viewingPayroll.withholdingTax)}</div>
                
                <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <strong>Total Deductions:</strong>
                </div>
                <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: '700', color: '#dc3545' }}>
                  {formatCurrency(viewingPayroll.totalDeductions)}
                </div>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>NET PAY</div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatCurrency(viewingPayroll.netPay)}</div>
            </div>

            {viewingPayroll.notes && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '0.5rem' }}>Notes</label>
                <div>{viewingPayroll.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default Payroll;