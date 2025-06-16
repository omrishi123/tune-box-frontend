import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { useRecoilState, useRecoilValue } from 'recoil';
import axios from '../utils/axios';
import { recentlyPlayedState, suggestedSongsState, suggestedTracksState, currentSongState, queueState } from '../atoms/playerAtoms';
import PlaylistCard from '../components/Playlist/PlaylistCard';
import SearchBar from '../components/SearchBar';
import styled from 'styled-components';
import { db } from '../config/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getTrendingMusic } from '../services/youtube';

const HomeContainer = styled.div`
  padding: 24px;
  
  .section {
    margin-bottom: 32px;
  }
  
  .playlists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 24px;
  }
`;

const Home = () => {
  const recentlyPlayed = useRecoilValue(recentlyPlayedState);
  const [suggestedSongs, setSuggestedSongs] = useRecoilState(suggestedSongsState);
  const [suggestedTracks, setSuggestedTracks] = useRecoilState(suggestedTracksState);
  const [currentSong, setCurrentSong] = useRecoilState(currentSongState);
  const [, setQueue] = useRecoilState(queueState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestedSongs = async () => {
      try {
        setLoading(true);
        // Fetch trending music videos
        const trendingSongs = await getTrendingMusic();
        setSuggestedSongs(trendingSongs);
      } catch (error) {
        console.error('Error fetching suggested songs:', error);
        setError('Failed to load trending songs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSuggestedTracks = async () => {
      try {
        setLoading(true);
        const tracksRef = collection(db, 'suggestedTracks');
        const q = query(tracksRef, orderBy('popularity', 'desc'), limit(15));
        const snapshot = await getDocs(q);
        const tracks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSuggestedTracks(tracks);
      } catch (error) {
        console.error('Error fetching suggested tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedSongs();
    fetchSuggestedTracks();
  }, [setSuggestedSongs, setSuggestedTracks]);

  const handleSongClick = (song) => {
    // Format song data to match player requirements
    const formattedSong = {
      id: song.id,
      videoId: song.id, // Add videoId for YouTube player
      title: song.title,
      thumbnail: song.thumbnail,
      artist: song.artist
    };

    setCurrentSong(formattedSong);
    // Add rest of trending songs to queue
    const restOfSongs = suggestedSongs
      .filter(s => s.id !== song.id)
      .map(s => ({
        id: s.id,
        videoId: s.id,
        title: s.title,
        thumbnail: s.thumbnail,
        artist: s.artist
      }));
    setQueue([formattedSong, ...restOfSongs]);
  };

  useEffect(() => {
    const loadTrendingSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        const songs = await getTrendingMusic();
        if (songs.length > 0) {
          setSuggestedSongs(songs);
        } else {
          setError('No trending songs available at the moment.');
        }
      } catch (error) {
        setError('Unable to load trending songs.');
        console.error('Error loading songs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingSongs();
  }, [setSuggestedSongs]);

  const trendingSection = (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Trending Songs
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography color="text.secondary">{error}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {suggestedSongs.map((song) => (
            <Grid item xs={12} sm={6} md={3} key={song.id}>
              <PlaylistCard 
                song={song}
                onClick={() => handleSongClick(song)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <HomeContainer>
      <Box sx={{ p: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Music Player
        </Typography>
        
        <SearchBar />


        {recentlyPlayed.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Recently Played
            </Typography>
            <Grid container spacing={2}>
              {recentlyPlayed.slice(0, 8).map((song) => (
                <Grid item xs={12} sm={6} md={3} key={song.id}>
                  <PlaylistCard 
                    song={song}
                    type="song"
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {trendingSection}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Suggested Tracks
          </Typography>
          <Grid container spacing={2}>
            {suggestedTracks.map((track) => (
              <Grid item xs={12} sm={6} md={3} key={track.id}>
                <PlaylistCard 
                  song={track}
                  type="song"
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </HomeContainer>
  );
};

export default Home;
