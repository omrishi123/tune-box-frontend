import React from 'react';
import { useRecoilState } from 'recoil';
import { IconButton, Slider } from '@material-ui/core';
import { PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp } from '@material-ui/icons';
import styled from 'styled-components';
import { currentSongState, playbackState } from '../../atoms/playerAtoms';

const PlayerContainer = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 16px;
  background: #282828;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
`;

const NowPlaying = ({ player }) => {
  const [currentSong] = useRecoilState(currentSongState);
  const [isPlaying, setIsPlaying] = useRecoilState(playbackState);

  return (
    <PlayerContainer>
      {/* Song Info */}
      <div className="song-info">
        {currentSong && (
          <>
            <img src={currentSong.thumbnail} alt={currentSong.title} />
            <div>
              <h4>{currentSong.title}</h4>
              <p>{currentSong.artist}</p>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="controls">
        <IconButton><SkipPrevious /></IconButton>
        <IconButton onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton><SkipNext /></IconButton>
      </div>

      {/* Volume */}
      <div className="volume">
        <VolumeUp />
        <Slider />
      </div>
    </PlayerContainer>
  );
};

export default NowPlaying;
