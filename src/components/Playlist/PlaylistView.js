import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, List, ListItem, ListItemText, ListItemAvatar, 
  Avatar, IconButton, Button, Menu, MenuItem, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress 
} from '@mui/material';
import { 
  PlayArrow, MoreVert, Edit, Delete, 
  CheckBox 
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useRecoilState } from 'recoil';
import { currentSongState, queueState } from '../../atoms/playerAtoms';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PlaylistView = ({ playlist: initialPlaylist, onClose = () => {}, isMobile = false }) => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [, setCurrentSong] = useRecoilState(currentSongState);
  const [, setQueue] = useRecoilState(queueState);
  const [playlist, setPlaylist] = useState(initialPlaylist);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!auth.currentUser || (!playlistId && !initialPlaylist)) return;
      
      try {
        setLoading(true);
        if (initialPlaylist) {
          setPlaylist(initialPlaylist);
          setNewName(initialPlaylist.name);
          setLoading(false);
          return;
        }

        const docRef = doc(db, `users/${auth.currentUser.uid}/playlists/${playlistId}`);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setPlaylist(data);
          setNewName(data.name);
        }
      } catch (error) {
        console.error('Error fetching playlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId, initialPlaylist]);

  const handlePlayAll = () => {
    if (!playlist?.songs?.length) return;
    setCurrentSong(playlist.songs[0]);
    setQueue(playlist.songs);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditName = async () => {
    if (!newName.trim()) return;
    try {
      const playlistRef = doc(db, `users/${auth.currentUser.uid}/playlists/${playlist.id}`);
      await updateDoc(playlistRef, { name: newName });
      setIsEditing(false);
      handleMenuClose();
    } catch (error) {
      console.error('Error updating playlist name:', error);
    }
  };

  const handleDeletePlaylist = async () => {
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/playlists/${playlist.id}`));
      toast.success('Playlist deleted successfully!');
      if (onClose) {
        onClose();
      } else {
        navigate('/library');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  const handleToggleSelection = (songId) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const handleRemoveSelected = async () => {
    try {
      const updatedSongs = playlist.songs.filter(song => !selectedSongs.includes(song.id));
      const playlistRef = doc(db, `users/${auth.currentUser.uid}/playlists/${playlist.id}`);
      await updateDoc(playlistRef, { songs: updatedSongs });
      toast.success(`${selectedSongs.length} song(s) removed from playlist`);
      setSelectedSongs([]);
      setIsSelectionMode(false);
      setPlaylist({ ...playlist, songs: updatedSongs });
    } catch (error) {
      console.error('Error removing songs:', error);
      toast.error('Failed to remove selected songs');
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setAnchorEl(null);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ 
      p: isMobile ? 2 : 3,
      height: isMobile ? 'calc(100vh - 64px)' : 'auto',
      overflow: 'auto'
    }}>
      {playlist && (
        <>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              sx={{ 
                flexGrow: 1,
                mb: isMobile ? 1 : 0 
              }} 
              gutterBottom
            >
              {playlist.name}
            </Typography>
            <Button
              startIcon={<PlayArrow />}
              variant="contained"
              onClick={handlePlayAll}
              sx={{ mr: 1 }}
              size={isMobile ? "small" : "medium"}
            >
              Play All
            </Button>
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { setIsEditing(true); handleMenuClose(); }}>
              <Edit sx={{ mr: 1 }} /> Edit Name
            </MenuItem>
            <MenuItem onClick={() => { setIsSelectionMode(true); handleMenuClose(); }}>
              <CheckBox sx={{ mr: 1 }} /> Select Songs
            </MenuItem>
            <MenuItem onClick={handleDeletePlaylist}>
              <Delete sx={{ mr: 1 }} /> Delete Playlist
            </MenuItem>
          </Menu>

          <Dialog open={isEditing} onClose={handleClose}>
            <DialogTitle>Edit Playlist Name</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                fullWidth
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleEditName}>Save</Button>
            </DialogActions>
          </Dialog>

          {isSelectionMode && selectedSongs.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={handleRemoveSelected}
                startIcon={<Delete />}
              >
                Remove Selected ({selectedSongs.length})
              </Button>
            </Box>
          )}

          <List>
            {playlist.songs.map((song) => (
              <ListItem
                key={song.id}
                secondaryAction={
                  isSelectionMode ? (
                    <Checkbox
                      checked={selectedSongs.includes(song.id)}
                      onChange={() => handleToggleSelection(song.id)}
                    />
                  ) : (
                    <IconButton onClick={() => {
                      setCurrentSong(song);
                      setQueue([song, ...playlist.songs.filter(s => s.id !== song.id)]);
                    }}>
                      <PlayArrow />
                    </IconButton>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar src={song.thumbnail} alt={song.title} />
                </ListItemAvatar>
                <ListItemText 
                  primary={song.title}
                  secondary={song.artist}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default PlaylistView;
