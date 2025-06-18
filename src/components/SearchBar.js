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
    try {
      const response = await axios.get(`/api/youtube/search`, {
        params: { query: query }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format');
      }

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
      setError(null);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to fetch search results. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSongSelect = (song) => {
    if (!song?.id?.videoId) return;

    const newSong = {
      id: song.id.videoId,
      videoId: song.id.videoId,
      title: song.snippet.title,
      thumbnail: song.snippet.thumbnails.default.url,
      artist: song.snippet.channelTitle
    };
    
    setCurrentSong(newSong);
    setQueue([newSong]);
    setResults([]);
    setQuery('');
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