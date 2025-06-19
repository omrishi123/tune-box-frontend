export const setupMediaSession = (player, handlers) => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', handlers.play);
    navigator.mediaSession.setActionHandler('pause', handlers.pause);
    navigator.mediaSession.setActionHandler('nexttrack', handlers.next);
    navigator.mediaSession.setActionHandler('previoustrack', handlers.previous);
    navigator.mediaSession.setActionHandler('seekto', handlers.seekTo);
    
    // Setup seeking actions
    ['seekbackward', 'seekforward'].forEach(action => {
      navigator.mediaSession.setActionHandler(action, (details) => {
        const skipTime = details.seekOffset || 10;
        const currentTime = player.getCurrentTime();
        const newTime = action === 'seekbackward' 
          ? currentTime - skipTime 
          : currentTime + skipTime;
        player.seekTo(newTime, true);
      });
    });
  }
};

export const updateMediaSessionMetadata = (songData) => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: songData.title,
      artist: songData.artist,
      album: 'TuneBox',
      artwork: [
        { src: songData.thumbnail, sizes: '512x512', type: 'image/jpeg' }
      ]
    });
  }
};

export const updatePlaybackState = (state) => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state;
  }
};
