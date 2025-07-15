// Jest setup file for API tests
const axios = require('axios');

// Set longer timeout for API calls
jest.setTimeout(30000);

// Configure axios defaults
axios.defaults.timeout = 10000;
axios.defaults.validateStatus = function (status) {
  return status < 500; // Don't throw for 4xx errors
};

// Global test helpers
global.testHelpers = {
  generateUniqueEmail: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
  generateUsername: () => `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  waitForServer: async (url = 'http://localhost:5000/api/service-status', retries = 10) => {
    for (let i = 0; i < retries; i++) {
      try {
        await axios.get(url);
        return true;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};