import React, { useEffect, useState } from 'react';
import { Box, Avatar, Typography, List, ListItem, ListItemText, ListItemAvatar, Divider, IconButton } from '@mui/material';
import { PlayArrow, ExitToApp } from '@mui/icons-material';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useRecoilState } from 'recoil';
import { currentSongState, queueState } from '../atoms/playerAtoms';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [history, setHistory] = useState([]);
  const [, setCurrentSong] = useRecoilState(currentSongState);
  const [, setQueue] = useRecoilState(queueState);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const historyRef = collection(db, `users/${user.uid}/history`);
    const q = query(historyRef, orderBy('playedAt', 'desc'), limit(20));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Fix timestamp conversion
          playedAt: data.playedAt?.toDate?.() || new Date()
        };
      });
      setHistory(historyData);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePlaySong = (song) => {
    setCurrentSong(song);
    setQueue([song]);
  };

  const handleLogout = () => {
    signOut(auth);
    navigate('/login');
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Avatar
          src={user?.photoURL}
          sx={{ width: 80, height: 80, margin: '0 auto', mb: 2 }}
        />
        <Typography variant="h5">{user?.displayName}</Typography>
        <Typography variant="body2" color="textSecondary">{user?.email}</Typography>
        <IconButton onClick={handleLogout} sx={{ mt: 2 }}>
          <ExitToApp />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" sx={{ px: 2, mb: 2 }}>Recently Played</Typography>
      <List>
        {history.map((song) => (
          <ListItem
            key={`${song.id}-${song.playedAt}`}
            secondaryAction={
              <IconButton edge="end" onClick={() => handlePlaySong(song)}>
                <PlayArrow />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Avatar src={song.thumbnail} alt={song.title} />
            </ListItemAvatar>
            <ListItemText
              primary={song.title}
              secondary={song.playedAt.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Profile;
