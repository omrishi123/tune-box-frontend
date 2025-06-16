import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Fab,
  AppBar,
  Toolbar,
  Dialog
} from '@mui/material';
import { Close, Add, PlayArrow, ChevronRight } from '@mui/icons-material';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useRecoilState } from 'recoil';
import { currentSongState, queueState } from '../../atoms/playerAtoms';
import PlaylistModal from './PlaylistModal';
import PlaylistView from './PlaylistView';

const MobilePlaylistView = ({ onClose }) => {
  const [playlists, setPlaylists] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [, setCurrentSong] = useRecoilState(currentSongState);
  const [, setQueue] = useRecoilState(queueState);

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

  const handlePlayPlaylist = (e, playlist) => {
    e.stopPropagation();
    if (playlist.songs && playlist.songs.length > 0) {
      setCurrentSong(playlist.songs[0]);
      setQueue(playlist.songs);
    }
  };

  const handlePlaylistClick = async (playlist) => {
    try {
      const playlistRef = doc(db, `users/${auth.currentUser.uid}/playlists/${playlist.id}`);
      const playlistDoc = await getDoc(playlistRef);
      
      if (playlistDoc.exists()) {
        const playlistData = playlistDoc.data();
        setSelectedPlaylist({
          id: playlistDoc.id,
          ...playlistData,
          songs: playlistData.songs || [] // Ensure songs array exists
        });
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    }
  };

  const handleBack = () => {
    setSelectedPlaylist(null);
  };

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {selectedPlaylist ? selectedPlaylist.name : 'Your Playlists'}
          </Typography>
          {selectedPlaylist && (
            <IconButton color="inherit" onClick={handleBack}>
              <Close />
            </IconButton>
          )}
          {!selectedPlaylist && (
            <IconButton color="inherit" onClick={onClose}>
              <Close />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {!selectedPlaylist ? (
        <>
          <List sx={{ pb: 8 }}>
            {playlists.map((playlist) => (
              <ListItem
                key={playlist.id}
                onClick={() => handlePlaylistClick(playlist)}
                button
              >
                <ListItemAvatar>
                  <Avatar>
                    <PlayArrow />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={playlist.name}
                  secondary={`${playlist.songs?.length || 0} songs`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={(e) => handlePlayPlaylist(e, playlist)}
                  >
                    <PlayArrow />
                  </IconButton>
                  <IconButton edge="end">
                    <ChevronRight />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 80, right: 16 }}
            onClick={() => setCreateOpen(true)}
          >
            <Add />
          </Fab>
        </>
      ) : (
        <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <PlaylistView 
            playlist={selectedPlaylist} 
            onClose={handleBack}
            isMobile={true}
          />
        </Box>
      )}

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
      >
        <PlaylistModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      </Dialog>
    </Box>
  );
};

export default MobilePlaylistView;