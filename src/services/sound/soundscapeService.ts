import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
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
    description: 'Neuroscience-backed frequencies (432 Hz carrier) that encourage flow',
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

const SOUND_ASSETS: Record<Exclude<SoundscapeType, 'none'> | 'timer_complete', any> = {
  rain: require('../../assets/sounds/rain.wav'),
  binaural_alpha: require('../../assets/sounds/binaural_alpha.wav'),
  forest_stream: require('../../assets/sounds/forest_stream.wav'),
  brown_noise: require('../../assets/sounds/brown_noise.wav'),
  timer_complete: require('../../assets/sounds/timer_complete.wav'),
};

class SoundscapeService {
  private activeTrack: SoundscapeType = 'none';
  private isPlaying: boolean = false;
  private volume: number = 0.6;
  private soundObject: Audio.Sound | null = null;
  private audioModeInitialized: boolean = false;

  // Web fallback nodes
  private audioContext: any = null;
  private oscillatorNode: any = null;
  private gainNode: any = null;
  private noiseNode: any = null;

  constructor() {
    this.initAudioMode();
    this.initWebAudio();
  }

  private async initAudioMode() {
    if (this.audioModeInitialized) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.audioModeInitialized = true;
    } catch (e) {
      console.warn('[SoundscapeService] Audio mode initialization warning:', e);
    }
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

  public getVolume(): number {
    return this.volume;
  }

  public async setVolume(vol: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.soundObject) {
      try {
        await this.soundObject.setVolumeAsync(this.volume);
      } catch {}
    }
    if (this.gainNode && this.audioContext) {
      try {
        this.gainNode.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime);
      } catch {}
    }
  }

  public async playSoundscape(track: SoundscapeType): Promise<void> {
    await this.stopSoundscape();
    this.activeTrack = track;

    if (track === 'none') {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;

    try {
      await this.initAudioMode();
      const moduleAsset = SOUND_ASSETS[track];
      if (moduleAsset) {
        let soundSource: any = moduleAsset;
        try {
          const assetObj = Asset.fromModule(moduleAsset);
          if (!assetObj.downloaded) {
            await assetObj.downloadAsync();
          }
          if (assetObj.localUri || assetObj.uri) {
            soundSource = { uri: assetObj.localUri || assetObj.uri };
          }
        } catch (assetErr) {
          console.warn('[SoundscapeService] Asset downloadAsync fallback to module:', assetErr);
        }

        const { sound, status } = await Audio.Sound.createAsync(
          soundSource,
          {
            isLooping: true,
            volume: this.volume,
            shouldPlay: true,
          }
        );
        this.soundObject = sound;
        console.log(`[SoundscapeService] Playing ${track} successfully!`, status);
        return;
      }
    } catch (err) {
      console.error(`[SoundscapeService] Native expo-av playback failed for ${track}:`, err);
    }

    // WebAudio synthesis fallback
    this.playWebAudioSynthesis(track);
  }

  public async playTimerCompleteChime(): Promise<void> {
    try {
      await this.initAudioMode();
      const moduleAsset = SOUND_ASSETS.timer_complete;
      let soundSource: any = moduleAsset;
      try {
        const assetObj = Asset.fromModule(moduleAsset);
        if (!assetObj.downloaded) {
          await assetObj.downloadAsync();
        }
        if (assetObj.localUri || assetObj.uri) {
          soundSource = { uri: assetObj.localUri || assetObj.uri };
        }
      } catch {}

      const { sound } = await Audio.Sound.createAsync(
        soundSource,
        {
          isLooping: false,
          volume: Math.max(0.7, this.volume),
          shouldPlay: true,
        }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
      console.log('[SoundscapeService] Completion chime triggered successfully');
    } catch (e) {
      console.error('[SoundscapeService] Complete chime error:', e);
      this.playWebChime();
    }
  }

  public async stopSoundscape(): Promise<void> {
    this.isPlaying = false;

    if (this.soundObject) {
      try {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
      } catch {}
      this.soundObject = null;
    }

    this.stopWebAudioSynthesis();
  }

  private playWebAudioSynthesis(track: SoundscapeType): void {
    if (!this.audioContext) return;
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(this.volume * 0.15, this.audioContext.currentTime);
      this.gainNode.connect(this.audioContext.destination);

      if (track === 'binaural_alpha') {
        this.oscillatorNode = this.audioContext.createOscillator();
        this.oscillatorNode.type = 'sine';
        this.oscillatorNode.frequency.setValueAtTime(432, this.audioContext.currentTime);
        this.oscillatorNode.connect(this.gainNode);
        this.oscillatorNode.start();
      } else if (track === 'brown_noise' || track === 'rain' || track === 'forest_stream') {
        const bufferSize = this.audioContext.sampleRate * 2;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
        }
        this.noiseNode = this.audioContext.createBufferSource();
        this.noiseNode.buffer = noiseBuffer;
        this.noiseNode.loop = true;
        this.noiseNode.connect(this.gainNode);
        this.noiseNode.start();
      }
    } catch (e) {
      console.warn('[SoundscapeService] WebAudio synth error:', e);
    }
  }

  private playWebChime(): void {
    if (!this.audioContext) return;
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 3.0);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();
      osc.stop(this.audioContext.currentTime + 3.0);
    } catch {}
  }

  private stopWebAudioSynthesis(): void {
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
