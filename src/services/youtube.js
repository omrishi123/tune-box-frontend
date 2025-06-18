import axios from 'axios';

const API_KEY = 'AIzaSyCxIHwZ5QUPUr9CD6B-u6Pj7RZw6sQ6B4o';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const searchVideos = async (query) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults: 20,
        key: API_KEY,
        q: query,
        type: 'video',
        videoCategoryId: '10' // Music category
      }
    });
    return response.data.items;
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
};

export const getVideoDetails = async (videoId) => {
  try {
    const response = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'snippet,contentDetails',
        key: API_KEY,
        id: videoId
      }
    });
    return response.data.items[0];
  } catch (error) {
    console.error('Error getting video details:', error);
    return null;
  }
};

export const getTrendingMusic = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: 'latest trending song',
        type: 'video',
        maxResults: 20,
        videoCategoryId: '10',
        order: 'viewCount',
        key: API_KEY,
        regionCode: 'IN',
        relevanceLanguage: 'hi',
        fields: 'items(id/videoId,snippet(title,thumbnails/medium,channelTitle))'
      }
    });

    if (!response.data.items) {
      throw new Error('No items in response');
    }

    return response.data.items.map(item => ({
      id: item.id.videoId,
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      artist: item.snippet.channelTitle,
      type: 'video'
    }));
  } catch (error) {
    console.error('API Error:', error.response?.data?.error?.message || error.message);
    return [];
  }
};
