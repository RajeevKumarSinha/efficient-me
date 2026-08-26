import { soundscapeService, SOUNDSCAPE_TRACKS } from '../soundscapeService';

describe('Soundscape Engine Service (Offline Audio Playback)', () => {
  let logSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  afterEach(async () => {
    await soundscapeService.stopSoundscape();
  });

  it('should list all 5 neuroscience-backed soundscape tracks', () => {
    expect(SOUNDSCAPE_TRACKS.length).toBe(5);
    expect(SOUNDSCAPE_TRACKS.map((t) => t.id)).toEqual([
      'none',
      'rain',
      'binaural_alpha',
      'forest_stream',
      'brown_noise',
    ]);
  });

  it('should play rain soundscape and track playing state', async () => {
    await soundscapeService.playSoundscape('rain');
    expect(soundscapeService.getActiveTrack()).toBe('rain');
    expect(soundscapeService.getIsPlaying()).toBe(true);
  });

  it('should handle volume adjustment within bounds', async () => {
    await soundscapeService.setVolume(0.8);
    expect(soundscapeService.getVolume()).toBe(0.8);

    await soundscapeService.setVolume(1.5); // clamped to 1.0
    expect(soundscapeService.getVolume()).toBe(1.0);

    await soundscapeService.setVolume(-0.5); // clamped to 0.0
    expect(soundscapeService.getVolume()).toBe(0.0);
  });

  it('should handle silent mode without throwing', async () => {
    await soundscapeService.playSoundscape('none');
    expect(soundscapeService.getActiveTrack()).toBe('none');
    expect(soundscapeService.getIsPlaying()).toBe(false);
  });

  it('should play timer completion chime cleanly', async () => {
    await expect(soundscapeService.playTimerCompleteChime()).resolves.not.toThrow();
  });

  it('should cleanly stop soundscape and unload audio instance (Law #7 Memory Lifecycle)', async () => {
    await soundscapeService.playSoundscape('binaural_alpha');
    expect(soundscapeService.getIsPlaying()).toBe(true);

    await soundscapeService.stopSoundscape();
    expect(soundscapeService.getIsPlaying()).toBe(false);
  });
});
