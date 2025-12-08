// Application configuration
// Set this to false when ready to use the real backend API
export const APP_CONFIG = {
  useDummyData: true,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};
