import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { collection, query, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { toast } from 'react-hot-toast';

const AddToPlaylist = ({ open, onClose, song }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, `users/${auth.currentUser.uid}/playlists`));
        const snapshot = await getDocs(q);
        setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handleAddToPlaylist = async (playlistId) => {
    try {
      const playlistRef = doc(db, `users/${auth.currentUser.uid}/playlists/${playlistId}`);
      await updateDoc(playlistRef, {
        songs: arrayUnion(song)
      });
      toast.success('Song added to playlist successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      toast.error('Failed to add song to playlist');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add to Playlist</DialogTitle>
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {playlists.map((playlist) => (
            <ListItem 
              button 
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id)}
            >
              <ListItemText primary={playlist.name} />
            </ListItem>
          ))}
        </List>
      )}
    </Dialog>
  );
};

export default AddToPlaylist;
