
//https://supporthub-backend-widget-and-platform-production-cf49.up.railway.app
export const BACKEND_URL = 'http://localhost:8080';

export const getAuthHeaders = () => {
  const jwt = localStorage.getItem('jwt');
  const apiKey = localStorage.getItem('apiKey');
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(jwt && { 'Authorization': `Bearer ${jwt}` }),
    ...(apiKey && { 'X-API-KEY': apiKey }),
  };
};