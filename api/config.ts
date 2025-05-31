import axios from 'axios';

// Backend URL configuration for different development scenarios
const getBaseURL = () => {
  // For Android Emulator: use 10.0.2.2 to access host localhost
  // For iOS Simulator: use localhost
  // For Physical Device: use your computer's IP address
  
  // Android Emulator
  return 'http://10.0.2.2:3000/';
  
  // iOS Simulator (uncomment if testing on iOS)
  // return 'http://localhost:3000/';
  
  // Physical Device (replace with your computer's IP)
  // return 'http://192.168.1.XXX:3000/';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 5000, // Reduced timeout for faster fallback to mock data
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    // Add auth token if available (for future authentication implementation)
    // In React Native, use AsyncStorage instead of localStorage
    // const token = await AsyncStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - implement authentication');
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      // Network error - backend likely not running, will fall back to mock data
      console.info('Backend not available, using mock data');
    }
    
    return Promise.reject(error);
  }
);

export default api; 