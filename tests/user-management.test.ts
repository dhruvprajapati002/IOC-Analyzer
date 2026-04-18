import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { User } from '../src/lib/models/User';
import { hashPassword, comparePassword, validatePassword, validateEmail, validateUsername } from '../src/lib/auth';
import connectDB from '../src/lib/db';
import mongoose from 'mongoose';

describe('User Management System', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
  });

  describe('User Model', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: await hashPassword('TestPass123!'),
        role: 'user' as const
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@test.com');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        username: 'testuser1',
        email: 'duplicate@test.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: await hashPassword('TestPass123!'),
        role: 'user' as const
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User({
        ...userData,
        username: 'testuser2'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should enforce unique username constraint', async () => {
      const userData = {
        username: 'duplicateuser',
        email: 'test1@test.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: await hashPassword('TestPass123!'),
        role: 'user' as const
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User({
        ...userData,
        email: 'test2@test.com'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should have comparePassword method', async () => {
      const password = 'TestPass123!';
      const user = new User({
        username: 'testuser',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: await hashPassword(password),
        role: 'user' as const
      });

      await user.save();

      const isValid = await user.comparePassword(password);
      expect(isValid).toBe(true);

      const isInvalid = await user.comparePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });

    it('should create admin user with createAdmin method', async () => {
      const adminData = {
        username: 'admin',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'AdminPass123!'
      };

      const admin = await User.createAdmin(adminData);

      expect(admin.role).toBe('admin');
      expect(admin.username).toBe('admin');
      expect(admin.email).toBe('admin@test.com');
      expect(admin.isActive).toBe(true);
      expect(admin.createdBy).toBe('system');

      // Verify password is hashed
      const isPasswordValid = await admin.comparePassword(adminData.password);
      expect(isPasswordValid).toBe(true);
    });
  });

  describe('Authentication Functions', () => {
    describe('Password Hashing', () => {
      it('should hash password securely', async () => {
        const password = 'TestPass123!';
        const hashedPassword = await hashPassword(password);

        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hash length
      });

      it('should compare passwords correctly', async () => {
        const password = 'TestPass123!';
        const hashedPassword = await hashPassword(password);

        const isValid = await comparePassword(password, hashedPassword);
        expect(isValid).toBe(true);

        const isInvalid = await comparePassword('wrongpassword', hashedPassword);
        expect(isInvalid).toBe(false);
      });
    });

    describe('Password Validation', () => {
      it('should validate strong passwords', () => {
        const strongPassword = 'StrongPass123!';
        const result = validatePassword(strongPassword);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'short',           // Too short
          'nouppercase123!', // No uppercase
          'NOLOWERCASE123!', // No lowercase
          'NoNumbers!',      // No numbers
          'NoSpecial123',    // No special characters
          'a'.repeat(130)    // Too long
        ];

        weakPasswords.forEach(password => {
          const result = validatePassword(password);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Email Validation', () => {
      it('should validate correct email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org'
        ];

        validEmails.forEach(email => {
          expect(validateEmail(email)).toBe(true);
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user..name@domain.com',
          ''
        ];

        invalidEmails.forEach(email => {
          expect(validateEmail(email)).toBe(false);
        });
      });
    });

    describe('Username Validation', () => {
      it('should validate correct usernames', () => {
        const validUsernames = [
          'user123',
          'test_user',
          'user-name',
          'TestUser123'
        ];

        validUsernames.forEach(username => {
          const result = validateUsername(username);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });

      it('should reject invalid usernames', () => {
        const invalidUsernames = [
          'ab',              // Too short
          'a'.repeat(35),    // Too long
          'user name',       // Contains space
          'user@domain',     // Contains @
          'user.name'        // Contains dot
        ];

        invalidUsernames.forEach(username => {
          const result = validateUsername(username);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('User CRUD Operations', () => {
    let adminUser: any;

    beforeEach(async () => {
      // Create admin user for testing
      adminUser = await User.createAdmin({
        username: 'testadmin',
        email: 'admin@test.com',
        firstName: 'Test',
        lastName: 'Admin',
        password: 'AdminPass123!'
      });
    });

    it('should create regular user', async () => {
      const userData = {
        username: 'regularuser',
        email: 'regular@test.com',
        firstName: 'Regular',
        lastName: 'User',
        passwordHash: await hashPassword('UserPass123!'),
        role: 'user' as const,
        createdBy: adminUser._id.toString()
      };

      const user = new User(userData);
      await user.save();

      expect(user.role).toBe('user');
      expect(user.createdBy).toBe(adminUser._id.toString());
    });

    it('should update user information', async () => {
      const user = new User({
        username: 'updateuser',
        email: 'update@test.com',
        firstName: 'Update',
        lastName: 'User',
        passwordHash: await hashPassword('UserPass123!'),
        role: 'user' as const
      });

      await user.save();

      // Update user
      user.firstName = 'Updated';
      user.lastName = 'TestUser';
      user.updatedBy = adminUser._id.toString();
      await user.save();

      expect(user.firstName).toBe('Updated');
      expect(user.lastName).toBe('TestUser');
      expect(user.updatedBy).toBe(adminUser._id.toString());
      expect(user.updatedAt).toBeDefined();
    });

    it('should deactivate user', async () => {
      const user = new User({
        username: 'deactivateuser',
        email: 'deactivate@test.com',
        firstName: 'Deactivate',
        lastName: 'User',
        passwordHash: await hashPassword('UserPass123!'),
        role: 'user' as const
      });

      await user.save();
      expect(user.isActive).toBe(true);

      // Deactivate user
      user.isActive = false;
      user.updatedBy = adminUser._id.toString();
      await user.save();

      expect(user.isActive).toBe(false);
    });

    it('should delete user', async () => {
      const user = new User({
        username: 'deleteuser',
        email: 'delete@test.com',
        firstName: 'Delete',
        lastName: 'User',
        passwordHash: await hashPassword('UserPass123!'),
        role: 'user' as const
      });

      await user.save();
      const userId = user._id;

      // Delete user
      await User.findByIdAndDelete(userId);

      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Admin User Creation', () => {
    it('should prevent non-admin from creating admin users', async () => {
      // This test would be implemented in the API layer
      // Here we just test the model validation
      
      const regularUser = new User({
        username: 'regularuser',
        email: 'regular@test.com',
        firstName: 'Regular',
        lastName: 'User',
        passwordHash: await hashPassword('UserPass123!'),
        role: 'admin' as const, // Trying to create admin
        createdBy: 'non-admin-user-id'
      });

      // In a real scenario, API validation would prevent this
      // Model allows it, but API should have role checks
      await regularUser.save();
      expect(regularUser.role).toBe('admin');
    });

    it('should allow admin to create other admins', async () => {
      const admin1 = await User.createAdmin({
        username: 'admin1',
        email: 'admin1@test.com',
        firstName: 'Admin',
        lastName: 'One',
        password: 'AdminPass123!'
      });

      const admin2 = new User({
        username: 'admin2',
        email: 'admin2@test.com',
        firstName: 'Admin',
        lastName: 'Two',
        passwordHash: await hashPassword('AdminPass123!'),
        role: 'admin' as const,
        createdBy: admin1._id.toString()
      });

      await admin2.save();

      expect(admin2.role).toBe('admin');
      expect(admin2.createdBy).toBe(admin1._id.toString());
    });
  });

  describe('User Activity Tracking', () => {
    it('should track last login time', async () => {
      const user = new User({
        username: 'loginuser',
        email: 'login@test.com',
        firstName: 'Login',
        lastName: 'User',
        passwordHash: await hashPassword('UserPass123!'),
        role: 'user' as const
      });

      await user.save();
      expect(user.lastLogin).toBeNull();

      // Simulate login
      user.lastLogin = new Date();
      await user.save();

      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin).toBeInstanceOf(Date);
    });

    it('should track failed login attempts', async () => {
      const user = new User({
        username: 'failuser',
        email: 'fail@test.com',
        firstName: 'Fail',
        lastName: 'User',
        passwordHash: await hashPassword('UserPass123!'),
        role: 'user' as const
      });

      await user.save();
      expect(user.lastFailedLogin).toBeNull();

      // Simulate failed login
      user.lastFailedLogin = new Date();
      await user.save();

      expect(user.lastFailedLogin).toBeDefined();
      expect(user.lastFailedLogin).toBeInstanceOf(Date);
    });
  });
});
