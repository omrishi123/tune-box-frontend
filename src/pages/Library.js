import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, Divider, CircularProgress } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useRecoilState } from 'recoil';
import { currentSongState, queueState } from '../atoms/playerAtoms';
import styled from 'styled-components';

const HistoryContainer = styled(Box)`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const Library = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setCurrentSong] = useRecoilState(currentSongState);
  const [, setQueue] = useRecoilState(queueState);

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Sets the current song to play and updates the queue with the given song.
 *
 * @param {Object} song - The song object to be played.
 * @param {string} song.id - The unique identifier of the song.
 * @param {string} song.videoId - The video ID for playback (if available).
 * @param {string} song.title - The title of the song.
 * @param {string} song.thumbnail - The URL of the song's thumbnail image.
 * @param {string} song.artist - The artist of the song.
 */

/*******  4e56ac9b-b6da-4a19-a9de-06863fd32944  *******/
  const handlePlay = (song) => {
    const formattedSong = {
      id: song.videoId || song.id, // Use videoId for playback
      videoId: song.videoId || song.id,
      title: song.title,
      thumbnail: song.thumbnail,
      artist: song.artist
    };
    setCurrentSong(formattedSong);
    setQueue([formattedSong]);
  };

  useEffect(() => {
    let historyUnsubscribe = () => {};

    const setupHistoryListener = async () => {
      if (!auth.currentUser) return;

      try {
        const historyRef = collection(db, `users/${auth.currentUser.uid}/history`);
        const q = query(
          historyRef,
          orderBy('playedAt', 'desc'),
          limit(50)
        );

        historyUnsubscribe = onSnapshot(q, 
          (snapshot) => {
            const historyData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                ...data,
                id: doc.id,
                videoId: data.videoId || data.id, // Ensure videoId is available
                playedAt: data.playedAt?.toDate?.() || new Date()
              };
            });
            setHistory(historyData);
            setLoading(false);
          },
          (error) => {
            console.error("Firestore listening error:", error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Setup error:", error);
        setLoading(false);
      }
    };

    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setupHistoryListener();
      } else {
        setHistory([]);
        setLoading(false);
      }
    });

    // Cleanup both listeners
    return () => {
      historyUnsubscribe();
      authUnsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <HistoryContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <Typography variant="h4" sx={{ mb: 4 }}>Your Library</Typography>

      {auth.currentUser ? (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Recently Played</Typography>
          {history.length > 0 ? (
            <List>
              {history.map((song) => (
                <React.Fragment key={`${song.id}-${song.playedAt}`}>
                  <ListItem
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={song.thumbnail} alt={song.title} />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={song.title}
                      secondary={
                        <Typography variant="caption" color="gray">
                          {song.artist} • {new Date(song.playedAt).toLocaleDateString()}
                        </Typography>
                      }
                    />
                    <IconButton 
                      onClick={() => handlePlay(song)}
                      sx={{ color: '#1db954' }}
                    >
                      <PlayArrow />
                    </IconButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="gray">
              No listening history yet. Start playing some music!
            </Typography>
          )}
        </Box>
      ) : (
        <Typography color="gray">
          Please login to view your listening history
        </Typography>
      )}
    </HistoryContainer>
  );
};

export default Library;
