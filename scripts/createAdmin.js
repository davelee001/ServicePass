/**
 * Admin User Creation Script
 * 
 * This script creates an admin user in the database.
 * Run with: node scripts/createAdmin.js
 */

const path = require('path');
const { createRequire } = require('module');
const backendRequire = createRequire(path.join(__dirname, '../backend/package.json'));
const mongoose = backendRequire('mongoose');
const dotenv = backendRequire('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/src/models/User');

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicepass';
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        // Admin details
        const adminEmail = process.argv[2] || 'admin@servicepass.com';
        const adminPassword = process.argv[3] || process.env.ADMIN_PASSWORD;
        const adminUsername = process.argv[5] || process.env.ADMIN_USERNAME || 'Admin';
        const adminName = process.argv[4] || 'System Administrator';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('✗ Admin user already exists with this email');
            process.exit(1);
        }

        // Create admin user
        const admin = new User({
            email: adminEmail,
            password: adminPassword,
            name: adminName,
            role: 'admin',
            isVerified: true,
            isActive: true,
        });

        await admin.save();

        console.log('\n✓ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Name:     ${adminName}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  Please change the password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('✗ Error creating admin:', error.message);
        process.exit(1);
    }
};

// Check if script is run directly
if (require.main === module) {
    console.log('\n🔧 ServicePass Admin User Creation Tool\n');
    
    if (process.argv.includes('--help')) {
        console.log('Usage: node scripts/createAdmin.js [email] [password] [name]');
        console.log('\nExamples:');
        console.log('  node scripts/createAdmin.js');
        console.log('  node scripts/createAdmin.js admin@example.com MySecurePass123 "John Admin"');
        console.log('\nDefaults:');
        console.log('  Email:    admin@servicepass.com');
        console.log('  Password: Admin123456');
        console.log('  Name:     System Administrator\n');
        process.exit(0);
    }

    createAdmin();
}

module.exports = createAdmin;
