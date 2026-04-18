const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ioc-analyzer';

// Define User schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const hashedPassword = await bcryptjs.hash(this.password, 10);
    this.password = hashedPassword;
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
    ];

    for (const account of accounts) {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: account.email }, { username: account.username }],
      });

      if (existingUser) {
        console.log(`⚠ User ${account.username} already exists, skipping...`);
      } else {
        // Create new user - password will be hashed by pre-save hook
        const newUser = new User({
          email: account.email,
          username: account.username,
          password: account.password,
        });

        await newUser.save();
        console.log(`✓ Created user: ${account.username} (${account.email})`);
      }
    }

    console.log('✓ Authentication accounts seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin@ioc.com / Admin@214161');
    console.log('  User:  user@ioc.com / User@1233211');
  } catch (error) {
    console.error('✗ Error seeding auth accounts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

seedAuthAccounts();
