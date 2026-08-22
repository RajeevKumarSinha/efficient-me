import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useHabitStore } from '../store/useHabitStore';
import { useTaskStore } from '../store/useTaskStore';
import { ROUTINE_BLUEPRINTS, installBlueprintPack, RoutineBlueprint } from '../services/blueprints/routineBlueprints';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface RoutineMarketplaceModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RoutineMarketplaceModal: React.FC<RoutineMarketplaceModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const { loadHabits } = useHabitStore();
  const { loadTasks } = useTaskStore();

  const [selectedPack, setSelectedPack] = useState<RoutineBlueprint | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleInstall = async (blueprint: RoutineBlueprint) => {
    notificationEngine.triggerHaptic('medium');
    setInstallingId(blueprint.id);
    try {
      const { habitsCount, choresCount } = await installBlueprintPack(blueprint.id);
      await Promise.all([loadHabits(), loadTasks()]);
      notificationEngine.triggerHaptic('success');
      Alert.alert(
        '🎉 Routine Installed!',
        `Successfully added ${habitsCount} elastic habits and ${choresCount} periodic chores from "${blueprint.title}".`
      );
      onClose();
    } catch (e: any) {
      Alert.alert('Installation Failed', e?.message || 'Could not install pack.');
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                Curated Routine Marketplace
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Pre-built habit & chore packs designed for your cognitive style
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {ROUTINE_BLUEPRINTS.map((bp) => {
              const isSelected = selectedPack?.id === bp.id;
              const isInstalling = installingId === bp.id;

              return (
                <View
                  key={bp.id}
                  style={[
                    styles.packCard,
                    {
                      backgroundColor: theme.colors.cardBackgroundElevated,
                      borderColor: isSelected ? bp.accentColor : theme.colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.packHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: bp.accentColor + '20' }]}>
                      <Text style={styles.packIcon}>{bp.icon}</Text>
                    </View>
                    <View style={styles.packHeaderInfo}>
                      <Text style={[styles.packTitle, { color: theme.colors.textPrimary }]}>
                        {bp.title}
                      </Text>
                      <Text style={[styles.packCategory, { color: bp.accentColor }]}>
                        {bp.category} • {bp.habits.length} Habits • {bp.chores.length} Chores
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.packTagline, { color: theme.colors.textSecondary }]}>
                    {bp.tagline}
                  </Text>

                  {/* Habit Preview */}
                  <View style={styles.previewSection}>
                    <Text style={[styles.previewHeading, { color: theme.colors.textMuted }]}>
                      Includes Elastic Habits:
                    </Text>
                    {bp.habits.map((h, idx) => (
                      <View key={idx} style={styles.habitPreviewRow}>
                        <Text style={[styles.bullet, { color: bp.accentColor }]}>•</Text>
                        <Text style={[styles.habitPreviewText, { color: theme.colors.textPrimary }]}>
                          <Text style={{ fontWeight: '700' }}>{h.title}</Text>
                          <Text style={{ color: theme.colors.textMuted }}> ({h.elasticMini})</Text>
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Periodic Chores Preview */}
                  <View style={styles.previewSection}>
                    <Text style={[styles.previewHeading, { color: theme.colors.textMuted }]}>
                      Includes Recurring Maintenance:
                    </Text>
                    {bp.chores.map((c, idx) => (
                      <View key={idx} style={styles.habitPreviewRow}>
                        <Text style={[styles.bullet, { color: bp.accentColor }]}>•</Text>
                        <Text style={[styles.habitPreviewText, { color: theme.colors.textPrimary }]}>
                          <Text style={{ fontWeight: '600' }}>{c.title}</Text>
                          <Text style={{ color: bp.accentColor }}> [{c.choreCadence?.replace('_', '-')}]</Text>
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Install Button */}
                  <TouchableOpacity
                    style={[styles.installBtn, { backgroundColor: bp.accentColor }]}
                    onPress={() => handleInstall(bp)}
                    disabled={isInstalling}
                    activeOpacity={0.8}
                  >
                    {isInstalling ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.installBtnText}>+ Install Routine Pack</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  packCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packIcon: {
    fontSize: 22,
  },
  packHeaderInfo: {
    flex: 1,
  },
  packTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  packCategory: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  packTagline: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  previewSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  previewHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  habitPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    fontWeight: '900',
  },
  habitPreviewText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  installBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
