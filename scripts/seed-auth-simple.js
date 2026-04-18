const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables - try .env.local first, then .env
// Use { override: true } to allow overriding existing env vars
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ioc-analyzer';

// console.log('📋 Environment Configuration:');
// console.log(`  MONGODB_URI defined: ${!!process.env.MONGODB_URI}`);
// console.log(`  Full MONGODB_URI: ${process.env.MONGODB_URI}`);
// console.log(`  Using URI: ${MONGO_URI.substring(0, 100)}...`);

// Define User schema inline
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function seedAuthAccounts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const accounts = [
      {
        email: 'admin@ioc.com',
        username: 'admin',
        password: 'Admin@214161',
      },
      {
        email: 'user@ioc.com',
        username: 'user',
        password: 'User@1233211',
      },
      {
        email: 'user2@ioc.com',
        username: 'user1',
        password: 'User@12332111',
      },
    ];

    for (const account of accounts) {
      const existingUser = await User.findOne({
        $or: [{ email: account.email }, { username: account.username }],
      });

      if (existingUser) {
        console.log(`⊘ User ${account.username} already exists, skipping...`);
      } else {
        const newUser = new User({
          email: account.email,
          username: account.username,
          password: account.password,
        });

        await newUser.save();
        console.log(`✓ Created user: ${account.username} (${account.email})`);
      }
    }

    console.log('\n✓ Authentication accounts seeded successfully!\n');
    // console.log('📋 Login Credentials:');
    // console.log('  Email: admin@ioc.com | Password: Admin@214161');
    // console.log('  Email: user@ioc.com | Password: User@1233211');
    // console.log('  Email: user2@ioc.com | Password: User@12332111\n');

  } catch (error) {
    console.error('❌ Error seeding auth accounts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedAuthAccounts();
