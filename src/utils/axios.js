import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://tune-box-backend.vercel.app'
  : `http://${window.location.hostname}:5000`;

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 10000
});

instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 500) {
      console.error('Server Error:', error);
      return Promise.resolve({ data: [] }); // Return empty array on server error
    }
    return Promise.reject(error);
  }
);

export default instance;
