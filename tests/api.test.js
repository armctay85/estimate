const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

describe('EstiMate API Tests', () => {
  let testUser = null;
  let sessionCookie = null;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Service Status', () => {
    test('GET /api/service-status returns service health', async () => {
      const response = await axios.get(`${BASE_URL}/api/service-status`);
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        xai: expect.any(Boolean),
        openai: expect.any(Boolean),
        forge: expect.any(Boolean)
      });
    });
  });

  describe('Authentication Flow', () => {
    test('POST /api/auth/register creates new user', async () => {
      const userData = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        subscriptionTier: 'free'
      };

      const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
      expect(response.status).toBe(201);
      expect(response.data.message).toBe('User created successfully');
      expect(response.data.user).toMatchObject({
        username: userData.username,
        email: userData.email,
        subscriptionTier: 'free'
      });
      
      testUser = userData;
    });

    test('POST /api/auth/login authenticates user', async () => {
      if (!testUser) {
        throw new Error('Test user not created');
      }

      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Login successful');
      expect(response.data.user.email).toBe(testUser.email);
      
      // Store session cookie for authenticated requests
      sessionCookie = response.headers['set-cookie']?.[0];
    });

    test('GET /api/auth/user returns current user when authenticated', async () => {
      if (!sessionCookie) {
        throw new Error('No session cookie available');
      }

      const response = await axios.get(`${BASE_URL}/api/auth/user`, {
        headers: { Cookie: sessionCookie }
      });

      expect(response.status).toBe(200);
      expect(response.data.user.email).toBe(testUser.email);
    });
  });

  describe('Forge API Integration', () => {
    test('POST /api/forge/token generates access token', async () => {
      const response = await axios.post(`${BASE_URL}/api/forge/token`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('expires_in');
    });
  });

  describe('AI Services', () => {
    test('POST /api/ai/cost-prediction processes project data', async () => {
      const projectData = {
        type: 'residential',
        area: 150,
        location: 'Melbourne',
        complexity: 'medium',
        timeline: '3-6 months'
      };

      const response = await axios.post(`${BASE_URL}/api/ai/cost-prediction`, projectData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('predictedCost');
      expect(response.data).toHaveProperty('confidence');
      expect(response.data.predictedCost).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    test('Auth endpoints are rate limited', async () => {
      const requests = [];
      const invalidData = { email: 'invalid', password: 'invalid' };

      // Attempt to exceed rate limit (5 requests per 15 minutes)
      for (let i = 0; i < 7; i++) {
        requests.push(
          axios.post(`${BASE_URL}/api/auth/login`, invalidData)
            .catch(error => error.response)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    test('Security headers are present', async () => {
      const response = await axios.get(`${BASE_URL}/`);
      
      // Check for security headers (helmet middleware)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  afterAll(async () => {
    // Cleanup: logout if we have a session
    if (sessionCookie) {
      try {
        await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
          headers: { Cookie: sessionCookie }
        });
      } catch (error) {
        console.log('Cleanup logout failed:', error.message);
      }
    }
  });
});