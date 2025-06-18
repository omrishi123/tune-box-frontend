import { atom } from 'recoil';

export const currentSongState = atom({
  key: 'currentSongState',
  default: null
});

export const playbackState = atom({
  key: 'playbackState',
  default: false
});

export const queueState = atom({
  key: 'queueState',
  default: []
});

export const recentlyPlayedState = atom({
  key: 'recentlyPlayedState',
  default: []
});

export const suggestedSongsState = atom({
  key: 'suggestedSongsState',
  default: []
});

export const playHistoryState = atom({
  key: 'playHistoryState',
  default: []
});

export const userPlaylistsState = atom({
  key: 'userPlaylistsState',
  default: []
});

export const suggestedTracksState = atom({
  key: 'suggestedTracksState',
  default: []
});

export const playlistsState = atom({
  key: 'playlistsState',
  default: []
});

export const currentPlaylistState = atom({
  key: 'currentPlaylistState',
  default: null
});

export const currentTrackState = atom({
  key: 'currentTrackState',
  default: null,
});

export const isPlayingState = atom({
  key: 'isPlayingState',
  default: false,
});

export const currentIndexState = atom({
  key: 'currentIndexState',
  default: 0,
});
