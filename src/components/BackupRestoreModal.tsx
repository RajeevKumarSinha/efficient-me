import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHabitStore } from '../store/useHabitStore';
import { useGoalStore } from '../store/useGoalStore';
import { useEnergyStore } from '../store/useEnergyStore';
import { backupService } from '../services/backup/backupService';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface BackupRestoreModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const { loadTasks } = useTaskStore();
  const { loadHabits } = useHabitStore();
  const { loadGoals } = useGoalStore();
  const { loadTodayCheckIn } = useEnergyStore();

  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [restorePayloadText, setRestorePayloadText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateBackup = async () => {
    notificationEngine.triggerHaptic('medium');
    setLoading(true);
    try {
      const backupString = await backupService.createEncryptedBackup(exportPassphrase);
      const filename = `efficient_me_backup_${new Date().toISOString().split('T')[0]}.json`;
      await backupService.shareBackupFile(backupString, filename);
      notificationEngine.triggerHaptic('success');
      Alert.alert('✅ Backup Created', 'Your database snapshot has been generated securely.');
    } catch (e: any) {
      Alert.alert('Backup Failed', e?.message || 'Could not create backup.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restorePayloadText.trim()) {
      Alert.alert('Empty Payload', 'Please paste the backup JSON payload.');
      return;
    }

    notificationEngine.triggerHaptic('heavy');
    Alert.alert(
      'Confirm Database Restore',
      'This will merge or restore tasks, habits, and logs from the backup file into your local database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed with Restore',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await backupService.restoreEncryptedBackup(
                restorePayloadText.trim(),
                restorePassphrase
              );
              await Promise.all([
                loadTasks(),
                loadHabits(),
                loadGoals(),
                loadTodayCheckIn(),
              ]);
              notificationEngine.triggerHaptic('success');
              Alert.alert(
                '🎉 Restore Completed',
                `Successfully restored ${res.tasksCount} tasks, ${res.habitsCount} habits, ${res.goalsCount} goals, and ${res.logsCount} habit logs.`
              );
              setRestorePayloadText('');
              setRestorePassphrase('');
              onClose();
            } catch (e: any) {
              Alert.alert('Restore Failed', e?.message || 'Decryption or restore failed.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                🔒 Encrypted Backup & Restore
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Complete local SQLite data sovereignty & migration
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  backgroundColor:
                    activeTab === 'export'
                      ? theme.colors.accent
                      : theme.colors.cardBackgroundElevated,
                  borderColor: activeTab === 'export' ? theme.colors.accent : theme.colors.cardBorder,
                },
              ]}
              onPress={() => {
                notificationEngine.triggerHaptic('light');
                setActiveTab('export');
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'export' ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                📥 Create Backup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                {
                  backgroundColor:
                    activeTab === 'restore'
                      ? theme.colors.accent
                      : theme.colors.cardBackgroundElevated,
                  borderColor: activeTab === 'restore' ? theme.colors.accent : theme.colors.cardBorder,
                },
              ]}
              onPress={() => {
                notificationEngine.triggerHaptic('light');
                setActiveTab('restore');
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'restore' ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                📤 Restore Snapshot
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'export' ? (
              <View style={styles.tabContent}>
                <View
                  style={[
                    styles.infoCard,
                    {
                      backgroundColor: theme.colors.accentLight,
                      borderColor: theme.colors.accent,
                    },
                  ]}
                >
                  <Text style={[styles.infoTitle, { color: theme.colors.accent }]}>
                    🛡️ Zero-Knowledge Local Encryption
                  </Text>
                  <Text style={[styles.infoDesc, { color: theme.colors.textPrimary }]}>
                    Your database snapshot is packaged entirely on-device. Set an optional passphrase to lock it with cipher protection.
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Optional Passphrase (Leave blank for standard backup):
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.cardBackgroundElevated,
                      borderColor: theme.colors.cardBorder,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  placeholder="e.g. MySecretPass123!"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  value={exportPassphrase}
                  onChangeText={setExportPassphrase}
                />

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]}
                  onPress={handleCreateBackup}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>📥 Export Secure Snapshot</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.tabContent}>
                <View
                  style={[
                    styles.infoCard,
                    {
                      backgroundColor: theme.colors.energyLowBg,
                      borderColor: theme.colors.energyLow,
                    },
                  ]}
                >
                  <Text style={[styles.infoTitle, { color: theme.colors.energyLow }]}>
                    🔄 Safe Transactional Restore
                  </Text>
                  <Text style={[styles.infoDesc, { color: theme.colors.textPrimary }]}>
                    Paste the raw JSON envelope string below. If encrypted, provide the original passphrase.
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Backup JSON Envelope String:
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.cardBackgroundElevated,
                      borderColor: theme.colors.cardBorder,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  placeholder='Paste {"app": "EfficientMe", ...} here'
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={5}
                  value={restorePayloadText}
                  onChangeText={setRestorePayloadText}
                />

                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                  Passphrase (If backup was encrypted):
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.cardBackgroundElevated,
                      borderColor: theme.colors.cardBorder,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter secret passphrase"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  value={restorePassphrase}
                  onChangeText={setRestorePassphrase}
                />

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
                  onPress={handleRestoreBackup}
                  disabled={loading || !restorePayloadText.trim()}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>📤 Validate & Restore Snapshot</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
    paddingBottom: 16,
  },
  header: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    gap: 12,
  },
  infoCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
  },
  textArea: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  actionBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
