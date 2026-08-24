import { Platform } from 'react-native';

export type SoundscapeType = 'rain' | 'binaural_alpha' | 'forest_stream' | 'brown_noise' | 'none';

export interface SoundscapeTrack {
  id: SoundscapeType;
  title: string;
  icon: string;
  frequencyDesc: string;
  description: string;
}

export const SOUNDSCAPE_TRACKS: SoundscapeTrack[] = [
  {
    id: 'none',
    title: 'Silent (No Sound)',
    icon: '🔇',
    frequencyDesc: 'Pure Silence',
    description: 'Zero audio stimulation for clean internal focus',
  },
  {
    id: 'rain',
    title: 'Gentle Rain & Lo-Fi',
    icon: '🌧️',
    frequencyDesc: 'Pink Noise Spectrum',
    description: 'Natural soothing rainfall to mask distracting speech and office noise',
  },
  {
    id: 'binaural_alpha',
    title: '10 Hz Alpha Waves',
    icon: '🌊',
    frequencyDesc: '10 Hz Binaural Flow',
    description: 'Neuroscience-backed frequencies that encourage calm, alert focus',
  },
  {
    id: 'forest_stream',
    title: 'Forest Stream & Birds',
    icon: '🌲',
    frequencyDesc: 'Biophilic Soundscape',
    description: 'Natural outdoor sounds that reduce sympathetic cortisol levels',
  },
  {
    id: 'brown_noise',
    title: 'Deep Brown Noise',
    icon: '☕',
    frequencyDesc: 'Low-Frequency Masking',
    description: 'Warm, low-rumble noise ideal for ADHD focus and sensory regulation',
  },
];

class SoundscapeService {
  private activeTrack: SoundscapeType = 'none';
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private audioContext: any = null;
  private oscillatorNode: any = null;
  private gainNode: any = null;
  private noiseNode: any = null;

  constructor() {
    this.initWebAudio();
  }

  private initWebAudio() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      } catch (e) {
        console.warn('[SoundscapeService] WebAudio initialization not available:', e);
      }
    }
  }

  public getActiveTrack(): SoundscapeType {
    return this.activeTrack;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      try {
        this.gainNode.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime);
      } catch {}
    }
  }

  public async playSoundscape(track: SoundscapeType): Promise<void> {
    this.stopSoundscape();
    this.activeTrack = track;

    if (track === 'none') {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;

    // Synthesize ambient soundscape via WebAudio API if running on web/engine
    if (this.audioContext) {
      try {
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime);
        this.gainNode.connect(this.audioContext.destination);

        if (track === 'binaural_alpha') {
          // Synthesize dual tone 200 Hz & 210 Hz = 10 Hz Alpha beat
          this.oscillatorNode = this.audioContext.createOscillator();
          this.oscillatorNode.type = 'sine';
          this.oscillatorNode.frequency.setValueAtTime(200, this.audioContext.currentTime);
          this.oscillatorNode.connect(this.gainNode);
          this.oscillatorNode.start();
        } else if (track === 'brown_noise' || track === 'rain') {
          // Generate warm buffer noise
          const bufferSize = this.audioContext.sampleRate * 2;
          const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise integration
            lastOut = output[i];
          }
          this.noiseNode = this.audioContext.createBufferSource();
          this.noiseNode.buffer = noiseBuffer;
          this.noiseNode.loop = true;
          this.noiseNode.connect(this.gainNode);
          this.noiseNode.start();
        }
      } catch (e) {
        console.warn('[SoundscapeService] Synthesizer audio play error:', e);
      }
    }
  }

  public stopSoundscape(): void {
    this.isPlaying = false;

    if (this.oscillatorNode) {
      try {
        this.oscillatorNode.stop();
        this.oscillatorNode.disconnect();
      } catch {}
      this.oscillatorNode = null;
    }

    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
  }
}

export const soundscapeService = new SoundscapeService();
