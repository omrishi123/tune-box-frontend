class AudioContextManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.source = null;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.buffer = null;
    this.nextBuffer = null;
  }

  async loadAudio(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Error loading audio:', error);
      return null;
    }
  }

  async preloadNext(url) {
    this.nextBuffer = await this.loadAudio(url);
  }

  play(buffer) {
    if (this.source) {
      this.source.disconnect();
    }
    
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.gainNode);
    
    this.source.start(0);
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setVolume(value) {
    this.gainNode.gain.value = value;
  }

  stop() {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
    }
  }
}

export default new AudioContextManager();
