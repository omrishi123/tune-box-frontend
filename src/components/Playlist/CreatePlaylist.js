import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const CreatePlaylist = ({ open, onClose }) => {
  const [playlistName, setPlaylistName] = useState('');

  const handleCreate = async () => {
    if (!playlistName.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/playlists`), {
        name: playlistName,
        createdAt: new Date(),
        songs: []
      });
      setPlaylistName('');
      onClose();
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Playlist</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Playlist Name"
          fullWidth
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} color="primary">Create</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePlaylist;
