import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { reviewGenerator, RetroSummary } from '../services/analytics/reviewGenerator';
import { notificationEngine } from '../services/notifications/notificationEngine';

interface WeeklyRetroModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WeeklyRetroModal: React.FC<WeeklyRetroModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useThemeStore();
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [summary, setSummary] = useState<RetroSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRetro(period);
    }
  }, [visible, period]);

  const loadRetro = async (selectedPeriod: 'weekly' | 'monthly') => {
    setLoading(true);
    try {
      const data = await reviewGenerator.generateRetro(selectedPeriod);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (nextPeriod: 'weekly' | 'monthly') => {
    notificationEngine.triggerHaptic('light');
    setPeriod(nextPeriod);
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
                {period === 'weekly' ? '7-Day Weekly Review' : '30-Day Monthly Retro'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Automated energy vs. productivity equilibrium audit
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeText, { color: theme.colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Period Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  backgroundColor:
                    period === 'weekly'
                      ? theme.colors.accent
                      : theme.colors.cardBackgroundElevated,
                  borderColor: period === 'weekly' ? theme.colors.accent : theme.colors.cardBorder,
                },
              ]}
              onPress={() => handlePeriodChange('weekly')}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: period === 'weekly' ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                📅 Weekly Review
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  backgroundColor:
                    period === 'monthly'
                      ? theme.colors.accent
                      : theme.colors.cardBackgroundElevated,
                  borderColor: period === 'monthly' ? theme.colors.accent : theme.colors.cardBorder,
                },
              ]}
              onPress={() => handlePeriodChange('monthly')}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: period === 'monthly' ? '#FFF' : theme.colors.textSecondary },
                ]}
              >
                📊 Monthly Retro
              </Text>
            </TouchableOpacity>
          </View>

          {loading || !summary ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                Synthesizing energy & productivity metrics...
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Heuristic Insight Card */}
              <View
                style={[
                  styles.insightCard,
                  {
                    backgroundColor: theme.colors.accentLight,
                    borderColor: theme.colors.accent,
                  },
                ]}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>🧠</Text>
                  <Text style={[styles.insightTitle, { color: theme.colors.accent }]}>
                    Behavioral Health Insight
                  </Text>
                </View>
                <Text style={[styles.insightText, { color: theme.colors.textPrimary }]}>
                  {summary.heuristicInsight}
                </Text>
              </View>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: theme.colors.cardBackgroundElevated },
                  ]}
                >
                  <Text style={[styles.metricNumber, { color: theme.colors.success }]}>
                    {summary.tasksCompleted}
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                    Tasks Completed
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: theme.colors.cardBackgroundElevated },
                  ]}
                >
                  <Text style={[styles.metricNumber, { color: theme.colors.accent }]}>
                    {summary.taskCompletionRate}%
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                    Completion Rate
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: theme.colors.cardBackgroundElevated },
                  ]}
                >
                  <Text style={[styles.metricNumber, { color: theme.colors.energyHigh }]}>
                    {summary.avgEnergy} ⚡
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                    Avg Energy
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: theme.colors.cardBackgroundElevated },
                  ]}
                >
                  <Text style={[styles.metricNumber, { color: theme.colors.energyMed }]}>
                    {summary.avgMood} 😊
                  </Text>
                  <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                    Avg Mood
                  </Text>
                </View>
              </View>

              {/* Elastic Tier Distribution */}
              <View
                style={[
                  styles.tierSection,
                  { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  🌱 Elastic Habits Breakdown ({summary.totalHabitsLogged} Logs)
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
                  Adaptation across energy states
                </Text>

                <View style={styles.tierBarContainer}>
                  <View
                    style={[
                      styles.tierBarSegment,
                      {
                        flex: Math.max(summary.tierBreakdown.miniPercent, 5),
                        backgroundColor: theme.colors.energyLow,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.tierBarSegment,
                      {
                        flex: Math.max(summary.tierBreakdown.standardPercent, 5),
                        backgroundColor: theme.colors.energyMed,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.tierBarSegment,
                      {
                        flex: Math.max(summary.tierBreakdown.plusPercent, 5),
                        backgroundColor: theme.colors.energyHigh,
                      },
                    ]}
                  />
                </View>

                <View style={styles.tierLegendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.energyLow }]} />
                    <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                      🌱 Mini: {summary.tierBreakdown.miniPercent}% ({summary.tierBreakdown.mini})
                    </Text>
                  </View>

                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.energyMed }]} />
                    <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                      ⭐ Standard: {summary.tierBreakdown.standardPercent}% ({summary.tierBreakdown.standard})
                    </Text>
                  </View>

                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.colors.energyHigh }]} />
                    <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                      🚀 Plus: {summary.tierBreakdown.plusPercent}% ({summary.tierBreakdown.plus})
                    </Text>
                  </View>
                </View>
              </View>

              {/* Key Takeaways */}
              <View
                style={[
                  styles.takeawayCard,
                  { backgroundColor: theme.colors.cardBackgroundElevated, borderColor: theme.colors.cardBorder },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  📋 Key Takeaways & Recommendations
                </Text>
                {summary.keyTakeaways.map((item, idx) => (
                  <View key={idx} style={styles.takeawayRow}>
                    <Text style={[styles.takeawayBullet, { color: theme.colors.accent }]}>•</Text>
                    <Text style={[styles.takeawayText, { color: theme.colors.textSecondary }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.closeActionBtn, { backgroundColor: theme.colors.accent }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.closeActionBtnText}>Done</Text>
            </TouchableOpacity>
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
    maxHeight: '90%',
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
    fontSize: 18,
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
  toggleRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  insightCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  insightIcon: {
    fontSize: 16,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 19,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  tierSection: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: -4,
  },
  tierBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
    gap: 2,
  },
  tierBarSegment: {
    height: '100%',
    borderRadius: 3,
  },
  tierLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  takeawayCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  takeawayBullet: {
    fontSize: 14,
    fontWeight: '900',
  },
  takeawayText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  closeActionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeActionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
