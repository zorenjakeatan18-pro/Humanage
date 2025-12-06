import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const Settings = () => {
  const { updateSettings, getSettings } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const [settings, setSettings] = useState({
    // General Settings
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    notifyNewEmployee: true,
    notifyAttendance: false,
    notifyPayroll: true,
    notifyPerformance: true,
    
    // Appearance Settings
    theme: 'light',
    sidebarCollapsed: false,
    compactView: false,
    
    // Privacy Settings
    profileVisibility: 'all',
    showEmail: true,
    showPhone: false,
    
    // System Settings
    autoLogout: true,
    sessionTimeout: 30,
    twoFactorAuth: false
  });

  useEffect(() => {
    const savedSettings = getSettings();
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      setSettings({ ...settings, ...savedSettings });
    }
  }, []);

  const handleChange = (field, value) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleSave = () => {
    const result = updateSettings(settings);
    if (result.success) {
      setToast({ show: true, message: 'Settings saved successfully!', type: 'success' });
    } else {
      setToast({ show: true, message: 'Failed to save settings', type: 'error' });
    }
  };

  const handleReset = () => {
    const savedSettings = getSettings();
    setSettings({ ...settings, ...savedSettings });
    setToast({ show: true, message: 'Settings reset to last saved state', type: 'info' });
  };

  return (
    <div className="settings-page">
      {/* Settings Header */}
      <div className="settings-header">
        <div>
          <h2>System Settings</h2>
          <p>Manage your account preferences and system configuration</p>
        </div>
        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            <i className="fas fa-undo"></i>
            Reset
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <i className="fas fa-save"></i>
            Save Changes
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* Settings Tabs */}
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="fas fa-cog"></i>
            <span>General</span>
          </button>

          <button 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <i className="fas fa-palette"></i>
            <span>Appearance</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <i className="fas fa-shield-alt"></i>
            <span>Privacy</span>
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="fas fa-lock"></i>
            <span>Security</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-panel">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              
              <div className="setting-item">
                <div className="setting-info">
                  <label>Language</label>
                  <p>Choose your preferred language</p>
                </div>
                <select 
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  <option value="en">English</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Timezone</label>
                  <p>Set your local timezone</p>
                </div>
                <select 
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Time Format</label>
                  <p>12-hour or 24-hour format</p>
                </div>
                <select 
                  value={settings.timeFormat}
                  onChange={(e) => handleChange('timeFormat', e.target.value)}
                >
                  <option value="12">12-hour</option>
                  <option value="24">24-hour</option>
                </select>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3>Appearance Settings</h3>
              
              <div className="setting-item">
                <div className="setting-info">
                  <label>Theme</label>
                  <p>Choose light or dark mode</p>
                </div>
                <select 
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Sidebar State</label>
                  <p>Keep sidebar collapsed by default</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.sidebarCollapsed}
                    onChange={(e) => handleChange('sidebarCollapsed', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Compact View</label>
                  <p>Use compact layout for tables and lists</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.compactView}
                    onChange={(e) => handleChange('compactView', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h3>Privacy Settings</h3>
              
              <div className="setting-item">
                <div className="setting-info">
                  <label>Profile Visibility</label>
                  <p>Who can see your profile</p>
                </div>
                <select 
                  value={settings.profileVisibility}
                  onChange={(e) => handleChange('profileVisibility', e.target.value)}
                >
                  <option value="all">Everyone</option>
                  <option value="department">My Department</option>
                  <option value="managers">Managers Only</option>
                  <option value="none">Private</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Show Email Address</label>
                  <p>Display email on your profile</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.showEmail}
                    onChange={(e) => handleChange('showEmail', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Show Phone Number</label>
                  <p>Display phone on your profile</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.showPhone}
                    onChange={(e) => handleChange('showPhone', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              
              <div className="setting-item">
                <div className="setting-info">
                  <label>Auto Logout</label>
                  <p>Automatically log out after inactivity</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.autoLogout}
                    onChange={(e) => handleChange('autoLogout', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {settings.autoLogout && (
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Session Timeout</label>
                    <p>Minutes of inactivity before logout</p>
                  </div>
                  <select 
                    value={settings.sessionTimeout}
                    onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              )}

              <div className="setting-item">
                <div className="setting-info">
                  <label>Two-Factor Authentication</label>
                  <p>Add an extra layer of security</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleChange('twoFactorAuth', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-divider"></div>
              
              <div className="setting-item">
                <button className="btn btn-warning">
                  <i className="fas fa-key"></i>
                  Change Password
                </button>
              </div>

              <div className="setting-item">
                <button className="btn btn-info">
                  <i className="fas fa-history"></i>
                  View Login History
                </button>
              </div>

              <div className="setting-item">
                <button className="btn btn-danger">
                  <i className="fas fa-sign-out-alt"></i>
                  Logout All Devices
                </button>
              </div>
            </div>
          )}
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

export default Settings;