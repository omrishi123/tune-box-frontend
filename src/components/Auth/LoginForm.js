import React, { useState } from 'react';
import { TextField, Button, Paper, Box, Typography } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { auth } from '../../config/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from '../../utils/axios';
import toast from 'react-hot-toast';

const FormContainer = styled(Paper)`
  padding: 24px;
  max-width: 400px;
  margin: 100px auto;
`;

const LoginContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 24px;
`;

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/login', credentials);
      localStorage.setItem('token', data.token);
      navigate('/');
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      localStorage.setItem('token', credential.accessToken);
      navigate('/');
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <LoginContainer>
      <Typography variant="h4" gutterBottom>
        Welcome to Music Player
      </Typography>
      <FormContainer>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
          <Button 
            fullWidth 
            variant="contained" 
            color="primary" 
            type="submit"
            style={{ marginTop: 16 }}
          >
            Login
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            onClick={handleGoogleSignIn}
            startIcon={<GoogleIcon />}
            style={{ marginTop: 16 }}
          >
            Sign in with Google
          </Button>
        </form>
      </FormContainer>
    </LoginContainer>
  );
};

export default LoginForm;
