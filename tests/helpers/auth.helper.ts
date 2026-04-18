/**
 * Authentication Test Helper
 * Provides real JWT tokens for API testing
 */

import { apiFetch } from "@/lib/apiFetch";

const API_BASE = process.env.API_BASE_URL || 'http://localhost:9000';

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: any, timeout = 3000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await apiFetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - backend not responding');
    }
    throw error;
  }
}

/**
 * Get a valid JWT token for testing
 * Uses real login endpoint to authenticate
 */
export async function getTestAuthToken(): Promise<string> {
  console.log(`🔐 Attempting login at ${API_BASE}/api/auth/login`);

  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'dhruv-test01',
        password: '123456',
      }),
    }, 5000);

    console.log(`📡 Login response status: ${response.status}`);

    if (!response.ok) {
      console.warn('⚠️  Primary login failed, trying admin credentials...');
      // Try admin credentials as fallback
      const adminResponse = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'Admin@123',
        }),
      }, 5000);

      console.log(`📡 Admin login response status: ${adminResponse.status}`);

      if (!adminResponse.ok) {
        throw new Error(`Failed to authenticate: ${adminResponse.status}`);
      }

      const adminData = await adminResponse.json();
      console.log('✅ Got admin token from login:', adminData.token ? adminData.token.substring(0, 50) + '...' : 'NONE');
      return adminData.token;
    }

    const data = await response.json();
    console.log('✅ Got user token from login:', data.token ? data.token.substring(0, 50) + '...' : 'NONE');
    console.log(`🔍 Token length: ${data.token.length} characters`);
    return data.token;
  } catch (error: any) {
    console.error('❌ Authentication error:', error.message);
    if (error.message.includes('timeout')) {
      throw new Error('Backend not responding - is it running? (npm run dev)');
    }
    throw new Error(`Could not authenticate: ${error.message}`);
  }
}

/**
 * Get admin JWT token for testing
 */
export async function getAdminAuthToken(): Promise<string> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin@123',
      }),
    }, 5000);

    if (!response.ok) {
      throw new Error(`Failed to authenticate as admin: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error: any) {
    if (error.message.includes('timeout')) {
      throw new Error('Backend not responding - is it running? (npm run dev)');
    }
    throw new Error(`Could not authenticate as admin: ${error.message}`);
  }
}

/**
 * Check if backend is available
 * Retries up to 3 times with increasing timeouts to allow backend services to initialize
 */
export async function isBackendAvailable(): Promise<boolean> {
  const retries = 3;
  const timeouts = [2000, 4000, 6000]; // Progressive timeouts

  for (let i = 0; i < retries; i++) {
    console.log(`🏥 Checking backend health at ${API_BASE}/api/health (attempt ${i + 1}/${retries})`);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/health`, {
        method: 'GET',
      }, timeouts[i]);
      console.log(`📡 Health check status: ${response.status}`);

      if (response.ok) {
        console.log('✅ Backend is healthy and ready!');
        return true;
      }

      // If not OK, wait a bit and retry
      if (i < retries - 1) {
        console.log(`⏳ Backend not ready (status ${response.status}), retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`❌ Backend health check failed: ${error.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.error('❌ Backend is not available after 3 attempts');
  return false;
}

/**
 * Create test user for API testing
 * Note: Only use in test environment!
 */
export async function createTestUser(adminToken: string): Promise<void> {
  try {
    await apiFetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'testuser@test.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      }),
    });
  } catch (error) {
    console.log('Test user may already exist or backend unavailable');
  }
}
