import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import { db, auth } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

const PlaylistModal = ({ open, onClose }) => {
  const [name, setName] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !auth.currentUser) return;

    try {
      const playlistRef = collection(db, `users/${auth.currentUser.uid}/playlists`);
      await addDoc(playlistRef, {
        name,
        createdAt: new Date(),
        songs: []
      });
      setName('');
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
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} color="primary">Create</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlaylistModal;
