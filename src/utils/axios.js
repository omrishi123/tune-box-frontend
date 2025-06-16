import axios from 'axios';

const instance = axios.create({
  baseURL: `http://${window.location.hostname}:5000`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

instance.interceptors.response.use(
  response => response,
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

export default instance;
