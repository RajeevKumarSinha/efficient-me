import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/useThemeStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../locales/i18n';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const { currentLanguage, setLanguage } = useLanguageStore();

  const handleSelectLanguage = async (langCode: SupportedLanguage) => {
    notificationEngine.triggerHaptic('medium');
    await setLanguage(langCode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
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
                🌐 {t('settings.language')}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Select your preferred interface language
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

          {/* Language Options List */}
          <ScrollView contentContainerStyle={styles.listContent}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleSelectLanguage(lang.code)}
                  style={[
                    styles.langCard,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.accentLight
                        : theme.colors.cardBackgroundElevated,
                      borderColor: isSelected
                        ? theme.colors.accent
                        : theme.colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.langLeft}>
                    <Text style={styles.flag}>{lang.flag}</Text>
                    <View>
                      <Text
                        style={[
                          styles.langNativeName,
                          {
                            color: isSelected
                              ? theme.colors.accent
                              : theme.colors.textPrimary,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                      <Text style={[styles.langEnglishName, { color: theme.colors.textSecondary }]}>
                        {lang.name}
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.checkmarkCircle,
                        { backgroundColor: theme.colors.accent },
                      ]}
                    >
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Privacy Note */}
          <View style={[styles.footer, { borderTopColor: theme.colors.cardBorder }]}>
            <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
              🔒 {t('common.offline')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
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
  listContent: {
    gap: 10,
    paddingBottom: 8,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flag: {
    fontSize: 28,
  },
  langNativeName: {
    fontSize: 16,
  },
  langEnglishName: {
    fontSize: 12,
    marginTop: 1,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
