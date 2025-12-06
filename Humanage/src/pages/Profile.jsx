import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    position: user?.position || '',
    phone: '',
    bio: ''
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = updateProfile(formData);
    
    if (result.success) {
      setToast({ show: true, message: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
    } else {
      setToast({ show: true, message: 'Failed to update profile', type: 'error' });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      position: user?.position || '',
      phone: '',
      bio: ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-cover"></div>
        <div className="profile-header-content">
          <div className="profile-avatar-large">
            {user?.avatar || 'AD'}
          </div>
          <div className="profile-header-info">
            <h2>{user?.name}</h2>
            <p className="profile-role">{user?.position} • {user?.department}</p>
            <p className="profile-email">
              <i className="fas fa-envelope"></i>
              {user?.email}
            </p>
          </div>
          <div className="profile-header-actions">
            {!isEditing ? (
              <button 
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <i className="fas fa-edit"></i>
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button 
                  className="btn btn-success"
                  onClick={handleSubmit}
                >
                  <i className="fas fa-save"></i>
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-main">
          {/* Personal Information */}
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-user"></i>
                Personal Information
              </h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="4"
                    placeholder="Tell us about yourself..."
                  ></textarea>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-lock"></i>
                Change Password
              </h3>
            </div>
            <div className="card-body">
              <form>
                <div className="form-group">
                  <label htmlFor="current-password">Current Password</label>
                  <input
                    type="password"
                    id="current-password"
                    placeholder="Enter current password"
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      placeholder="Enter new password"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      placeholder="Confirm new password"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                {isEditing && (
                  <button type="button" className="btn btn-warning">
                    <i className="fas fa-key"></i>
                    Update Password
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="profile-sidebar">
          {/* Account Info */}
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-info-circle"></i>
                Account Info
              </h3>
            </div>
            <div className="card-body">
              <div className="info-item">
                <span className="info-label">User ID</span>
                <span className="info-value">{user?.id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Role</span>
                <span className="info-value">
                  <span className="badge badge-primary">{user?.role}</span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Join Date</span>
                <span className="info-value">{user?.joinDate}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value">
                  <span className="badge badge-success">Active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-bolt"></i>
                Quick Actions
              </h3>
            </div>
            <div className="card-body">
              <button className="btn btn-block btn-outline">
                <i className="fas fa-download"></i>
                Download Profile Data
              </button>
              <button className="btn btn-block btn-outline">
                <i className="fas fa-file-export"></i>
                Export as PDF
              </button>
              <button className="btn btn-block btn-outline-danger">
                <i className="fas fa-trash-alt"></i>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default Profile;