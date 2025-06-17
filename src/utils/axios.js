import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://tune-box-backend.vercel.app'
  : `http://${window.location.hostname}:5000`;

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false // Changed to false for Vercel deployment
});

instance.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default instance;
