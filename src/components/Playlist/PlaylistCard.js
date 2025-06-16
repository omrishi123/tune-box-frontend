import React from 'react';
import { Card, CardContent, CardMedia, Typography, IconButton } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import styled from 'styled-components';

const StyledCard = styled(Card)`
  position: relative;
  width: 200px;
  transition: all 0.3s ease;
  background: #282828;
  cursor: pointer;
  
  &:hover {
    background: #383838;
    .play-button {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PlayButton = styled(IconButton)`
  position: absolute;
  bottom: 70px;
  right: 10px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  background-color: #1db954 !important;
  
  &:hover {
    background-color: #1ed760 !important;
    transform: scale(1.1) !important;
  }
`;

const PlaylistCard = ({ song, onClick }) => {
  if (!song) return null;

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick(song);
  };

  return (
    <StyledCard onClick={handleClick}>
      <CardMedia
        component="img"
        height="160"
        image={song.thumbnail || 'https://via.placeholder.com/160'}
        alt={song?.title || 'Music'}
      />
      <PlayButton className="play-button" onClick={handleClick}>
        <PlayArrow />
      </PlayButton>
      <CardContent>
        <Typography variant="subtitle1" noWrap>
          {song?.title || 'Untitled'}
        </Typography>
        <Typography variant="body2" color="textSecondary" noWrap>
          {song?.artist || 'Unknown Artist'}
        </Typography>
      </CardContent>
    </StyledCard>
  );
};

export default PlaylistCard;
