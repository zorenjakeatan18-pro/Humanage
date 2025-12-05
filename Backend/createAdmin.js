// createAdmin.js - Place this file in your Backend folder
// Run with: node createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('\n🚀 Starting Admin User Setup...\n');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    createOrFixAdmin();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  department: String,
  position: String,
  avatar: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createOrFixAdmin() {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@humanage.com' });
    
    if (existingAdmin) {
      console.log('📝 Found existing admin user');
      console.log('   Email:', existingAdmin.email);
      console.log('   Has password?', existingAdmin.password ? 'YES ✅' : 'NO ❌');
      
      if (!existingAdmin.password || existingAdmin.password === '') {
        console.log('\n🔧 Fixing missing password...');
        
        // Hash password manually
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Update directly
        await User.updateOne(
          { email: 'admin@humanage.com' },
          { 
            $set: { 
              password: hashedPassword,
              isActive: true,
              role: 'admin'
            } 
          }
        );
        
        console.log('✅ Password fixed!');
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:    admin@humanage.com');
        console.log('🔐 Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      } else {
        console.log('✅ Admin already has a password');
        console.log('\n⚠️  If you can\'t login, delete this user and run script again');
      }
    } else {
      console.log('📝 No admin found. Creating new admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create new admin
      await User.create({
        name: 'Admin User',
        email: 'admin@humanage.com',
        password: hashedPassword,
        role: 'admin',
        department: 'IT',
        position: 'System Administrator',
        avatar: 'AU',
        isActive: true
      });
      
      console.log('✅ Admin user created!');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:    admin@humanage.com');
      console.log('🔐 Password: admin123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    // Verify the fix
    const verifyUser = await User.findOne({ email: 'admin@humanage.com' });
    console.log('🔍 Verification:');
    console.log('   Password exists?', verifyUser.password ? 'YES ✅' : 'NO ❌');
    console.log('   Password length:', verifyUser.password ? verifyUser.password.length : 0);
    console.log('   Is Active?', verifyUser.isActive ? 'YES ✅' : 'NO ❌');
    
    console.log('\n✅ Setup complete! You can now login.\n');
    
    mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}