import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://tune-box-backend.vercel.app'
  : `http://${window.location.hostname}:5000`;

const instance = axios.create({
  baseURL,
  withCredentials: true
});


  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
;

export default instance;
