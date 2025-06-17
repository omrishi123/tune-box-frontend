import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { Paper, InputBase, IconButton, CircularProgress, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { Search } from '@mui/icons-material';
import styled from 'styled-components';
import axios from '../utils/axios';
import { currentSongState, queueState } from '../atoms/playerAtoms';

const SearchWrapper = styled(Paper)`
  padding: 2px 4px;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background-color: #282828;
`;

const ResultsList = styled(List)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  background: #282828;
  z-index: 1000;
`;

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setCurrentSong] = useRecoilState(currentSongState);
  const [queue, setQueue] = useRecoilState(queueState);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await axios.get(`/api/youtube/search?query=${encodeURIComponent(query.trim())}`);
      
      if (response.data && Array.isArray(response.data)) {
        const formattedResults = response.data.map(item => ({
          id: { videoId: item.id },
          snippet: {
            title: item.title,
            thumbnails: {
              default: { url: item.thumbnail }
            },
            channelTitle: item.artist
          }
        }));
        setResults(formattedResults);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.details ||
                         'Failed to fetch results. Please try again.';
      setError(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSongSelect = (song) => {
    const newSong = {
      id: song.id.videoId,
      videoId: song.id.videoId, // Add this line
      title: song.snippet.title,
      thumbnail: song.snippet.thumbnails.default.url,
      artist: song.snippet.channelTitle
    };
    
    // Add selected song and all subsequent results to queue
    const newQueue = [
      ...queue,
      newSong,
      ...results
        .slice(results.findIndex(r => r.id.videoId === song.id.videoId) + 1)
        .map(r => ({
          id: r.id.videoId,
          title: r.snippet.title,
          thumbnail: r.snippet.thumbnails.default.url,
          artist: r.snippet.channelTitle
        }))
    ];
    
    setQueue(newQueue);
    setCurrentSong(newSong);
  };

  return (
    <div style={{ position: 'relative' }}>
      <form onSubmit={handleSearch}>
        <SearchWrapper>
          <InputBase
            sx={{ ml: 1, flex: 1, color: 'white' }}
            placeholder="Search for songs, artists, or playlists"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <IconButton type="submit" sx={{ p: '10px', color: 'white' }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : <Search />}
          </IconButton>
        </SearchWrapper>
      </form>

      {error && (
        <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <ResultsList>
          {results.map((item) => (
            <ListItem 
              key={item.id.videoId} 
              button 
              onClick={() => handleSongSelect(item)}
            >
              <ListItemAvatar>
                <Avatar src={item.snippet.thumbnails.default.url} />
              </ListItemAvatar>
              <ListItemText 
                primary={item.snippet.title}
                secondary={item.snippet.channelTitle}
              />
            </ListItem>
          ))}
        </ResultsList>
      )}
    </div>
  );
};

export default SearchBar;