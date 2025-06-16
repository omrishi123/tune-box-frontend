import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography, Button, Avatar, Divider, IconButton } from '@mui/material';
import { Home, Search, LibraryMusic, Login, Logout, Add as AddIcon } from '@mui/icons-material';
import styled from 'styled-components';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import PlaylistModal from '../Playlist/PlaylistModal';

const StyledNavLink = styled(NavLink)`
  text-decoration: none;
  color: inherit;
  &.active {
    color: #1db954;
  }
`;

const ProfileSection = styled(Box)`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Sidebar = ({ user }) => {
  const [playlists, setPlaylists] = useState([]);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);

  const handleLogout = () => {
    signOut(auth);
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const playlistsRef = collection(db, `users/${auth.currentUser.uid}/playlists`);
    const unsubscribe = onSnapshot(playlistsRef, (snapshot) => {
      const playlistsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlaylists(playlistsData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Box sx={{ width: 240, bgcolor: 'background.paper', p: 2, overflowY: 'auto' }}>
      {user && (
        <>
          <ProfileSection>
            <Avatar 
              src={user.photoURL}
              alt={user.displayName}
              sx={{ 
                width: 64, 
                height: 64,
                mb: 1,
                border: '2px solid #1db954'
              }}
            />
            <Typography variant="subtitle1" sx={{ color: 'white' }}>
              {user.displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'gray' }}>
              {user.email}
            </Typography>
          </ProfileSection>
          <Divider sx={{ my: 2 }} />
        </>
      )}
      <Typography variant="h6" sx={{ p: 2 }}>Music Player</Typography>
      <List>
        <StyledNavLink to="/">
          <ListItem button>
            <ListItemIcon><Home sx={{ color: 'white' }}/></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
        </StyledNavLink>
        <StyledNavLink to="/search">
          <ListItem button>
            <ListItemIcon><Search sx={{ color: 'white' }}/></ListItemIcon>
            <ListItemText primary="Search" />
          </ListItem>
        </StyledNavLink>
        <StyledNavLink to="/library">
          <ListItem button>
            <ListItemIcon><LibraryMusic sx={{ color: 'white' }}/></ListItemIcon>
            <ListItemText primary="Your Library" />
          </ListItem>
        </StyledNavLink>
      </List>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, mb: 1 }}>
        <Typography variant="subtitle1" sx={{ color: 'white' }}>Your Playlists</Typography>
        <IconButton onClick={() => setPlaylistModalOpen(true)} size="small" sx={{ color: 'white' }}>
          <AddIcon />
        </IconButton>
      </Box>
      <List>
        {playlists.map((playlist) => (
          <StyledNavLink to={`/playlist/${playlist.id}`} key={playlist.id}>
            <ListItem button>
              <ListItemIcon>
                <LibraryMusic sx={{ color: 'white' }} />
              </ListItemIcon>
              <ListItemText 
                primary={playlist.name}
                secondary={`${playlist.songs?.length || 0} songs`}
                sx={{ color: 'white' }}
              />
            </ListItem>
          </StyledNavLink>
        ))}
      </List>
      <PlaylistModal
        open={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
      />
      <Box sx={{ mt: 'auto', p: 2 }}>
        {user ? (
          <Button
            fullWidth
            startIcon={<Logout />}
            onClick={handleLogout}
            variant="outlined"
            color="secondary"
          >
            Logout
          </Button>
        ) : (
          <Button
            fullWidth
            startIcon={<Login />}
            component={Link}
            to="/login"
            variant="contained"
            color="primary"
          >
            Login
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
