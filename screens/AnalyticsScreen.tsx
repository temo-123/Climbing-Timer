import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { HistoryEntry } from '../types/models';
import { TYPE_EMOJIS } from '../data/constants';
import { globalStyles } from '../styles/globalStyles';
import Footer from '../components/Footer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Analytics'>;
interface WeekData { label: string; count: number; success: number; }

const getISOWeekLabel = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `W${weekNum}`;
};

const calcStreak = (history: HistoryEntry[]): { current: number; best: number } => {
  const successDates = new Set(history.filter(h => h.status === 'success').map(h => h.date.split('T')[0]));
  const sortedDates = Array.from(successDates).sort();
  if (sortedDates.length === 0) return { current: 0, best: 0 };
  let best = 1, run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / 86400000;
    if (diff === 1) { run++; if (run > best) best = run; } else { run = 1; }
  }
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (successDates.has(d.toISOString().split('T')[0])) current++;
    else if (i > 0) break;
  }
  return { current, best: Math.max(best, current) };
};

const getWeeklyData = (history: HistoryEntry[]): WeekData[] => {
  const weeks: { [k: string]: { count: number; success: number; weekStart: Date } } = {};
  for (const entry of history) {
    const d = new Date(entry.date);
    const label = getISOWeekLabel(d);
    const dayOfWeek = d.getDay() || 7;
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - dayOfWeek + 1);
    if (!weeks[label]) weeks[label] = { count: 0, success: 0, weekStart };
    weeks[label].count++;
    if (entry.status === 'success') weeks[label].success++;
  }
  return Object.entries(weeks)
    .sort(([, a], [, b]) => a.weekStart.getTime() - b.weekStart.getTime())
    .slice(-8)
    .map(([label, v]) => ({ label, count: v.count, success: v.success }));
};

const getTypeBreakdown = (history: HistoryEntry[]) => {
  const counts: { [type: string]: number } = {};
  for (const entry of history) { const type = entry.workoutType || 'fingerboard'; counts[type] = (counts[type] || 0) + 1; }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts).sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count, percent: Math.round((count / total) * 100) }));
};

const TYPE_COLORS: { [k: string]: string } = { fingerboard: '#4ecdc4', campus: '#ffa502', flexibility: '#2ed573', strength: '#a29bfe', endurance: '#ff9f43' };

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem('history');
      setHistory(raw ? JSON.parse(raw) : []);
    } catch { setHistory([]); } finally { setLoading(false); }
  };

  const total = history.length;
  const successCount = history.filter(h => h.status === 'success').length;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
  const { current: currentStreak, best: bestStreak } = calcStreak(history);
  const weeklyData = getWeeklyData(history);
  const typeBreakdown = getTypeBreakdown(history);
  const thisWeekLabel = getISOWeekLabel(new Date());
  const thisWeek = weeklyData.find(w => w.label === thisWeekLabel)?.count || 0;
  const maxWeekCount = Math.max(...weeklyData.map(w => w.count), 1);
  const getMonthCount = () => {
    const now = new Date();
    return history.filter(h => { const d = new Date(h.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={globalStyles.backText}>{t('common.back')}</Text></TouchableOpacity>
          <Text style={[globalStyles.title, styles.headerTitle]}>{t('analytics.title')}</Text>
          <View style={globalStyles.headerSpacer} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#aaa', fontSize: 16 }}>{t('common.loading')}</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={globalStyles.backText}>{t('common.back')}</Text></TouchableOpacity>
        <Text style={[globalStyles.title, styles.headerTitle]}>{t('analytics.title')}</Text>
        <View style={globalStyles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {total === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>{t('analytics.no_data_title')}</Text>
            <Text style={styles.emptyText}>{t('analytics.no_data_text')}</Text>
            <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('TrainingPlans')}>
              <Text style={styles.startButtonText}>{t('analytics.browse_plans')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{t('analytics.overview')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}><Text style={styles.statValue}>{currentStreak}</Text><Text style={styles.statLabel}>{t('analytics.day_streak')}</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{successRate}%</Text><Text style={styles.statLabel}>{t('analytics.success_rate')}</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{thisWeek}</Text><Text style={styles.statLabel}>{t('analytics.this_week')}</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{getMonthCount()}</Text><Text style={styles.statLabel}>{t('analytics.this_month')}</Text></View>
            </View>

            {bestStreak > 0 && (
              <View style={styles.streakCard}>
                <View style={styles.streakItem}><Text style={styles.streakVal}>{currentStreak}</Text><Text style={styles.streakLbl}>{t('analytics.current_streak')}</Text></View>
                <View style={styles.streakDivider} />
                <View style={styles.streakItem}><Text style={styles.streakVal}>{bestStreak}</Text><Text style={styles.streakLbl}>{t('analytics.best_streak')}</Text></View>
                <View style={styles.streakDivider} />
                <View style={styles.streakItem}><Text style={styles.streakVal}>{total}</Text><Text style={styles.streakLbl}>{t('analytics.total_sessions')}</Text></View>
              </View>
            )}

            {weeklyData.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('analytics.weekly_activity')}</Text>
                <View style={styles.chartCard}>
                  <View style={styles.chartBars}>
                    {weeklyData.map((week, i) => {
                      const heightPct = (week.count / maxWeekCount) * 100;
                      return (
                        <View key={i} style={styles.barColumn}>
                          <Text style={styles.barCount}>{week.count > 0 ? week.count : ''}</Text>
                          <View style={styles.barOuter}>
                            <View style={[styles.barInner, { height: `${Math.max(heightPct, 4)}%` }, week.label === thisWeekLabel && styles.barActive]} />
                          </View>
                          <Text style={[styles.barLabel, week.label === thisWeekLabel && styles.barLabelActive]}>{week.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text style={styles.chartNote}>{t('analytics.sessions_per_week')}</Text>
                </View>
              </>
            )}

            {typeBreakdown.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('analytics.training_mix')}</Text>
                <View style={styles.typeCard}>
                  {typeBreakdown.map(({ type, count, percent }) => (
                    <View key={type} style={styles.typeRow}>
                      <Text style={styles.typeEmoji}>{TYPE_EMOJIS[type] || '🏃'}</Text>
                      <View style={styles.typeInfo}>
                        <View style={styles.typeNameRow}>
                          <Text style={styles.typeName}>{t(`types.${type}` as any) || type}</Text>
                          <Text style={styles.typeCount}>{t('analytics.n_sessions', { n: count })}</Text>
                        </View>
                        <View style={styles.typeBarOuter}>
                          <View style={[styles.typeBarInner, { width: `${percent}%`, backgroundColor: TYPE_COLORS[type] || '#4ecdc4' }]} />
                        </View>
                      </View>
                      <Text style={[styles.typePct, { color: TYPE_COLORS[type] || '#4ecdc4' }]}>{percent}%</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('analytics.insights')}</Text>
            <View style={styles.insightCard}>
              {currentStreak >= 7 && <Text style={styles.insightItem}>{t('analytics.insight_streak7')}</Text>}
              {successRate >= 80 && <Text style={styles.insightItem}>{t('analytics.insight_success_high', { rate: successRate })}</Text>}
              {successRate < 50 && total > 5 && <Text style={styles.insightItem}>{t('analytics.insight_success_low')}</Text>}
              {thisWeek >= 3 && <Text style={styles.insightItem}>{t('analytics.insight_strong_week', { n: thisWeek })}</Text>}
              {thisWeek === 0 && <Text style={styles.insightItem}>{t('analytics.insight_no_week')}</Text>}
              {typeBreakdown.length === 1 && <Text style={styles.insightItem}>{t('analytics.insight_one_type', { type: t(`types.${typeBreakdown[0].type}` as any) || typeBreakdown[0].type })}</Text>}
              {total >= 20 && <Text style={styles.insightItem}>{t('analytics.insight_habits', { total })}</Text>}
            </View>
          </>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 22, marginBottom: 0, paddingTop: 0, flex: 1, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 20 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  emptyText: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  startButton: { backgroundColor: '#4ecdc4', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { color: '#4ecdc4', fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  streakCard: { backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16, flexDirection: 'row', marginBottom: 4 },
  streakItem: { flex: 1, alignItems: 'center' },
  streakVal: { color: '#fff', fontSize: 24, fontWeight: '800' },
  streakLbl: { color: '#888', fontSize: 11, marginTop: 4, textAlign: 'center' },
  streakDivider: { width: 1, backgroundColor: '#3d3d3d', marginVertical: 6 },
  chartCard: { backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
  barColumn: { flex: 1, alignItems: 'center' },
  barCount: { color: '#888', fontSize: 10, marginBottom: 2 },
  barOuter: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barInner: { width: '100%', backgroundColor: '#3d3d3d', borderRadius: 4, minHeight: 4 },
  barActive: { backgroundColor: '#4ecdc4' },
  barLabel: { color: '#666', fontSize: 9, marginTop: 4, textAlign: 'center' },
  barLabelActive: { color: '#4ecdc4', fontWeight: '700' },
  chartNote: { color: '#555', fontSize: 11, marginTop: 10, textAlign: 'center' },
  typeCard: { backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16, gap: 16 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeEmoji: { fontSize: 22, width: 30 },
  typeInfo: { flex: 1 },
  typeNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  typeName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  typeCount: { color: '#888', fontSize: 12 },
  typeBarOuter: { height: 6, backgroundColor: '#3d3d3d', borderRadius: 3, overflow: 'hidden' },
  typeBarInner: { height: '100%', borderRadius: 3 },
  typePct: { fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  insightCard: { backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16, gap: 12 },
  insightItem: { color: '#ccc', fontSize: 14, lineHeight: 20 },
});
