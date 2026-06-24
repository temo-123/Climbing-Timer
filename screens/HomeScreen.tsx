import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';
import TodayModal from '../components/TodayModal';
import ShopBanner from '../components/ShopBanner';
import { RootStackParamList } from '../types/navigation';
import { TrainingPlan, HistoryEntry, PlanSession } from '../types/models';
import { PRESET_PLANS, localizedPlan } from '../data/presetPlans';
import { DAY_KEYS } from '../utils/i18n';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const getTodayDayIndex = (): number => {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

const calcStreak = (history: HistoryEntry[]): number => {
  const successDates = new Set(
    history.filter(h => h.status === 'success').map(h => h.date.split('T')[0])
  );
  let s = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (successDates.has(key)) s++;
    else if (i > 0) break;
  }
  return s;
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigation = useNavigation<NavigationProp>();
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [todaySession, setTodaySession] = useState<PlanSession | null>(null);
  const [streak, setStreak] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(useCallback(() => { loadState(); }, []));

  const loadState = async () => {
    try {
      const [plansRaw, historyRaw] = await Promise.all([
        AsyncStorage.getItem('plans'),
        AsyncStorage.getItem('history'),
      ]);
      const plans: TrainingPlan[] = plansRaw ? JSON.parse(plansRaw) : [];
      const found = plans.find(p => p.isActive);
      if (found) {
        const preset = found.isPreset ? PRESET_PLANS.find(p => p.id === found.id) : null;
        const merged = preset ? { ...preset, ...found } : found;
        setActivePlan(merged);
        setTodaySession(merged.sessions.find(s => s.dayIndex === getTodayDayIndex()) || null);
      } else {
        setActivePlan(null);
        setTodaySession(null);
      }
      const history: HistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
      setStreak(calcStreak(history));
    } catch { /* ignore */ }
  };

  const getGreeting = (): string => {
    const h = new Date().getHours();
    if (h < 12) return t('home.greeting_morning');
    if (h < 18) return t('home.greeting_afternoon');
    return t('home.greeting_evening');
  };

  const nextSessionLabel = (): string => {
    if (!activePlan) return '';
    const todayIdx = getTodayDayIndex();
    const upcoming = activePlan.sessions
      .filter(s => s.dayIndex > todayIdx)
      .sort((a, b) => a.dayIndex - b.dayIndex);
    const session = upcoming[0] || activePlan.sessions[0];
    return session ? t(DAY_KEYS[session.dayIndex]) : '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.appTitle}>{t('home.app_title')}</Text>
            </View>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLbl}>{t('home.day_streak')}</Text>
            </View>
          )}
        </View>

        {/* Today's training card */}
        {todaySession && activePlan ? (
          <TouchableOpacity style={styles.todayCard} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
            <View style={styles.todayTopRow}>
              <View>
                <Text style={styles.todayBadge}>{t('home.today_badge')}</Text>
                <Text style={styles.todayPlanName}>{activePlan.emoji} {localizedPlan(activePlan, lang).name}</Text>
              </View>
              <Text style={styles.todayArrow}>›</Text>
            </View>
            <View style={styles.todayDivider} />
            {todaySession.workouts.map(w => (
              <TouchableOpacity key={w.id} style={styles.workoutRow} onPress={() => navigation.navigate('Timer', { workout: w })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutRowName}>{w.name}</Text>
                  <Text style={styles.workoutRowMeta}>{t('common.meta_compact', { hang: w.hangTime, reps: w.reps, sets: w.sets })}</Text>
                </View>
                <View style={styles.playBtn}><Text style={styles.playBtnText}>▶</Text></View>
              </TouchableOpacity>
            ))}
            <Text style={styles.tapHint}>{t('home.tap_hint')}</Text>
          </TouchableOpacity>

        ) : activePlan ? (
          <View style={styles.restCard}>
            <Text style={styles.restEmoji}>😌</Text>
            <Text style={styles.restTitle}>{t('home.rest_day')}</Text>
            <Text style={styles.restPlan}>{activePlan.emoji} {localizedPlan(activePlan, lang).name}</Text>
            {nextSessionLabel() !== '' && (
              <Text style={styles.restNext}>{t('home.rest_day_next', { day: nextSessionLabel() })}</Text>
            )}
          </View>

        ) : (
          <TouchableOpacity style={styles.noPlanCard} onPress={() => navigation.navigate('TrainingPlans')}>
            <Text style={styles.noPlanEmoji}>🎯</Text>
            <Text style={styles.noPlanTitle}>{t('home.no_plan_title')}</Text>
            <Text style={styles.noPlanSub}>{t('home.no_plan_sub')}</Text>
            <View style={styles.noPlanCta}><Text style={styles.noPlanCtaText}>{t('home.no_plan_cta')}</Text></View>
          </TouchableOpacity>
        )}

        {/* AI Coach feature card */}
        <TouchableOpacity style={styles.aiCard} onPress={() => navigation.navigate('AITraining')} activeOpacity={0.85}>
          <View style={styles.aiCardLeft}>
            <Text style={styles.aiCardBadge}>{t('home.ai_powered')}</Text>
            <Text style={styles.aiCardTitle}>{t('home.ai_training')}</Text>
            <Text style={styles.aiCardSub}>{t('home.ai_training_sub')}</Text>
          </View>
          <Text style={styles.aiCardEmoji}>🤖</Text>
        </TouchableOpacity>

        {/* Primary grid */}
        <Text style={styles.sectionLabel}>{t('home.quick_access')}</Text>
        <View style={styles.grid}>
          <GridCard emoji="⚡" label={t('home.quick_exercise')} sub={t('home.quick_exercise_sub')} onPress={() => navigation.navigate('CustomTraining')} />
          <GridCard emoji="📋" label={t('home.training_plans')} sub={t('home.training_plans_sub')} onPress={() => navigation.navigate('TrainingPlans')} />
          <GridCard emoji="📊" label={t('home.my_progress')} sub={t('home.my_progress_sub')} onPress={() => navigation.navigate('Analytics')} />
          <GridCard emoji="📅" label={t('home.history')} sub={t('home.history_sub')} onPress={() => navigation.navigate('History')} />
        </View>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('LoadWorkouts')}>
            <Text style={styles.secondaryEmoji}>🏋️</Text>
            <Text style={styles.secondaryLabel}>{t('home.my_workouts')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('CreateWorkout')}>
            <Text style={styles.secondaryEmoji}>✏️</Text>
            <Text style={styles.secondaryLabel}>{t('home.create_workout')}</Text>
          </TouchableOpacity>
        </View>

        {/* climbing.ge shop banner */}
        <ShopBanner />
      </ScrollView>

      {modalVisible && activePlan && todaySession && (
        <TodayModal visible={modalVisible} onClose={() => setModalVisible(false)} plan={activePlan} session={todaySession} />
      )}
      <Footer />
    </SafeAreaView>
  );
}

function GridCard({ emoji, label, sub, onPress }: { emoji: string; label: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.gridEmoji}>{emoji}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
      <Text style={styles.gridSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  scroll: { padding: 20, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44 },
  greeting: { color: '#888', fontSize: 13, marginBottom: 2 },
  appTitle: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  streakBadge: { backgroundColor: '#2d2d2d', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  streakFire: { fontSize: 22 },
  streakNum: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 28 },
  streakLbl: { color: '#888', fontSize: 11, marginTop: 1 },
  todayCard: { backgroundColor: '#162535', borderRadius: 18, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#4ecdc4' },
  todayTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  todayBadge: { color: '#4ecdc4', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  todayPlanName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  todayArrow: { color: '#4ecdc4', fontSize: 28, marginTop: -2 },
  todayDivider: { height: 1, backgroundColor: '#1e3a52', marginBottom: 12 },
  workoutRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1e2d', borderRadius: 10, padding: 12, marginBottom: 8 },
  workoutRowName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  workoutRowMeta: { color: '#6a9ab0', fontSize: 12, marginTop: 2 },
  playBtn: { width: 36, height: 36, backgroundColor: '#4ecdc4', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  playBtnText: { color: '#1a1a1a', fontSize: 14, fontWeight: '800' },
  tapHint: { color: '#4a6a7a', fontSize: 11, textAlign: 'center', marginTop: 6 },
  restCard: { backgroundColor: '#2d2d2d', borderRadius: 18, padding: 20, marginBottom: 24, alignItems: 'center' },
  restEmoji: { fontSize: 36, marginBottom: 8 },
  restTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  restPlan: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  restNext: { color: '#4ecdc4', fontSize: 13, fontWeight: '600' },
  noPlanCard: { backgroundColor: '#1a2520', borderRadius: 18, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: '#2ed57366', alignItems: 'center' },
  noPlanEmoji: { fontSize: 40, marginBottom: 10 },
  noPlanTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  noPlanSub: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  noPlanCta: { backgroundColor: '#2ed573', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  noPlanCtaText: { color: '#1a1a1a', fontSize: 15, fontWeight: '800' },
  sectionLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  aiCard: {
    backgroundColor: '#162535', borderRadius: 16, padding: 18, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#4ecdc444',
  },
  aiCardLeft: { flex: 1 },
  aiCardBadge: { color: '#4ecdc4', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  aiCardTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 3 },
  aiCardSub: { color: '#6a9ab0', fontSize: 12 },
  aiCardEmoji: { fontSize: 40, marginLeft: 10 },
  gridCard: { backgroundColor: '#2d2d2d', borderRadius: 16, padding: 18, width: '47%', minHeight: 110, justifyContent: 'space-between' },
  gridEmoji: { fontSize: 30, marginBottom: 8 },
  gridLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  gridSub: { color: '#888', fontSize: 12, marginTop: 3 },
  secondaryRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  secondaryBtn: { flex: 1, backgroundColor: '#2d2d2d', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  secondaryEmoji: { fontSize: 22 },
  secondaryLabel: { color: '#ccc', fontSize: 14, fontWeight: '600' },
});
