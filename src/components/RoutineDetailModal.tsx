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
import { RoutineBlueprint } from '../services/blueprints/routineBlueprints';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface RoutineDetailModalProps {
  blueprint: RoutineBlueprint | null;
  isInstalled: boolean;
  visible: boolean;
  onClose: () => void;
  onInstall: (blueprint: RoutineBlueprint) => Promise<void>;
  onUninstall: (blueprint: RoutineBlueprint) => Promise<void>;
}

export const RoutineDetailModal: React.FC<RoutineDetailModalProps> = ({
  blueprint,
  isInstalled,
  visible,
  onClose,
  onInstall,
  onUninstall,
}) => {
  const { theme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [expandedHabitIndex, setExpandedHabitIndex] = useState<number | null>(0); // First habit open by default

  if (!blueprint) return null;

  const handleInstallPress = async () => {
    notificationEngine.triggerHaptic('medium');
    setLoading(true);
    try {
      await onInstall(blueprint);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstallPress = () => {
    notificationEngine.triggerHaptic('heavy');
    Alert.alert(
      `Uninstall "${blueprint.title}"?`,
      `This will remove the ${blueprint.habits.length} habits and ${blueprint.chores.length} recurring chores added by this pack. Your other habits will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await onUninstall(blueprint);
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
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: blueprint.accentColor + '25' }]}>
                <Text style={styles.headerIcon}>{blueprint.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  {blueprint.title}
                </Text>
                <View style={styles.badgeRow}>
                  <Text style={[styles.categoryBadge, { color: blueprint.accentColor }]}>
                    {blueprint.category}
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isInstalled
                          ? theme.colors.successBg
                          : theme.colors.cardBackgroundElevated,
                        borderColor: isInstalled
                          ? theme.colors.success
                          : theme.colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isInstalled ? theme.colors.success : theme.colors.textMuted },
                      ]}
                    >
                      {isInstalled ? '✓ Installed & Active' : 'Not Installed'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Tagline */}
            <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
              {blueprint.tagline}
            </Text>

            {/* Science & Rationale Callout */}
            <View
              style={[
                styles.scienceCard,
                {
                  backgroundColor: blueprint.accentColor + '12',
                  borderColor: blueprint.accentColor + '40',
                },
              ]}
            >
              <View style={styles.scienceHeader}>
                <Text style={styles.scienceIcon}>🔬</Text>
                <Text style={[styles.scienceTitle, { color: blueprint.accentColor }]}>
                  Cognitive Science & Rationale
                </Text>
              </View>
              <Text style={[styles.scienceText, { color: theme.colors.textPrimary }]}>
                {blueprint.scienceAndRationale}
              </Text>
            </View>

            {/* Best For Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: theme.colors.textMuted }]}>
                🎯 Best Suited For:
              </Text>
              {blueprint.bestFor.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: blueprint.accentColor }]}>•</Text>
                  <Text style={[styles.bulletText, { color: theme.colors.textSecondary }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            {/* Habits with Step-by-Step Demos */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: theme.colors.textMuted }]}>
                🌱 Elastic Habits & Step-by-Step Demos ({blueprint.habits.length}):
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
                Tap any habit to view step-by-step technique and tier instructions
              </Text>

              {blueprint.habits.map((habit, idx) => {
                const isExpanded = expandedHabitIndex === idx;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.habitCard,
                      {
                        backgroundColor: theme.colors.cardBackgroundElevated,
                        borderColor: isExpanded ? blueprint.accentColor : theme.colors.cardBorder,
                      },
                    ]}
                  >
                    {/* Habit Header (Toggle Accordion) */}
                    <TouchableOpacity
                      style={styles.habitHeaderRow}
                      onPress={() => {
                        notificationEngine.triggerHaptic('light');
                        setExpandedHabitIndex(isExpanded ? null : idx);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.habitTitle, { color: theme.colors.textPrimary }]}>
                          {habit.title}
                        </Text>
                        <Text style={[styles.habitCategory, { color: blueprint.accentColor }]}>
                          {habit.category} • Energy Level {habit.energyLevel}⚡
                        </Text>
                      </View>
                      <Text style={[styles.accordionArrow, { color: theme.colors.textMuted }]}>
                        {isExpanded ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>

                    {/* Expanded Detail Body */}
                    {isExpanded && (
                      <View style={styles.habitDetailBody}>
                        {/* What is it */}
                        <View style={styles.infoBlock}>
                          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                            💡 What is this:
                          </Text>
                          <Text style={[styles.infoText, { color: theme.colors.textPrimary }]}>
                            {habit.whatIsIt}
                          </Text>
                        </View>

                        {/* Why it works */}
                        <View style={styles.infoBlock}>
                          <Text style={[styles.infoLabel, { color: theme.colors.accent }]}>
                            🧠 Why it works (The Science):
                          </Text>
                          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            {habit.whyItWorks}
                          </Text>
                        </View>

                        {/* Step-by-Step Demo */}
                        <View style={[styles.demoCard, { backgroundColor: theme.colors.cardBackground }]}>
                          <Text style={[styles.demoHeading, { color: blueprint.accentColor }]}>
                            📋 Step-by-Step Demonstration:
                          </Text>
                          {habit.stepByStepDemo.map((step, sIdx) => (
                            <Text
                              key={sIdx}
                              style={[styles.stepItem, { color: theme.colors.textPrimary }]}
                            >
                              {step}
                            </Text>
                          ))}
                        </View>

                        {/* Elastic Tiers */}
                        <View style={styles.tiersBlock}>
                          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                            ⚡ Elastic Tiers Breakdown:
                          </Text>
                          
                          <View style={[styles.tierDetailRow, { borderLeftColor: theme.colors.energyLow }]}>
                            <Text style={[styles.tierDetailName, { color: theme.colors.energyLow }]}>
                              🌱 Mini (1⚡):
                            </Text>
                            <Text style={[styles.tierDetailDesc, { color: theme.colors.textPrimary }]}>
                              {habit.elasticMini}
                            </Text>
                          </View>

                          <View style={[styles.tierDetailRow, { borderLeftColor: theme.colors.energyMed }]}>
                            <Text style={[styles.tierDetailName, { color: theme.colors.energyMed }]}>
                              ⭐ Standard (2⚡):
                            </Text>
                            <Text style={[styles.tierDetailDesc, { color: theme.colors.textPrimary }]}>
                              {habit.elasticStandard}
                            </Text>
                          </View>

                          <View style={[styles.tierDetailRow, { borderLeftColor: theme.colors.energyHigh }]}>
                            <Text style={[styles.tierDetailName, { color: theme.colors.energyHigh }]}>
                              🚀 Plus (3⚡):
                            </Text>
                            <Text style={[styles.tierDetailDesc, { color: theme.colors.textPrimary }]}>
                              {habit.elasticPlus}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Recurring Maintenance Chores */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: theme.colors.textMuted }]}>
                🧹 Periodic Life Operations ({blueprint.chores.length}):
              </Text>

              {blueprint.chores.map((chore, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.choreCard,
                    { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                  ]}
                >
                  <View style={styles.choreHeader}>
                    <Text style={[styles.choreTitle, { color: theme.colors.textPrimary }]}>
                      {chore.title}
                    </Text>
                    <View style={[styles.cadencePill, { backgroundColor: blueprint.accentColor + '20' }]}>
                      <Text style={[styles.cadencePillText, { color: blueprint.accentColor }]}>
                        {chore.choreCadence?.replace('_', '-')} • {chore.durationMins}m
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.choreDesc, { color: theme.colors.textSecondary }]}>
                    {chore.description}
                  </Text>

                  <View style={styles.choreChecklist}>
                    <Text style={[styles.checklistHeading, { color: theme.colors.textMuted }]}>
                      Execution Checklist:
                    </Text>
                    {chore.checklist.map((item, cIdx) => (
                      <Text key={cIdx} style={[styles.checklistItem, { color: theme.colors.textSecondary }]}>
                        {item}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Sticky Bottom Actions */}
          <View style={[styles.footer, { borderTopColor: theme.colors.cardBorder }]}>
            {isInstalled ? (
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={[
                    styles.uninstallBtn,
                    { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.danger },
                  ]}
                  onPress={handleUninstallPress}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.danger} />
                  ) : (
                    <Text style={[styles.uninstallBtnText, { color: theme.colors.danger }]}>
                      🗑️ Uninstall Routine Pack
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.installFullBtn, { backgroundColor: blueprint.accentColor }]}
                onPress={handleInstallPress}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.installFullBtnText}>
                    + Install "{blueprint.title}"
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
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
    maxHeight: '92%',
    paddingBottom: 10,
  },
  header: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 22,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
  },
  scienceCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  scienceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  scienceIcon: {
    fontSize: 16,
  },
  scienceTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scienceText: {
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: -4,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: -2,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  habitCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  habitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  habitCategory: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  accordionArrow: {
    fontSize: 12,
    paddingLeft: 8,
  },
  habitDetailBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  infoBlock: {
    marginTop: 8,
    gap: 3,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  demoCard: {
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  demoHeading: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  stepItem: {
    fontSize: 12,
    lineHeight: 17,
  },
  tiersBlock: {
    gap: 6,
    marginTop: 4,
  },
  tierDetailRow: {
    paddingLeft: 10,
    borderLeftWidth: 3,
    paddingVertical: 2,
  },
  tierDetailName: {
    fontSize: 11,
    fontWeight: '800',
  },
  tierDetailDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  choreCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginBottom: 8,
  },
  choreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choreTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },
  cadencePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cadencePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  choreDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  choreChecklist: {
    marginTop: 6,
    gap: 3,
  },
  checklistHeading: {
    fontSize: 11,
    fontWeight: '700',
  },
  checklistItem: {
    fontSize: 11,
    lineHeight: 15,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  installFullBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installFullBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  uninstallBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uninstallBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
