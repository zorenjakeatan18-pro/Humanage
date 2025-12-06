import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Performance = () => {
  const { employees, performanceData, addPerformance, updatePerformance, deletePerformance } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPerformance, setViewingPerformance] = useState(null);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    reviewDate: '',
    reviewPeriod: '',  // Will be auto-generated from month + year
    reviewMonth: '',   // NEW: Selected month
    reviewYear: '',    // NEW: Selected year
    rating: '',
    goals: '',
    achievements: '',
    areasOfImprovement: '',
    comments: '',
    reviewedBy: '',
    status: 'Draft'
  });

  // Toast helper function
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
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

  // Auto-delete reviews older than 3 months
  useEffect(() => {
    const checkAndDeleteOldReviews = () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      performanceData.forEach(performance => {
        const reviewDate = new Date(performance.reviewDate);
        if (reviewDate < threeMonthsAgo) {
          deletePerformance(performance._id || performance.id);
        }
      });
    };

    checkAndDeleteOldReviews();
    const interval = setInterval(checkAndDeleteOldReviews, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [performanceData, deletePerformance]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e, saveType = 'Draft') => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validation for Finalize - all fields must be filled
    if (saveType === 'Submitted') {
      // Check all required fields
      if (!formData.employeeId || !formData.reviewDate || !formData.reviewMonth || 
          !formData.reviewYear || !formData.rating || !formData.reviewedBy) {
        showToast('Please fill in all required fields before finalizing', 'error');
        return;
      }
      
      // Check if all optional fields have content (for finalization)
      if (!formData.goals || !formData.achievements || 
          !formData.areasOfImprovement || !formData.comments) {
        showToast('Please fill in all fields (Goals, Achievements, Areas of Improvement, and Comments) before finalizing the review', 'error');
        return;
      }
      
      // Check if fields are not just whitespace
      if (formData.goals.trim() === '' || formData.achievements.trim() === '' || 
          formData.areasOfImprovement.trim() === '' || formData.comments.trim() === '') {
        showToast('All fields must have meaningful content before finalizing', 'error');
        return;
      }
      
      setShowFinalizeConfirm(true);
      return;
    }
    
    // For Draft - only basic required fields needed
    savePerformance(saveType);
  };

  const savePerformance = async (saveType) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const employee = employees.find(emp => (emp._id || emp.id) === formData.employeeId);
    
    const performanceRecord = {
      employeeId: formData.employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : formData.employeeName,
      reviewDate: formData.reviewDate,
      reviewPeriod: formData.reviewPeriod,  // Use the auto-generated reviewPeriod
      rating: formData.rating,
      goals: formData.goals || '',
      achievements: formData.achievements || '',
      areasOfImprovement: formData.areasOfImprovement || '',
      comments: formData.comments || '',
      reviewedBy: formData.reviewedBy,
      status: saveType  // 'Draft' or 'Submitted'
    };
    
    try {
      let result;
      if (editingPerformance) {
        result = await updatePerformance(editingPerformance._id || editingPerformance.id, performanceRecord);
        if (result.success) {
          if (saveType === 'Submitted') {
            showToast('Performance review finalized successfully! This review can no longer be edited.', 'success');
          } else {
            showToast('Performance review updated successfully', 'success');
          }
        } else {
          throw new Error(result.error || 'Update failed');
        }
      } else {
        result = await addPerformance(performanceRecord);
        if (result.success) {
          if (saveType === 'Submitted') {
            showToast('Performance review created and finalized successfully!', 'success');
          } else {
            showToast('Performance review saved as draft successfully', 'success');
          }
        } else {
          throw new Error(result.error || 'Creation failed');
        }
      }
      
      setShowFinalizeConfirm(false);
      handleCloseModal();
    } catch (error) {
      console.error('Save performance error:', error);
      showToast(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleView = (performance) => {
    setViewingPerformance(performance);
    setIsViewModalOpen(true);
  };

  const handleEdit = (performance) => {
    setEditingPerformance(performance);
    setFormData({
      employeeId: performance.employeeId,
      employeeName: performance.employeeName,
      reviewDate: performance.reviewDate,
      reviewPeriod: performance.reviewPeriod,
      reviewMonth: '',
      reviewYear: '',
      rating: performance.rating,
      goals: performance.goals || '',
      achievements: performance.achievements || '',
      areasOfImprovement: performance.areasOfImprovement || '',
      comments: performance.comments || '',
      reviewedBy: performance.reviewedBy,
      status: performance.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this performance review?')) {
      const result = await deletePerformance(id);
      if (result.success) {
        showToast('Performance review deleted successfully', 'success');
      } else {
        showToast('Failed to delete performance review', 'error');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPerformance(null);
    setShowFinalizeConfirm(false);
    setIsSubmitting(false);
    setFormData({
      employeeId: '',
      employeeName: '',
      reviewDate: '',
      reviewPeriod: '',
      reviewMonth: '',
      reviewYear: '',
      rating: '',
      goals: '',
      achievements: '',
      areasOfImprovement: '',
      comments: '',
      reviewedBy: '',
      status: 'Draft'
    });
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingPerformance(null);
  };

  const handleCancelFinalize = () => {
    setShowFinalizeConfirm(false);
    setIsSubmitting(false);
  };

  const handleConfirmFinalize = () => {
    savePerformance('Submitted');
  };

  const handleExportToPDF = (performance) => {
    const employee = employees.find(emp => (emp._id || emp.id) === performance.employeeId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : performance.employeeName || 'Unknown';
    
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Add title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Review Report', 105, yPosition, { align: 'center' });
    yPosition += 5;
    
    // Add line
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    
    // Employee Information
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Employee Information', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Employee Name: ${employeeName}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Review Date: ${formatDate(performance.reviewDate)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Review Period: ${performance.reviewPeriod}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Reviewer: ${performance.reviewedBy}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Status: ${performance.status === 'Submitted' ? 'Finalized' : 'Draft'}`, 20, yPosition);
    yPosition += 14;
    
    // Rating
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Overall Rating', 20, yPosition);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(performance.rating, 20, yPosition);
    yPosition += 14;
    
    // Check page break helper
    const checkPageBreak = (requiredSpace) => {
      if (yPosition + requiredSpace > 270) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };
    
    // Goals
    if (performance.goals) {
      checkPageBreak(30);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Goals', 20, yPosition);
      yPosition += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const goalsLines = doc.splitTextToSize(performance.goals, 170);
      const goalsHeight = goalsLines.length * 7;
      checkPageBreak(goalsHeight + 10);
      doc.text(goalsLines, 20, yPosition);
      yPosition += goalsHeight + 10;
    }
    
    // Achievements
    if (performance.achievements) {
      checkPageBreak(30);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Achievements', 20, yPosition);
      yPosition += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const achievementsLines = doc.splitTextToSize(performance.achievements, 170);
      const achievementsHeight = achievementsLines.length * 7;
      checkPageBreak(achievementsHeight + 10);
      doc.text(achievementsLines, 20, yPosition);
      yPosition += achievementsHeight + 10;
    }
    
    // Areas of Improvement
    if (performance.areasOfImprovement) {
      checkPageBreak(30);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Areas of Improvement', 20, yPosition);
      yPosition += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const areasLines = doc.splitTextToSize(performance.areasOfImprovement, 170);
      const areasHeight = areasLines.length * 7;
      checkPageBreak(areasHeight + 10);
      doc.text(areasLines, 20, yPosition);
      yPosition += areasHeight + 10;
    }
    
    // Comments
    if (performance.comments) {
      checkPageBreak(30);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Additional Comments', 20, yPosition);
      yPosition += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const commentsLines = doc.splitTextToSize(performance.comments, 170);
      doc.text(commentsLines, 20, yPosition);
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });
    }
    
    // Save PDF
    doc.save(`Performance_Review_${employeeName.replace(/\s+/g, '_')}_${performance.reviewPeriod.replace(/\s+/g, '_')}.pdf`);
    
    showToast('PDF exported successfully', 'success');
  };

  const getRatingColor = (rating) => {
    switch(rating) {
      case 'Excellent': return 'success';
      case 'Good': return 'success';
      case 'Satisfactory': return 'warning';
      case 'Needs Improvement': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Submitted' ? 'success' : 'warning';
  };

  const filteredPerformance = performanceData.filter(perf => {
    const employee = employees.find(emp => (emp._id || emp.id) === perf.employeeId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : perf.employeeName || '';
    const reviewPeriod = perf.reviewPeriod || '';
    const rating = perf.rating || '';
    
    return employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           reviewPeriod.toLowerCase().includes(searchTerm.toLowerCase()) ||
           rating.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Generate year options (current year - 10 to current year + 10)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    yearOptions.push(i);
  }

  return (
    <div>
      <div className="page-header">
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search reviews..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> Add Review
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Review Date</th>
                <th>Period</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Reviewer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerformance.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No performance reviews found
                  </td>
                </tr>
              ) : (
                filteredPerformance.map(performance => {
                  const employee = employees.find(emp => (emp._id || emp.id) === performance.employeeId);
                  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : performance.employeeName || 'Unknown';
                  
                  return (
                    <tr key={performance._id || performance.id}>
                      <td>{employeeName}</td>
                      <td>{formatDate(performance.reviewDate)}</td>
                      <td>{performance.reviewPeriod}</td>
                      <td>
                        <span className={`badge badge-${getRatingColor(performance.rating)}`}>
                          {performance.rating}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusColor(performance.status)}`}>
                          {performance.status === 'Submitted' ? 'Finalized' : 'Draft'}
                        </span>
                      </td>
                      <td>{performance.reviewedBy}</td>
                      <td>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleView(performance)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {performance.status !== 'Submitted' && (
                          <button 
                            className="btn-icon" 
                            onClick={() => handleEdit(performance)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                        <button 
                          className="btn-icon" 
                          onClick={() => handleExportToPDF(performance)}
                          title="Export to PDF"
                        >
                          <i className="fas fa-file-pdf"></i>
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleDelete(performance._id || performance.id)}
                          title="Delete"
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPerformance ? 'Edit Performance Review' : 'Add Performance Review'}
      >
        <form onSubmit={(e) => handleSubmit(e, 'Draft')}>
          <div className="form-group">
            <label>Employee *</label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              required
              disabled={editingPerformance && editingPerformance.status === 'Submitted'}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Review Date *</label>
              <input
                type="date"
                name="reviewDate"
                value={formData.reviewDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          {/* NEW: Review Period Dropdowns */}
          <div className="form-row">
            <div className="form-group">
              <label>Review Month *</label>
              <select
                name="reviewMonth"
                value={formData.reviewMonth}
                onChange={(e) => {
                  const month = e.target.value;
                  const year = formData.reviewYear;
                  const period = month && year ? `${month} ${year}` : '';
                  setFormData(prev => ({
                    ...prev,
                    reviewMonth: month,
                    reviewPeriod: period
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
              <label>Review Year *</label>
              <select
                name="reviewYear"
                value={formData.reviewYear}
                onChange={(e) => {
                  const year = e.target.value;
                  const month = formData.reviewMonth;
                  const period = month && year ? `${month} ${year}` : '';
                  setFormData(prev => ({
                    ...prev,
                    reviewYear: year,
                    reviewPeriod: period
                  }));
                }}
                required
              >
                <option value="">Select Year</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Overall Rating *</label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Rating</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Satisfactory">Satisfactory</option>
              <option value="Needs Improvement">Needs Improvement</option>
            </select>
          </div>
          <div className="form-group">
            <label>Goals * (Required for Finalization)</label>
            <textarea
              name="goals"
              value={formData.goals}
              onChange={handleInputChange}
              rows="3"
              placeholder="Set goals for the review period..."
            />
          </div>
          <div className="form-group">
            <label>Achievements * (Required for Finalization)</label>
            <textarea
              name="achievements"
              value={formData.achievements}
              onChange={handleInputChange}
              rows="3"
              placeholder="Document key achievements..."
            />
          </div>
          <div className="form-group">
            <label>Areas of Improvement * (Required for Finalization)</label>
            <textarea
              name="areasOfImprovement"
              value={formData.areasOfImprovement}
              onChange={handleInputChange}
              rows="3"
              placeholder="Identify areas for improvement..."
            />
          </div>
          <div className="form-group">
            <label>Comments * (Required for Finalization)</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              rows="3"
              placeholder="Additional comments..."
            />
          </div>
          <div className="form-group">
            <label>Reviewer Name *</label>
            <input
              type="text"
              name="reviewedBy"
              value={formData.reviewedBy}
              onChange={handleInputChange}
              required
            />
          </div>
          
          {/* Information Box */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#495057', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#17a2b8' }}>💾 Save Draft:</strong> You can save with only the required fields (*) filled
              </div>
              <div>
                <strong style={{ color: '#28a745' }}>✅ Finalize:</strong> All fields must be completed including Goals, Achievements, Areas of Improvement, and Comments
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-info"
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              <i className="fas fa-save"></i> {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={(e) => handleSubmit(e, 'Submitted')}
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              <i className="fas fa-check-circle"></i> Finalize
            </button>
          </div>
        </form>
      </Modal>

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-in'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '35px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease-out',
            border: '3px solid #f0ad4e'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <i className="fas fa-exclamation-triangle" style={{ 
                fontSize: '50px', 
                color: '#f0ad4e',
                marginBottom: '15px'
              }}></i>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '10px',
                color: '#333',
                fontSize: '24px'
              }}>
                Confirm Finalization
              </h2>
            </div>
            <p style={{ 
              marginBottom: '25px', 
              lineHeight: '1.6',
              fontSize: '16px',
              color: '#555',
              textAlign: 'center'
            }}>
              Are you sure you want to <strong>finalize</strong> this performance review? 
              <br/><br/>
              <span style={{ color: '#d9534f', fontWeight: 'bold' }}>
                ⚠️ Once finalized, this review cannot be edited anymore!
              </span>
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              justifyContent: 'center',
              marginTop: '30px'
            }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancelFinalize}
                disabled={isSubmitting}
                style={{
                  padding: '12px 30px',
                  fontSize: '16px',
                  minWidth: '120px'
                }}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleConfirmFinalize}
                disabled={isSubmitting}
                style={{ 
                  opacity: isSubmitting ? 0.6 : 1, 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  padding: '12px 30px',
                  fontSize: '16px',
                  minWidth: '120px',
                  backgroundColor: '#5cb85c',
                  borderColor: '#4cae4c'
                }}
              >
                <i className="fas fa-check-circle"></i> {isSubmitting ? 'Finalizing...' : 'Yes, Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Performance Review Details"
      >
        {viewingPerformance && (
          <div className="review-details">
            <div className="form-row">
              <div className="form-group">
                <label><strong>Employee</strong></label>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  {employees.find(emp => (emp._id || emp.id) === viewingPerformance.employeeId)?.firstName} {employees.find(emp => (emp._id || emp.id) === viewingPerformance.employeeId)?.lastName}
                </p>
              </div>
              <div className="form-group">
                <label><strong>Status</strong></label>
                <p style={{ margin: '0' }}>
                  <span className={`badge badge-${getStatusColor(viewingPerformance.status)}`}>
                    {viewingPerformance.status === 'Submitted' ? 'Finalized' : 'Draft'}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label><strong>Review Date</strong></label>
                <p style={{ margin: '0', fontSize: '14px' }}>{formatDate(viewingPerformance.reviewDate)}</p>
              </div>
              <div className="form-group">
                <label><strong>Period</strong></label>
                <p style={{ margin: '0', fontSize: '14px' }}>{viewingPerformance.reviewPeriod}</p>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label><strong>Rating</strong></label>
                <p style={{ margin: '0' }}>
                  <span className={`badge badge-${getRatingColor(viewingPerformance.rating)}`}>
                    {viewingPerformance.rating}
                  </span>
                </p>
              </div>
              <div className="form-group">
                <label><strong>Reviewer</strong></label>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  {viewingPerformance.reviewedBy}
                </p>
              </div>
            </div>
            
            {viewingPerformance.goals && (
              <div className="form-group">
                <label><strong>Goals</strong></label>
                <div style={{ 
                  maxHeight: '60px', 
                  overflow: 'auto', 
                  fontSize: '13px', 
                  padding: '8px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  {viewingPerformance.goals}
                </div>
              </div>
            )}
            
            {viewingPerformance.achievements && (
              <div className="form-group">
                <label><strong>Achievements</strong></label>
                <div style={{ 
                  maxHeight: '60px', 
                  overflow: 'auto', 
                  fontSize: '13px', 
                  padding: '8px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  {viewingPerformance.achievements}
                </div>
              </div>
            )}
            
            {viewingPerformance.areasOfImprovement && (
              <div className="form-group">
                <label><strong>Areas of Improvement</strong></label>
                <div style={{ 
                  maxHeight: '60px', 
                  overflow: 'auto', 
                  fontSize: '13px', 
                  padding: '8px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  {viewingPerformance.areasOfImprovement}
                </div>
              </div>
            )}
            
            {viewingPerformance.comments && (
              <div className="form-group">
                <label><strong>Comments</strong></label>
                <div style={{ 
                  maxHeight: '60px', 
                  overflow: 'auto', 
                  fontSize: '13px', 
                  padding: '8px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  {viewingPerformance.comments}
                </div>
              </div>
            )}
            
            <div className="modal-footer">
              {viewingPerformance.status !== 'Submitted' && (
                <button 
                  type="button" 
                  className="btn btn-info" 
                  onClick={() => {
                    handleCloseViewModal();
                    handleEdit(viewingPerformance);
                  }}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => handleExportToPDF(viewingPerformance)}
              >
                <i className="fas fa-file-pdf"></i> Export to PDF
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCloseViewModal}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Component */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            transform: translateY(-50px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Performance;