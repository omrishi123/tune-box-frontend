import React, { useState, useEffect, useCallback, useRef } from 'react';
import YouTube from 'react-youtube';
import { useRecoilState } from 'recoil';
import { IconButton, Box, Typography, Slider, Menu, MenuItem, ListItemText } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp, Close as CloseIcon, PlaylistAdd } from '@mui/icons-material';
import { currentSongState, playbackState, queueState, currentTrackState, isPlayingState, currentIndexState } from '../atoms/playerAtoms';
import styled from 'styled-components';
import { formatTime } from '../utils/formatTime';
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import useResponsive from '../hooks/useResponsive';
import axios from 'axios';

const PlayerWrapper = styled.div`
  position: fixed;
  bottom: ${props => props.isMobile ? '56px' : 0};
  width: 100%;
  padding: ${props => props.isMobile ? '10px' : '20px'};
  background: #282828;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  z-index: 999;
`;

const ExpandedPlayer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, #535353, #282828);
  z-index: 1000;
  padding: 40px;
  display: ${props => props.isExpanded ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
`;

const Player = () => {
  const [player, setPlayer] = useState(null);
  const [currentSong, setCurrentSong] = useRecoilState(currentSongState);
  const [isPlaying, setIsPlaying] = useRecoilState(playbackState);
  const [volume, setVolume] = useState(100);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [queue] = useRecoilState(queueState); // Only keep if you're using queue
  const [anchorEl, setAnchorEl] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const { isMobile } = useResponsive();
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useRecoilState(currentTrackState);
  const [currentIndex, setCurrentIndex] = useRecoilState(currentIndexState);
  const [audioUrl, setAudioUrl] = useState(null);
  const nextTrackUrlRef = useRef(null);
  const fetchingRef = useRef(false);
  const audioWorkerRef = useRef(null);
  const audioUrlCacheRef = useRef(new Map());

  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      playsinline: 1,
      enablejsapi: 1,
      origin: window.location.origin
    },
  };

  const onReady = (event) => {
    setPlayer(event.target);
    // Force playback start
    setTimeout(() => {
      event.target.playVideo();
      setIsPlaying(true);
    }, 100);
  };

  const onError = (event) => {
    console.error("YouTube Player Error:", event);
    setError("Failed to load video");
  };

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player?.pauseVideo();
    } else {
      player?.playVideo();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, player, setIsPlaying]);

  useEffect(() => {
    if (player && currentSong) {
      player.loadVideoById(currentSong.id);
      setIsPlaying(true);
    }
  }, [currentSong, player]);

  useEffect(() => {
    if (player && currentSong) {
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }, [isPlaying, player, currentSong]);

  const skipToNext = useCallback((e) => {
    if (e) e.stopPropagation();
    const currentIndex = queue.findIndex(song => song.id === currentSong?.id);
    if (currentIndex > -1 && currentIndex < queue.length - 1) {
      const nextSong = queue[currentIndex + 1];
      setCurrentSong(nextSong);
      setIsPlaying(true);
    }
  }, [queue, currentSong, setCurrentSong, setIsPlaying]);

  const skipToPrevious = useCallback((e) => {
    if (e) e.stopPropagation();
    const currentIndex = queue.findIndex(song => song.id === currentSong?.id);
    if (currentIndex > 0) {
      const previousSong = queue[currentIndex - 1];
      setCurrentSong(previousSong);
      setIsPlaying(true);
    }
  }, [queue, currentSong, setCurrentSong, setIsPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (player) {
      setCurrentTime(player.getCurrentTime());
      setDuration(player.getDuration());
    }
  }, [player]);

  useEffect(() => {
    if (player) {
      const interval = setInterval(handleTimeUpdate, 1000);
      return () => clearInterval(interval);
    }
  }, [player, handleTimeUpdate]);

  const saveToHistory = async (song) => {
    if (!auth.currentUser || !song) return;

    try {
      const historyRef = collection(db, `users/${auth.currentUser.uid}/history`);
      await addDoc(historyRef, {
        id: song.id,
        videoId: song.videoId || song.id, // Ensure videoId is saved
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        playedAt: serverTimestamp(),
        userId: auth.currentUser.uid
      });
      console.log('History saved successfully');
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  useEffect(() => {
    if (currentSong && auth.currentUser) {
      saveToHistory(currentSong);
    }
  }, [currentSong]);

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

  const handleAddToPlaylist = async (playlistId) => {
    if (!currentSong || !auth.currentUser) return;

    try {
      const playlistRef = doc(db, `users/${auth.currentUser.uid}/playlists/${playlistId}`);
      await updateDoc(playlistRef, {
        songs: arrayUnion({
          id: currentSong.id,
          videoId: currentSong.videoId || currentSong.id,
          title: currentSong.title,
          thumbnail: currentSong.thumbnail,
          artist: currentSong.artist
        })
      });
      setAnchorEl(null);
    } catch (error) {
      console.error('Error adding to playlist:', error);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && player) {
        const playerState = player.getPlayerState();
        // 0 is the value for ENDED state in YouTube API
        if (playerState === 0) {
          skipToNext();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [player, skipToNext]);

  useEffect(() => {
    if (player) {
      player.addEventListener('onStateChange', (event) => {
        // YouTube API: State 0 means video ended
        if (event.data === 0) {
          skipToNext();
        }
      });
    }
  }, [player, skipToNext]);

  // Initialize Web Worker
  useEffect(() => {
    audioWorkerRef.current = new Worker(new URL('../workers/audioFetcher.js', import.meta.url), {
      type: 'module'
    });
    
    audioWorkerRef.current.onmessage = (event) => {
      const { type, url, error } = event.data;
      if (type === 'SUCCESS' && url) {
        setAudioUrl(url);
        // Cache the URL for future use
        if (currentTrack?.videoId) {
          audioUrlCacheRef.current.set(currentTrack.videoId, url);
        }
      } else if (type === 'ERROR') {
        console.error('Audio fetch error:', error);
      }
    };

    return () => audioWorkerRef.current?.terminate();
  }, []);

  const fetchAudioUrl = useCallback(async (videoId) => {
    audioWorkerRef.current?.postMessage({
      videoId,
      apiUrl: process.env.REACT_APP_API_URL
    });
  }, []);

  const preloadNextTrack = useCallback(async () => {
    if (fetchingRef.current) return;
    
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1];
      if (nextTrack?.videoId) {
        fetchingRef.current = true;
        await fetchAudioUrl(nextTrack.videoId);
        fetchingRef.current = false;
      }
    }
  }, [currentIndex, queue, fetchAudioUrl]);

  // Enhanced audio handling with background support
  useEffect(() => {
    if (!audioRef.current) return;

    const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      
      setCurrentTime(currentTime);
      setDuration(duration);

      // Start preloading at 80% of current track
      if (duration > 0 && (currentTime / duration) > 0.8) {
        preloadNextTrack();
      }
    };

    const handleEnded = async () => {
      if (currentIndex < queue.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextTrack = queue[nextIndex];
        const nextUrl = audioUrlCacheRef.current.get(nextTrack.videoId) || 
                       await fetchAudioUrl(nextTrack.videoId);

        if (nextUrl) {
          setCurrentTrack(nextTrack);
          setCurrentIndex(nextIndex);
          setIsPlaying(true);
          setAudioUrl(nextUrl);

          try {
            audioRef.current.src = nextUrl;
            await audioRef.current.play();
            preloadNextTrack(); // Pre-fetch next track
          } catch (error) {
            console.error("Playback failed:", error);
          }
        }
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [currentIndex, queue, setCurrentTrack, setCurrentIndex, setIsPlaying, preloadNextTrack, fetchAudioUrl]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioRef.current) {
        if (isPlaying && audioRef.current.paused) {
          audioRef.current.play();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);

  if (error) {
    return (
      <PlayerWrapper>
        <Typography color="error">{error}</Typography>
      </PlayerWrapper>
    );
  }

  if (!currentSong) return null;

  return (
    <>
      <PlayerWrapper isMobile={isMobile} onClick={() => setExpanded(true)}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: isMobile ? '40%' : '30%' 
        }}>
          <img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            style={{ width: 56, height: 56, marginRight: 12 }}
          />
          <Box>
            <Typography variant="subtitle1">{currentSong.title}</Typography>
            <Typography variant="caption" color="gray">{currentSong.artist}</Typography>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 1 : 2 
        }}>
          <IconButton onClick={(e) => { e.stopPropagation(); skipToPrevious(); }}>
            <SkipPrevious />
          </IconButton>
          <IconButton onClick={togglePlayPause}>
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton onClick={skipToNext}>
            <SkipNext />
          </IconButton>
          <Typography variant="caption">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
        </Box>

        {!isMobile && (
          <Box sx={{ width: '30%', display: 'flex', alignItems: 'center' }}>
            <VolumeUp />
            <Slider
              value={volume}
              onChange={(_, value) => setVolume(value)}
              sx={{ ml: 1 }}
            />
          </Box>
        )}

        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <PlaylistAdd />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {playlists.map((playlist) => (
            <MenuItem 
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id)}
            >
              <ListItemText primary={playlist.name} />
            </MenuItem>
          ))}
        </Menu>
      </PlayerWrapper>

      <ExpandedPlayer isExpanded={expanded}>
        <IconButton 
          onClick={() => setExpanded(false)}
          sx={{ position: 'absolute', top: 20, right: 20 }}
        >
          <CloseIcon />
        </IconButton>

        <img
          src={currentSong?.thumbnail}
          alt={currentSong?.title}
          style={{ width: '300px', height: '300px', marginBottom: '40px' }}
        />

        <Typography variant="h4">{currentSong?.title}</Typography>
        <Typography variant="subtitle1" color="gray">{currentSong?.artist}</Typography>

        <Box sx={{ width: '100%', maxWidth: '800px', mt: 4 }}>
          <Slider
            value={currentTime}
            max={duration}
            onChange={(_, value) => player?.seekTo(value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>{formatTime(currentTime)}</Typography>
            <Typography>{formatTime(duration)}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
          <IconButton onClick={skipToPrevious}>
            <SkipPrevious />
          </IconButton>
          <IconButton onClick={togglePlayPause}>
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton onClick={skipToNext}>
            <SkipNext />
          </IconButton>
        </Box>
      </ExpandedPlayer>

      <YouTube
        videoId={currentSong.id}
        opts={opts}
        onReady={onReady}
        onError={onError}
        onStateChange={(e) => {
          if (e.data === 1) {
            setIsPlaying(true);
            setError(null);
          } else if (e.data === 2) {
            setIsPlaying(false);
          } else if (e.data === 0) {
            skipToNext();
          }
        }}
        onEnd={() => skipToNext()}
      />
      <audio ref={audioRef} />
    </>
  );
};

export default Player;
