// Voice announcement module using ResponsiveVoice (Natural TTS Plugin)

class VoiceAnnouncer {
  constructor() {
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
    const template = settings.voiceTemplate || 'Nomor antrian {number}, silakan menuju {counter}';

    // Spell out '0' to make it natural
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
      this.speaking = true;

      // Use ResponsiveVoice plugin if available
      if (window.responsiveVoice) {
         window.responsiveVoice.speak(text, "Indonesian Female", {
             pitch: 1,
             rate: settings.voiceRate || 0.9,
             volume: 1,
             onend: () => {
                 this.speaking = false;
                 resolve();
             },
             onerror: (e) => {
                 this.speaking = false;
                 console.warn("ResponsiveVoice error:", e);
                 reject(e);
             }
         });
      } else {
         // Fallback to native Web Speech API
         console.warn("ResponsiveVoice tidak ditemukan. Fallback ke sistem bawaan.");
         const utterance = new SpeechSynthesisUtterance(text);
         utterance.lang = 'id-ID';
         utterance.rate = settings.voiceRate || 0.9;
         
         utterance.onend = () => { this.speaking = false; resolve(); };
         utterance.onerror = (e) => { this.speaking = false; reject(e); };
         
         window.speechSynthesis.speak(utterance);
      }
    });
  }

  // Announce with repeat (say twice)
  async announceWithRepeat(ticketNumber, counterName, settings = {}) {
    await this.announce(ticketNumber, counterName, settings);
    await new Promise(r => setTimeout(r, 1500));
    await this.announce(ticketNumber, counterName, settings);
  }

  cancel() {
    if (window.responsiveVoice) {
      window.responsiveVoice.cancel();
    } else {
      window.speechSynthesis.cancel();
    }
    this.speaking = false;
  }

  isSpeaking() {
    if (window.responsiveVoice) {
      return this.speaking || window.responsiveVoice.isPlaying();
    }
    return this.speaking || window.speechSynthesis.speaking;
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
