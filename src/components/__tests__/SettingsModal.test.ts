import { SUPPORTED_LANGUAGES } from '../../locales/i18n';

describe('SettingsModal & Preferences Engine', () => {
  it('should list all 6 supported languages for preferences', () => {
    expect(SUPPORTED_LANGUAGES.length).toBe(6);
    expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual([
      'en',
      'es',
      'de',
      'fr',
      'hi',
      'ja',
    ]);
  });

  it('should verify flags exist for all language choices', () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(lang.flag).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
      expect(lang.name).toBeTruthy();
    });
  });
});
