// Voice announcement module using Web Speech API

class VoiceAnnouncer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.queue = [];
    this.speaking = false;
    this.chimeAudio = null;
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
    const lang = settings.voiceLang || 'id-ID';
    const rate = settings.voiceRate || 0.9;
    const template = settings.voiceTemplate || 'Nomor antrian {number}, silakan menuju {counter}';

    const text = template
      .replace('{number}', ticketNumber.split('').join(' '))
      .replace('{counter}', counterName);

    // Play chime first
    await this.playChime();
    
    // Small delay between chime and voice
    await new Promise(r => setTimeout(r, 400));

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to find an Indonesian voice
      const voices = this.synth.getVoices();
      const targetVoice = voices.find(v => v.lang === lang) ||
                          voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      utterance.onend = () => {
        this.speaking = false;
        resolve();
      };
      utterance.onerror = (e) => {
        this.speaking = false;
        reject(e);
      };

      this.speaking = true;
      this.synth.speak(utterance);
    });
  }

  // Announce with repeat (say twice)
  async announceWithRepeat(ticketNumber, counterName, settings = {}) {
    await this.announce(ticketNumber, counterName, settings);
    await new Promise(r => setTimeout(r, 1500));
    await this.announce(ticketNumber, counterName, settings);
  }

  cancel() {
    this.synth.cancel();
    this.speaking = false;
  }

  isSpeaking() {
    return this.speaking || this.synth.speaking;
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
