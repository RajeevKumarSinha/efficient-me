import i18n, {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  initI18n,
  changeAppLanguage,
  getDeviceLanguage,
} from '../i18n';

describe('i18n Multi-Language Engine', () => {
  beforeAll(async () => {
    await initI18n();
  });

  it('should register all 6 core supported languages', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(['en', 'es', 'de', 'fr', 'hi', 'ja']);
  });

  it('should translate English keys by default', async () => {
    await changeAppLanguage('en');
    expect(i18n.t('tabs.today')).toBe('Today');
    expect(i18n.t('tabs.tasks')).toBe('Tasks');
    expect(i18n.t('common.done')).toBe('Done');
    expect(i18n.t('today.greeting')).toBe("Today's Focus");
  });

  it('should switch to Spanish and translate dynamically', async () => {
    await changeAppLanguage('es');
    expect(i18n.t('tabs.today')).toBe('Hoy');
    expect(i18n.t('tabs.tasks')).toBe('Tareas');
    expect(i18n.t('common.done')).toBe('Hecho');
  });

  it('should switch to German and translate dynamically', async () => {
    await changeAppLanguage('de');
    expect(i18n.t('tabs.today')).toBe('Heute');
    expect(i18n.t('tabs.tasks')).toBe('Aufgaben');
    expect(i18n.t('common.done')).toBe('Erledigt');
  });

  it('should switch to French and translate dynamically', async () => {
    await changeAppLanguage('fr');
    expect(i18n.t('tabs.today')).toBe("Aujourd'hui");
    expect(i18n.t('tabs.tasks')).toBe('Tâches');
    expect(i18n.t('common.done')).toBe('Terminé');
  });

  it('should switch to Hindi and translate dynamically', async () => {
    await changeAppLanguage('hi');
    expect(i18n.t('tabs.today')).toBe('आज');
    expect(i18n.t('tabs.tasks')).toBe('कार्य');
    expect(i18n.t('common.done')).toBe('पूर्ण');
  });

  it('should switch to Japanese and translate dynamically', async () => {
    await changeAppLanguage('ja');
    expect(i18n.t('tabs.today')).toBe('今日');
    expect(i18n.t('tabs.tasks')).toBe('タスク');
    expect(i18n.t('common.done')).toBe('完了');
  });

  it('should detect device language fallback safely', () => {
    const lang = getDeviceLanguage();
    expect(['en', 'es', 'de', 'fr', 'hi', 'ja']).toContain(lang);
  });
});
