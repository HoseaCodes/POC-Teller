import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for your API Gateway
const API_BASE_URL = 'https://xymup983j0.execute-api.us-east-1.amazonaws.com/dev';

// Storage key for access token
const ACCESS_TOKEN_KEY = '@teller_access_token';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Platform': Platform.OS,
  },
  timeout: 30000, // 30 seconds timeout
});

// Add request interceptor to add auth token if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get any user auth token you might be using
      // This is separate from the Teller access token which is passed
      // directly to specific endpoints
      const userToken = await AsyncStorage.getItem('@user_token');
      
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    } catch (error) {
      console.error('Error adding auth token to request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * API client for Teller-related operations
 */
export const TellerAPI = {
  /**
   * Save Teller access token to secure storage
   * @param {string} accessToken - Teller access token
   * @returns {Promise<void>}
   */
  saveAccessToken: async (accessToken) => {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } catch (error) {
      console.error('Error saving Teller access token:', error);
      throw error;
    }
  },

  /**
   * Get Teller access token from secure storage
   * @returns {Promise<string|null>} - Teller access token or null
   */
  getAccessToken: async () => {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting Teller access token:', error);
      return null;
    }
  },

  /**
   * Clear Teller access token
   * @returns {Promise<void>}
   */
  clearAccessToken: async () => {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing Teller access token:', error);
      throw error;
    }
  },

  /**
   * Get accounts from Teller API
   * @param {string} accessToken - Teller access token
   * @returns {Promise<Array>} - Array of accounts
   */
  getAccounts: async (accessToken) => {
    try {
      const response = await apiClient.post('/accounts', { accessToken });
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  /**
   * Get transactions for an account from Teller API
   * @param {string} accessToken - Teller access token 
   * @param {string} accountId - Account ID
   * @returns {Promise<Array>} - Array of transactions
   */
  getTransactions: async (accessToken, accountId) => {
    try {
      const response = await apiClient.post('/transactions', { 
        accessToken,
        accountId 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  /**
   * Get account balances from Teller API
   * @param {string} accessToken - Teller access token
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} - Account balances
   */
  getBalances: async (accessToken, accountId) => {
    try {
      const response = await apiClient.post('/balances', { 
        accessToken,
        accountId 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching balances:', error);
      throw error;
    }
  },

  /**
   * Process a successful Teller enrollment
   * @param {Object} enrollment - Enrollment data from Teller Connect
   * @returns {Promise<Object>} - Processing result
   */
  processEnrollment: async (enrollment) => {
    try {
      // First save the access token locally
      await TellerAPI.saveAccessToken(enrollment.accessToken);
      
      // Then send to your backend for processing
      const response = await apiClient.post('/process-enrollment', { 
        enrollment 
      });
      
      return response.data;
    } catch (error) {
      console.error('Error processing enrollment:', error);
      throw error;
    }
  }
};

export default apiClient;