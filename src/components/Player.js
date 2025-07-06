import React, { useState, useEffect, useCallback, useRef } from 'react';
import YouTube from 'react-youtube';
import { useRecoilState } from 'recoil';
import { IconButton, Box, Typography, Slider, Menu, MenuItem, ListItemText } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp, Close as CloseIcon, PlaylistAdd, Headphones } from '@mui/icons-material';
import { currentSongState, playbackState, queueState, currentTrackState, isPlayingState, currentIndexState } from '../atoms/playerAtoms';
import styled from 'styled-components';
import { formatTime } from '../utils/formatTime';
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import useResponsive from '../hooks/useResponsive';

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
  const [expanded, setExpanded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [queue, setQueue] = useRecoilState(queueState); // <-- add setQueue here
  const [anchorEl, setAnchorEl] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const { isMobile } = useResponsive();
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useRecoilState(currentTrackState);
  const [currentIndex, setCurrentIndex] = useRecoilState(currentIndexState);
  const fetchingRef = useRef(false);
  const audioWorkerRef = useRef(null);
  const audioUrlCacheRef = useRef(new Map());
  const [backgroundMode, setBackgroundMode] = useState(false);
  const backgroundPlaybackRef = useRef(false);
  const [queuedTracks, setQueuedTracks] = useState([]);

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
    const nextIndex = currentIndex + 1;
    if (queue && nextIndex < queue.length) {
      const nextSong = queue[nextIndex];
      setCurrentIndex(nextIndex);
      setCurrentSong(nextSong);
      setCurrentTrack(nextSong);
      setIsPlaying(true);
    }
  }, [queue, currentIndex, setCurrentIndex, setCurrentSong, setCurrentTrack, setIsPlaying]);

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

    let pauseTimeout = null;

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

      // Fix: If audio pauses unexpectedly in background, try to resume
      if (isPlaying && audioRef.current.paused) {
        // Try to resume after a short delay (browser may throttle, so use a timeout)
        clearTimeout(pauseTimeout);
        pauseTimeout = setTimeout(() => {
          if (isPlaying && audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
        }, 500);
      }
    };

    const handleEnded = () => {
      const nextIndex = currentIndex + 1;
      if (queue && nextIndex < queue.length) {
        const nextTrack = queue[nextIndex];
        setCurrentIndex(nextIndex);
        setCurrentSong(nextTrack);
        setCurrentTrack(nextTrack);
        setIsPlaying(true);

        // Fix: Always set audio src and play for next track in background
        if (audioUrlCacheRef.current.has(nextTrack.videoId)) {
          const nextUrl = audioUrlCacheRef.current.get(nextTrack.videoId);
          if (audioRef.current && nextUrl) {
            audioRef.current.src = nextUrl;
            audioRef.current.play().catch(() => {});
          }
        }
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    // Add cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
      clearTimeout(pauseTimeout);
      setQueuedTracks([]);
    };
  }, [
    currentIndex,
    queue,
    setCurrentTrack,
    setCurrentIndex,
    setIsPlaying,
    fetchAudioUrl,
    backgroundMode,
    isPlaying,
  ]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioRef.current) {
        if (isPlaying && audioRef.current.paused) {
          audioRef.current.play();
        }
        // Try to resume YouTube player if needed
        if (isPlaying && player && typeof player.playVideo === 'function') {
          player.playVideo();
        }
        // Optionally, show a notification to user
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('TuneBox', {
            body: 'For uninterrupted playback, keep TuneBox in the foreground.',
            icon: currentSong?.thumbnail
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying, player, currentSong]);

  useEffect(() => {
    if (backgroundMode) {
      backgroundPlaybackRef.current = true;
      // Request wake lock to prevent device sleep
      try {
        navigator.wakeLock?.request('screen');
      } catch (err) {
        console.log('Wake Lock not supported');
      }
    } else {
      backgroundPlaybackRef.current = false;
    }
  }, [backgroundMode]);

  // Media Session API integration for background/system controls
  useEffect(() => {
    if (!currentSong) return;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: '',
        artwork: [
          { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        player?.playVideo();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        player?.pauseVideo();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', skipToPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', skipToNext);
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const seekTime = player?.getCurrentTime() - (details.seekOffset || 10);
        player?.seekTo(seekTime > 0 ? seekTime : 0, true);
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const seekTime = player?.getCurrentTime() + (details.seekOffset || 10);
        player?.seekTo(seekTime, true);
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          player?.seekTo(details.seekTime, true);
        }
      });
    }
  }, [currentSong, player, skipToNext, skipToPrevious, setIsPlaying]);

  // Update playback state for Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Update position state regularly for lock screen controls
  useEffect(() => {
    if (!player || !('mediaSession' in navigator)) return;
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        try {
          navigator.mediaSession.setPositionState({
            duration: player.getDuration(),
            playbackRate: 1,
            position: player.getCurrentTime()
          });
        } catch {}
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  if (!currentSong) return null;

  // Add background mode toggle
  const toggleBackgroundMode = (e) => {
    e.stopPropagation();
    setBackgroundMode(!backgroundMode);
    
    if (!backgroundMode) {
      // Show notification when enabling background mode
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Background Playback Enabled', {
          body: 'Music will continue playing in background',
          icon: currentSong?.thumbnail
        });
      }
    }
  };

  // Example function to use in your playlist list component (not inside Player.js)
  const handleOpenPlaylist = (playlist) => {
    if (playlist.songs && playlist.songs.length > 0) {
      setCurrentIndex(0);
      setCurrentSong(playlist.songs[0]);
      setCurrentTrack(playlist.songs[0]);
      setIsPlaying(true);
      setQueue(playlist.songs); // <-- setQueue is now defined
      // Optionally, navigate to the player view if needed
    } else {
      alert('This playlist is empty.');
    }
  };

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
          <IconButton 
            onClick={toggleBackgroundMode}
            sx={{ 
              color: backgroundMode ? 'primary.main' : 'inherit',
              '&:hover': {
                color: backgroundMode ? 'primary.light' : 'inherit'
              }
            }}
          >
            <Headphones />
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