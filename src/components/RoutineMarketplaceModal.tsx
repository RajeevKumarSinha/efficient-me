import React, { useState, useEffect } from 'react';
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
import {
  ROUTINE_BLUEPRINTS,
  installBlueprintPack,
  uninstallBlueprintPack,
  getInstalledBlueprintIds,
  RoutineBlueprint,
} from '../services/blueprints/routineBlueprints';
import { RoutineDetailModal } from './RoutineDetailModal';
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

  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [detailBlueprint, setDetailBlueprint] = useState<RoutineBlueprint | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [uninstallingId, setUninstallingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadInstalled();
    }
  }, [visible]);

  const loadInstalled = async () => {
    const ids = await getInstalledBlueprintIds();
    setInstalledIds(ids);
  };

  const handleInstall = async (blueprint: RoutineBlueprint) => {
    notificationEngine.triggerHaptic('medium');
    setInstallingId(blueprint.id);
    try {
      const { habitsCount, choresCount } = await installBlueprintPack(blueprint.id);
      await Promise.all([loadHabits(), loadTasks(), loadInstalled()]);
      notificationEngine.triggerHaptic('success');
      Alert.alert(
        '🎉 Routine Installed!',
        `Successfully added ${habitsCount} elastic habits and ${choresCount} periodic chores from "${blueprint.title}".`
      );
    } catch (e: any) {
      Alert.alert('Installation Failed', e?.message || 'Could not install pack.');
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = async (blueprint: RoutineBlueprint) => {
    notificationEngine.triggerHaptic('heavy');
    Alert.alert(
      `Uninstall "${blueprint.title}"?`,
      `This will remove the ${blueprint.habits.length} habits and ${blueprint.chores.length} periodic chores added by this pack. Your other custom habits will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            setUninstallingId(blueprint.id);
            try {
              const { habitsRemoved, choresRemoved } = await uninstallBlueprintPack(blueprint.id);
              await Promise.all([loadHabits(), loadTasks(), loadInstalled()]);
              notificationEngine.triggerHaptic('success');
              if (detailModalVisible) {
                setDetailModalVisible(false);
              }
              Alert.alert(
                '🗑️ Routine Uninstalled',
                `Removed ${habitsRemoved} habits and ${choresRemoved} periodic chores.`
              );
            } catch (e: any) {
              Alert.alert('Uninstall Failed', e?.message || 'Could not uninstall pack.');
            } finally {
              setUninstallingId(null);
            }
          },
        },
      ]
    );
  };

  const openDetail = (blueprint: RoutineBlueprint) => {
    notificationEngine.triggerHaptic('light');
    setDetailBlueprint(blueprint);
    setDetailModalVisible(true);
  };

  const categories = ['All', 'ADHD & Focus', 'Productivity', 'Wellness', 'Operations'];

  const filteredPacks =
    selectedCategory === 'All'
      ? ROUTINE_BLUEPRINTS
      : ROUTINE_BLUEPRINTS.filter((bp) => bp.category === selectedCategory);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.container,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                    Curated Routine Marketplace
                  </Text>
                  <View
                    style={[
                      styles.activeCounterBadge,
                      { backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent },
                    ]}
                  >
                    <Text style={[styles.activeCounterText, { color: theme.colors.accent }]}>
                      {installedIds.length}/{ROUTINE_BLUEPRINTS.length} Active
                    </Text>
                  </View>
                </View>
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                  Pre-built habit & chore systems backed by cognitive science
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter Chips */}
            <View style={styles.categoryScrollContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.accent
                            : theme.colors.cardBackgroundElevated,
                          borderColor: isSelected ? theme.colors.accent : theme.colors.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: isSelected ? '#FFF' : theme.colors.textSecondary },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Pack List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {filteredPacks.map((bp) => {
                const isInstalled = installedIds.includes(bp.id);
                const isInstalling = installingId === bp.id;
                const isUninstalling = uninstallingId === bp.id;

                return (
                  <View
                    key={bp.id}
                    style={[
                      styles.packCard,
                      {
                        backgroundColor: theme.colors.cardBackgroundElevated,
                        borderColor: isInstalled ? theme.colors.success : theme.colors.cardBorder,
                      },
                    ]}
                  >
                    {/* Header */}
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

                      {/* Installed Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isInstalled
                              ? theme.colors.successBg
                              : theme.colors.cardBackground,
                            borderColor: isInstalled
                              ? theme.colors.success
                              : theme.colors.cardBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isInstalled ? theme.colors.success : theme.colors.textMuted },
                          ]}
                        >
                          {isInstalled ? '✓ Installed' : 'Available'}
                        </Text>
                      </View>
                    </View>

                    {/* Tagline */}
                    <Text style={[styles.packTagline, { color: theme.colors.textSecondary }]}>
                      {bp.tagline}
                    </Text>

                    {/* Habit Quick Preview */}
                    <View style={styles.previewSection}>
                      <Text style={[styles.previewHeading, { color: theme.colors.textMuted }]}>
                        Includes Habits (With Elastic Tiers):
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

                    {/* Chores Quick Preview */}
                    <View style={styles.previewSection}>
                      <Text style={[styles.previewHeading, { color: theme.colors.textMuted }]}>
                        Includes Periodic Chores:
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

                    {/* Action Buttons Row */}
                    <View style={styles.actionsRow}>
                      {/* Guide & Demo Button */}
                      <TouchableOpacity
                        style={[
                          styles.guideBtn,
                          {
                            backgroundColor: theme.colors.cardBackground,
                            borderColor: theme.colors.cardBorder,
                          },
                        ]}
                        onPress={() => openDetail(bp)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.guideBtnText, { color: theme.colors.textPrimary }]}>
                          📖 View Guide & Demo
                        </Text>
                      </TouchableOpacity>

                      {/* Install / Uninstall Button */}
                      {isInstalled ? (
                        <TouchableOpacity
                          style={[
                            styles.uninstallCardBtn,
                            {
                              backgroundColor: theme.colors.dangerBg,
                              borderColor: theme.colors.danger,
                            },
                          ]}
                          onPress={() => handleUninstall(bp)}
                          disabled={isUninstalling}
                          activeOpacity={0.75}
                        >
                          {isUninstalling ? (
                            <ActivityIndicator size="small" color={theme.colors.danger} />
                          ) : (
                            <Text style={[styles.uninstallCardBtnText, { color: theme.colors.danger }]}>
                              🗑️ Uninstall
                            </Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.installCardBtn, { backgroundColor: bp.accentColor }]}
                          onPress={() => handleInstall(bp)}
                          disabled={isInstalling}
                          activeOpacity={0.8}
                        >
                          {isInstalling ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.installCardBtnText}>+ Install</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Deep-Dive Guide & Demonstration Modal */}
      <RoutineDetailModal
        blueprint={detailBlueprint}
        isInstalled={detailBlueprint ? installedIds.includes(detailBlueprint.id) : false}
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
      />
    </>
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
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  activeCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeCounterText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryScrollContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
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
    gap: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packIcon: {
    fontSize: 20,
  },
  packHeaderInfo: {
    flex: 1,
  },
  packTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  packCategory: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  packTagline: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  previewSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  previewHeading: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  habitPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  bullet: {
    fontSize: 13,
    fontWeight: '900',
  },
  habitPreviewText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  guideBtn: {
    flex: 1.2,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  installCardBtn: {
    flex: 0.8,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installCardBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  uninstallCardBtn: {
    flex: 0.8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uninstallCardBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
