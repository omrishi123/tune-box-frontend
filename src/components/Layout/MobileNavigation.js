import React, { useState } from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Dialog } from '@mui/material';
import { Home, Search, QueueMusic, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import MobilePlaylistView from '../Playlist/MobilePlaylistView';

const NavContainer = styled(Paper)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const handleNavigation = (newValue) => {
    if (newValue === 'playlists') {
      setPlaylistOpen(true);
    } else {
      navigate(newValue);
    }
  };

  return (
    <>
      <NavContainer elevation={3}>
        <BottomNavigation
          value={location.pathname}
          onChange={(_, newValue) => handleNavigation(newValue)}
          showLabels
        >
          <BottomNavigationAction
            label="Home"
            value="/"
            icon={<Home />}
          />
          <BottomNavigationAction
            label="Search"
            value="/search"
            icon={<Search />}
          />
          <BottomNavigationAction
            label="Playlists"
            value="playlists"
            icon={<QueueMusic />}
          />
          <BottomNavigationAction
            label="Profile"
            value="/profile"
            icon={<Person />}
          />
        </BottomNavigation>
      </NavContainer>

      <Dialog
        fullScreen
        open={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
      >
        <MobilePlaylistView onClose={() => setPlaylistOpen(false)} />
      </Dialog>
    </>
  );
};

export default MobileNavigation;
