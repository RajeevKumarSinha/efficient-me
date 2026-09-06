import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { SUPPORTED_LANGUAGES } from '../locales/i18n';
import { notificationEngine } from '../services/notifications/notificationEngine';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { clearAllData } from '../database/db';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onReplayOnboarding?: () => void;
  onOpenBackupModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onReplayOnboarding,
  onOpenBackupModal,
}) => {
  const { theme, isDarkMode, toggleTheme } = useThemeStore();
  const { currentLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [circadianAlarmEnabled, setCircadianAlarmEnabled] = useState(true);
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState(true);

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleToggleCircadian = async (val: boolean) => {
    setCircadianAlarmEnabled(val);
    notificationEngine.triggerHaptic('light');
    if (val) {
      await notificationEngine.scheduleDailyCircadianCheckIn();
    }
  };

  const handleReplayTutorial = () => {
    onClose();
    if (onReplayOnboarding) {
      setTimeout(() => {
        onReplayOnboarding();
      }, 300);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                ⚙️ {t('settings.title')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                App preferences & local data controls
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.colors.cardBackgroundElevated }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Section: Appearance & Language */}
            <Text style={[styles.sectionTitle, { color: theme.colors.accent }]}>
              {t('settings.appearance').toUpperCase()} & {t('settings.language').toUpperCase()}
            </Text>

            {/* Dark Mode Switch */}
            <View
              style={[
                styles.settingRow,
                {
                  backgroundColor: theme.colors.cardBackgroundElevated,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>{isDarkMode ? '🌙' : '☀️'}</Text>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>
                    {isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>
                    Toggle high-contrast themes
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={() => {
                  notificationEngine.triggerHaptic('light');
                  toggleTheme();
                }}
                trackColor={{ false: '#334155', true: theme.colors.accent }}
                thumbColor="#FFF"
              />
            </View>

            {/* Language Selection Row */}
            <TouchableOpacity
              style={[
                styles.settingRow,
                {
                  backgroundColor: theme.colors.cardBackgroundElevated,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              onPress={() => {
                notificationEngine.triggerHaptic('light');
                setLangModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>🌐</Text>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>
                    {t('settings.language')}
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>
                    {activeLangObj.nativeName} ({activeLangObj.name})
                  </Text>
                </View>
              </View>
              <View style={styles.langPill}>
                <Text style={styles.langPillFlag}>{activeLangObj.flag}</Text>
                <Text style={[styles.langPillText, { color: theme.colors.accent }]}>Change ➔</Text>
              </View>
            </TouchableOpacity>

            {/* Section: Circadian & Alarms */}
            <Text style={[styles.sectionTitle, { color: theme.colors.accent, marginTop: 18 }]}>
              NOTIFICATIONS & ALARMS
            </Text>

            <View
              style={[
                styles.settingRow,
                {
                  backgroundColor: theme.colors.cardBackgroundElevated,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>⚡</Text>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>
                    Circadian Peak Alarm
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>
                    Auto-schedules 30m prior to logged energy peak
                  </Text>
                </View>
              </View>
              <Switch
                value={circadianAlarmEnabled}
                onValueChange={handleToggleCircadian}
                trackColor={{ false: '#334155', true: theme.colors.energyHigh }}
                thumbColor="#FFF"
              />
            </View>

            {/* Section: Data Sovereignty & Portability */}
            <Text style={[styles.sectionTitle, { color: theme.colors.accent, marginTop: 18 }]}>
              DATA PRIVACY & SOVEREIGNTY
            </Text>

            {/* Encrypted Backup Manager Button */}
            {onOpenBackupModal && (
              <TouchableOpacity
                style={[
                  styles.settingRow,
                  {
                    backgroundColor: theme.colors.cardBackgroundElevated,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    onOpenBackupModal();
                  }, 300);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIcon}>🔒</Text>
                  <View>
                    <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>
                      Encrypted Backup Manager
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>
                      AES-256 local password-protected archives
                    </Text>
                  </View>
                </View>
                <Text style={[styles.actionArrow, { color: theme.colors.accent }]}>➔</Text>
              </TouchableOpacity>
            )}

            {/* Replay Onboarding Flow */}
            <TouchableOpacity
              style={[
                styles.settingRow,
                {
                  backgroundColor: theme.colors.cardBackgroundElevated,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              onPress={handleReplayTutorial}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>🚀</Text>
                <View>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>
                    Replay Welcome Tutorial
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>
                    Review Circadian, Elastic Habits & Soundscapes
                  </Text>
                </View>
              </View>
              <Text style={[styles.actionArrow, { color: theme.colors.accent }]}>➔</Text>
            </TouchableOpacity>

            {/* Factory Reset / Erase All Data */}
            <TouchableOpacity
              style={[
                styles.settingRow,
                {
                  backgroundColor: theme.colors.cardBackgroundElevated,
                  borderColor: '#EF4444' + '40',
                },
              ]}
              onPress={() => {
                notificationEngine.triggerHaptic('heavy');
                Alert.alert(
                  '⚠️ Erase All Local Data?',
                  'This will permanently delete all your tasks, habits, goals, and energy history from this device. This action is 100% irreversible.',
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: 'Erase Everything',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await clearAllData();
                          notificationEngine.triggerHaptic('success');
                          Alert.alert('✅ Data Cleared', 'All local data has been erased successfully.');
                          onClose();
                        } catch (err: any) {
                          Alert.alert('Error', err?.message || 'Failed to clear data.');
                        }
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>🗑️</Text>
                <View>
                  <Text style={[styles.rowTitle, { color: '#EF4444' }]}>
                    Erase All Local Data
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textMuted }]}>
                    Permanent factory reset & clean database
                  </Text>
                </View>
              </View>
              <Text style={[styles.actionArrow, { color: '#EF4444' }]}>➔</Text>
            </TouchableOpacity>

            {/* Privacy Trust Card */}
            <View
              style={[
                styles.trustCard,
                {
                  backgroundColor: theme.colors.accentLight,
                  borderColor: theme.colors.accent + '40',
                },
              ]}
            >
              <Text style={styles.trustIcon}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trustTitle, { color: theme.colors.accent }]}>
                  {t('common.offline')}
                </Text>
                <Text style={[styles.trustDesc, { color: theme.colors.textSecondary }]}>
                  {t('settings.privacy')}
                </Text>
              </View>
            </View>

            {/* Version */}
            <Text style={[styles.versionText, { color: theme.colors.textMuted }]}>
              {t('settings.version')} • Offline Engine
            </Text>
          </ScrollView>
        </View>
      </View>

      {/* Language Selector Sub-Modal */}
      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 26,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  contentScroll: {
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 1,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langPillFlag: {
    fontSize: 18,
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 14,
  },
  trustIcon: {
    fontSize: 24,
  },
  trustTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  trustDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 4,
  },
});
