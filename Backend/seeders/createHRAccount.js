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
    console.log('🌱 Creating HR Account...\n');

    // Connect to database
    await connectDB();

    // HR Account data
    const hrAccount = {
      name: 'HR Admin',
      email: 'hr@humanage.com',
      password: 'hr123456',  // Changed to 8 characters (meets 6+ requirement)
      role: 'admin',
      department: 'HR Staff',
      position: 'HR Administrator',
      avatar: 'HR',
      phone: '09171234567',
      bio: 'HR administrator with full system access',
      isActive: true
    };

    console.log('Checking for existing account...');
    // Check if account already exists
    const existing = await User.findOne({ email: hrAccount.email });
    
    if (existing) {
      console.log('⚠️  HR account already exists!');
      console.log(`   Email: ${existing.email}`);
      console.log('   Updating password...\n');
      
      // Update password
      existing.password = hrAccount.password;
      await existing.save();
      console.log('✅ Password updated!\n');
    } else {
      console.log('Creating new account...');
      // Create new account
      const user = await User.create(hrAccount);
      console.log('✅ HR Account Created!\n');
    }

    // Display credentials
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║         HR ACCOUNT CREDENTIALS            ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║                                           ║');
    console.log('║  Email:    hr@humanage.com                ║');
    console.log('║  Password: hr123456                       ║');
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