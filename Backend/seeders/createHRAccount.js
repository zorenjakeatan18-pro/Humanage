// seeders/createHRAccount.js - Simple HR Account Seeder
const mongoose = require('mongoose');
require('dotenv').config();

console.log('Starting seeder...\n');

// Import User model
console.log('Loading User model...');
const User = require('../models/User');
console.log('User model loaded!\n');

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    process.exit(1);
  }
};

// Create HR Account
const createHRAccount = async () => {
  try {
    console.log('🌱 Creating HR Accounts...\n');

    // Connect to database
    await connectDB();

    // HR Account data - First Account
    const hrAccount1 = {
      name: 'HR Admin',
      email: 'hr@humanage.com',
      password: 'hr123456',
      role: 'admin',
      department: 'HR Staff',
      position: 'HR Administrator',
      avatar: 'HR',
      phone: '09171234567',
      bio: 'HR administrator with full system access',
      isActive: true
    };

    // HR Account data - Second Account
    const hrAccount2 = {
      name: 'HR Manager',
      email: 'hrmanager@humanage.com',
      password: 'hrmanager123',
      role: 'admin',
      department: 'HR Staff',
      position: 'HR Manager',
      avatar: 'HM',
      phone: '09187654321',
      bio: 'HR manager with full system access',
      isActive: true
    };

    const accounts = [hrAccount1, hrAccount2];

    // Process each account
    for (const hrAccount of accounts) {
      console.log(`\nProcessing: ${hrAccount.email}`);
      console.log('Checking for existing account...');
      
      const existing = await User.findOne({ email: hrAccount.email });
      
      if (existing) {
        console.log(`⚠️  Account already exists: ${existing.email}`);
        console.log('   Updating password...');
        
        existing.password = hrAccount.password;
        await existing.save();
        console.log('✅ Password updated!');
      } else {
        console.log('Creating new account...');
        await User.create(hrAccount);
        console.log(`✅ Account Created: ${hrAccount.email}`);
      }
    }

    // Display credentials
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║         HR ACCOUNT CREDENTIALS            ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║                                           ║');
    console.log('║  Account 1:                               ║');
    console.log('║  Email:    hr@humanage.com                ║');
    console.log('║  Password: hr123456                       ║');
    console.log('║  Role:     admin                          ║');
    console.log('║                                           ║');
    console.log('║  Account 2:                               ║');
    console.log('║  Email:    hrmanager@humanage.com         ║');
    console.log('║  Password: hrmanager123                   ║');
    console.log('║  Role:     admin                          ║');
    console.log('║                                           ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');
    console.log('🎉 Ready to login at: http://localhost:5173');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    console.log('Closing connection...');
    await mongoose.connection.close();
    console.log('👋 Done!\n');
    process.exit(0);
  }
};

// Run seeder
createHRAccount();