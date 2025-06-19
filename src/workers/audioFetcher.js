/* eslint-disable no-restricted-globals */
const ctx = self; // 'self' refers to the global scope in a Web Worker

ctx.addEventListener('message', async (event) => {
  // Destructure the data sent from the main thread
  const { videoId, apiUrl } = event.data;

  try {
    // 1. Fetch the audio/video stream URL from your API
    const response = await fetch(`${apiUrl}/api/youtube/stream/${videoId}`);

    // 2. Check if the network request was successful (status code 200-299)
    if (!response.ok) {
      // If not successful, throw an error with the status
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 3. Parse the JSON response
    const data = await response.json();

    // 4. Post a success message back to the main thread
    // Include the type, the fetched URL, and the videoId for context
    ctx.postMessage({ type: 'SUCCESS', url: data.url, videoId });

  } catch (error) {
    // 5. If any error occurs during the fetch or parsing, catch it
    // and post an error message back to the main thread
    ctx.postMessage({ type: 'ERROR', error: error.message, videoId });
  }
});