import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { auth } from './config/firebase';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import Sidebar from './components/Layout/Sidebar';
import Player from './components/Player';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import LoginForm from './components/Auth/LoginForm';
import PlaylistView from './components/Playlist/PlaylistView';
import Profile from './pages/Profile';
import useResponsive from './hooks/useResponsive';
import MobileNavigation from './components/Layout/MobileNavigation';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#121212', paper: '#282828' },
    primary: { main: '#1db954' }
  }
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { isMobile } = useResponsive();

  useEffect(() => {
    // Check for guest mode first
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      setUser({ isGuest: true });
      setLoading(false);
      setAuthInitialized(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthInitialized(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Error setting auth persistence:", error);
      }
    };
    
    setupAuth();
  }, []);

  if (loading || !authInitialized) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
          {!isMobile && <Sidebar user={user} />}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 3, 
            pb: isMobile ? 16 : 10,
            paddingBottom: isMobile ? '120px' : '80px'
          }}>
            <Routes>
              {!user ? (
                <Route path="*" element={<LoginForm />} />
              ) : (
                <>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  {!isMobile && <Route path="/library" element={<Library />} />}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/playlist/:playlistId" element={<PlaylistView />} />
                </>
              )}
            </Routes>
          </Box>
          {user && <Player />}
          {isMobile && user && <MobileNavigation />}
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
