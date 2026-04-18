// Test setup and global configurations
import { jest } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file for JWT_SECRET and other configs
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Mock environment variables for test databases
process.env.MONGODB_URI = 'mongodb://localhost:27017/ioc-test';
process.env.OPENSEARCH_NODE = 'http://localhost:9200';
process.env.SKIP_RATE_LIMIT = 'true'; // Disable rate limiting for tests
// JWT_SECRET is loaded from .env file above - DO NOT override it
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });

// Global test utilities
global.console = {
  ...console,
  // Temporarily enable console.log for debugging auth issues
  log: console.log, // TEMP: Was jest.fn()
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};
