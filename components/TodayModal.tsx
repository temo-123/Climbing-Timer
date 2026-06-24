import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { TrainingPlan, HistoryEntry, PlanSession } from '../types/models';
import { localizedPlan, localizedWorkout } from '../data/presetPlans';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  visible: boolean;
  onClose: () => void;
  plan: TrainingPlan;
  session: PlanSession;
}

export default function TodayModal({ visible, onClose, plan, session }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigation = useNavigation<NavigationProp>();
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => { if (visible) loadHistory(); }, [visible]);

  const loadHistory = async () => {
    const raw = await AsyncStorage.getItem('history');
    const all: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const names = new Set(session.workouts.map(w => w.name));
    setRecentHistory(all.filter(h => names.has(h.workoutName)).slice(-7).reverse());
  };

  const weekNumber = (): string => {
    if (!plan.startDate || plan.weeks === 0) return '';
    const started = new Date(plan.startDate).getTime();
    const week = Math.min(Math.floor((Date.now() - started) / 604800000) + 1, plan.weeks);
    return t('plans.week_of', { current: week, total: plan.weeks });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.planName}>{plan.emoji} {localizedPlan(plan, lang).name}</Text>
              {weekNumber() !== '' && <Text style={styles.weekLabel}>{weekNumber()}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>{t('modal.today_session')}</Text>
            {session.workouts.map(w => {
              const lw = localizedWorkout(w, lang);
              return (
              <View key={w.id} style={styles.workoutCard}>
                <View style={styles.workoutTop}>
                  <Text style={styles.workoutName}>{lw.name}</Text>
                  {lw.description !== '' && <Text style={styles.workoutDesc}>{lw.description}</Text>}
                </View>
                <View style={styles.statsRow}>
                  <StatItem label={t('timer.hang')} value={`${w.hangTime}s`} />
                  <StatItem label={t('timer.rest')} value={`${w.restTime}s`} />
                  <StatItem label={t('custom.reps_lbl')} value={`${w.reps}`} />
                  <StatItem label={t('custom.sets_lbl')} value={`${w.sets}`} />
                  {w.recoverTime > 0 && <StatItem label={t('custom.recover_lbl')} value={`${w.recoverTime}s`} />}
                </View>
                {lw.coachTip !== '' && <Text style={styles.coachTip}>💬 {lw.coachTip}</Text>}
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => { onClose(); setTimeout(() => navigation.navigate('Timer', { workout: w }), 300); }}
                >
                  <Text style={styles.startBtnText}>▶  {t('modal.start')}</Text>
                </TouchableOpacity>
              </View>
              );
            })}

            {recentHistory.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t('modal.recent_history')}</Text>
                {recentHistory.map((h, i) => (
                  <View key={i} style={[styles.historyRow, { borderLeftColor: h.status === 'success' ? '#2ed573' : '#ff6b6b' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyName}>{h.workoutName}</Text>
                      <Text style={styles.historyDate}>{formatDate(h.date)}</Text>
                    </View>
                    <View style={styles.historyStats}>
                      <Text style={styles.historyStatText}>{t('common.sets_dot_reps', { sets: h.setsCompleted, reps: h.repsCompleted })}</Text>
                      <Text style={[styles.historyStatus, { color: h.status === 'success' ? '#2ed573' : '#ff6b6b' }]}>
                        {h.status === 'success' ? t('modal.done') : t('modal.stopped')}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#1e1e22', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  handle: { width: 40, height: 4, backgroundColor: '#3d3d3d', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  planName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  weekLabel: { color: '#4ecdc4', fontSize: 13, marginTop: 4, fontWeight: '600' },
  closeBtn: { width: 30, height: 30, backgroundColor: '#2d2d2d', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#aaa', fontSize: 14 },
  sectionTitle: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  workoutCard: { backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16, marginBottom: 12 },
  workoutTop: { marginBottom: 12 },
  workoutName: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  workoutDesc: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  statItem: { backgroundColor: '#1e1e22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 52 },
  statValue: { color: '#4ecdc4', fontSize: 15, fontWeight: '700' },
  statLabel: { color: '#666', fontSize: 11, marginTop: 2 },
  coachTip: { color: '#aaa', fontSize: 12, fontStyle: 'italic', lineHeight: 17, marginBottom: 12 },
  startBtn: { backgroundColor: '#4ecdc4', borderRadius: 10, padding: 12, alignItems: 'center' },
  startBtnText: { color: '#1a1a1a', fontSize: 15, fontWeight: '700' },
  historyRow: { backgroundColor: '#2d2d2d', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3 },
  historyName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  historyDate: { color: '#888', fontSize: 12, marginTop: 2 },
  historyStats: { alignItems: 'flex-end' },
  historyStatText: { color: '#ccc', fontSize: 12 },
  historyStatus: { fontSize: 12, fontWeight: '700', marginTop: 2 },
});
