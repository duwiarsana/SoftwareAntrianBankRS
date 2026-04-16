// Voice announcement module using Google TTS (Natural Voice)

class VoiceAnnouncer {
  constructor() {
    this.queue = [];
    this.speaking = false;
    this.chimeAudio = null;
    this.currentAudio = null;
    this.initChime();
  }

  initChime() {
    // Create a chime sound using AudioContext
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.8, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate a pleasant bell-like chime
      for (let i = 0; i < data.length; i++) {
        const t = i / audioContext.sampleRate;
        const envelope = Math.exp(-t * 4);
        data[i] = envelope * (
          0.6 * Math.sin(2 * Math.PI * 830 * t) +
          0.3 * Math.sin(2 * Math.PI * 1245 * t) +
          0.1 * Math.sin(2 * Math.PI * 1660 * t)
        );
      }

      this.chimeBuffer = buffer;
      this.audioContext = audioContext;
    } catch (e) {
      console.log('AudioContext not available for chime');
    }
  }

  async playChime() {
    if (!this.audioContext || !this.chimeBuffer) return;
    
    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = this.chimeBuffer;
      source.connect(this.audioContext.destination);
      source.start();
      
      return new Promise((resolve) => {
        source.onended = resolve;
        setTimeout(resolve, 1000);
      });
    } catch (e) {
      console.log('Could not play chime:', e);
    }
  }

  async announce(ticketNumber, counterName, settings = {}) {
    // Fallback to Indonesian 'id' for Google TTS
    const lang = settings.voiceLang ? settings.voiceLang.split('-')[0] : 'id';
    // Base template
    const template = settings.voiceTemplate || 'Nomor antrian {number}, silakan menuju {counter}';

    // To make it sound more natural, we spell out the letters and numbers
    // In Indonesian, e.g., A 0 1 2 is spelled "A kosong satu dua"
    const parsedNumber = ticketNumber.split('').map(char => {
       if (char === '0') return 'kosong';
       return char;
    }).join(' ');

    const text = template
      .replace('{number}', parsedNumber)
      .replace('{counter}', counterName);

    // Play chime first
    await this.playChime();
    
    // Small delay between chime and voice
    await new Promise(r => setTimeout(r, 400));

    return new Promise((resolve, reject) => {
      // Use Google TTS API for natural voice
      const url = `https://translate.googleapis.com/translate_tts?client=gtx&tl=${lang}&ie=UTF-8&q=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      
      // Optional: adjust rate if needed, though Google TTS sounds best at 1.0
      // audio.playbackRate = settings.voiceRate || 1.0;

      this.speaking = true;

      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      this.currentAudio = audio;

      audio.onended = () => {
        this.speaking = false;
        resolve();
      };

      audio.onerror = (e) => {
        this.speaking = false;
        console.warn('TTS Audio error:', e);
        reject(e);
      };

      audio.play().catch(e => {
        this.speaking = false;
        console.warn('Browser prevented audio play without interaction:', e);
        reject(e);
      });
    });
  }

  // Announce with repeat (say twice)
  async announceWithRepeat(ticketNumber, counterName, settings = {}) {
    await this.announce(ticketNumber, counterName, settings);
    await new Promise(r => setTimeout(r, 1500));
    await this.announce(ticketNumber, counterName, settings);
  }

  cancel() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    this.speaking = false;
  }

  isSpeaking() {
    return this.speaking || (this.currentAudio && !this.currentAudio.paused);
  }
}

// Singleton instance
let announcer = null;

export function getAnnouncer() {
  if (!announcer) {
    announcer = new VoiceAnnouncer();
  }
  return announcer;
}
