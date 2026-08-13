import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { TrainingPlan, PlanSession } from '../types/models';
import { fetchPlanById } from '../utils/api';
import { LEVEL_COLORS, TYPE_EMOJIS, localizedPlan, localizedWorkout, getLevelLabel } from '../data/constants';
import { DAY_KEYS } from '../utils/i18n';
import { requestNotificationPermissions, scheduleTrainingNotifications, cancelNotifications } from '../utils/notifications';
import { requestCalendarPermissions, addPlanToCalendar, removePlanFromCalendar } from '../utils/calendar';
import { globalStyles } from '../styles/globalStyles';
import Footer from '../components/Footer';
import MenuButton from '../components/MenuButton';
import { syncNow } from '../utils/sync';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'>;

// Calendar events need a fixed time-of-day to anchor to; notifications
// themselves now always fire at 10:00 AM and 4:30 PM (see utils/notifications.ts).
const CALENDAR_EVENT_TIME = '10:00';

const getNextMonday = (): Date => {
  const d = new Date();
  const day = d.getDay();
  const daysUntil = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  d.setHours(0, 0, 0, 0);
  return d;
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function PlanDetailScreen({ route, navigation }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { planId } = route.params;
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [planError, setPlanError] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const [configuring, setConfiguring] = useState(false);
  const [startChoice, setStartChoice] = useState<'today' | 'next-monday'>('today');
  const [wantNotif, setWantNotif] = useState(true);
  const [wantCalendar, setWantCalendar] = useState(true);

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [calendarEnabled, setCalendarEnabled] = useState(false);

  useEffect(() => { loadPlan(); }, [planId]);

  const loadPlan = async () => {
    setPlanError(false);
    try {
      const remotePlan = await fetchPlanById(planId);
      const raw = await AsyncStorage.getItem('plans');
      const plans: TrainingPlan[] = raw ? JSON.parse(raw) : [];
      const stored = plans.find(p => p.id === planId);
      const merged = stored ? { ...remotePlan, ...stored } : remotePlan;
      setPlan(merged);
      if (stored) {
        setIsActive(!!stored.isActive);
        setNotifEnabled(!!stored.notificationsEnabled);
        setCalendarEnabled(!!stored.calendarEnabled);
      }
    } catch {
      setPlan(null);
      setPlanError(true);
    }
  };

  const savePlanToStorage = async (updates: Partial<TrainingPlan>) => {
    const raw = await AsyncStorage.getItem('plans');
    const plans: TrainingPlan[] = raw ? JSON.parse(raw) : [];
    const idx = plans.findIndex(p => p.id === planId);
    const updated = { ...plan!, ...updates };
    if (idx >= 0) plans[idx] = updated; else plans.push(updated);
    await AsyncStorage.setItem('plans', JSON.stringify(plans));
    syncNow();
    return updated;
  };

  const deactivateAllOthers = async () => {
    const raw = await AsyncStorage.getItem('plans');
    const plans: TrainingPlan[] = raw ? JSON.parse(raw) : [];
    for (const p of plans) {
      if (p.isActive && p.id !== planId) {
        if (p.notificationIds?.length) await cancelNotifications(p.notificationIds);
        if (p.calendarEventIds?.length) await removePlanFromCalendar(p.calendarEventIds);
      }
    }
    await AsyncStorage.setItem('plans', JSON.stringify(plans.map(p => ({ ...p, isActive: false }))));
    syncNow();
  };

  const confirmActivate = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      await deactivateAllOthers();
      const startDate = startChoice === 'today' ? new Date().toISOString() : getNextMonday().toISOString();

      let notifIds: string[] = [];
      if (wantNotif) {
        const granted = await requestNotificationPermissions();
        if (granted) notifIds = await scheduleTrainingNotifications(plan);
        else Alert.alert(t('plans.notif_blocked'), t('plans.notif_blocked_msg'));
      }

      let calEventIds: string[] = [];
      if (wantCalendar) {
        const granted = await requestCalendarPermissions();
        if (granted) calEventIds = await addPlanToCalendar(plan, startDate, CALENDAR_EVENT_TIME);
        else Alert.alert(t('plans.cal_blocked'), t('plans.cal_blocked_msg'));
      }

      const saved = await savePlanToStorage({
        isActive: true, activatedAt: new Date().toISOString(), startDate,
        notificationsEnabled: notifIds.length > 0, notificationIds: notifIds,
        calendarEnabled: calEventIds.length > 0, calendarEventIds: calEventIds,
      });

      setPlan(saved); setIsActive(true);
      setNotifEnabled(notifIds.length > 0);
      setCalendarEnabled(calEventIds.length > 0); setConfiguring(false);

      const startLabel = startChoice === 'today' ? t('plans.start_today').toLowerCase() : `${t('plans.start_monday')} ${shortDate(getNextMonday().toISOString())}`;
      const lines = [t('plans.activated_body', { name: plan.name, date: startLabel })];
      if (notifIds.length) lines.push(t('plans.activated_notif'));
      if (calEventIds.length) lines.push(t('plans.activated_cal', { count: calEventIds.length }));
      Alert.alert(t('plans.activated_title'), lines.join('\n'), [{ text: t('plans.lets_climb') }]);
    } catch { Alert.alert(t('plans.error_title'), t('plans.error_msg')); }
    setLoading(false);
  };

  const handleDeactivate = () => {
    Alert.alert(t('plans.deactivate_title'), t('plans.deactivate_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('plans.deactivate_btn'),
        style: 'destructive',
        onPress: async () => {
          if (plan?.notificationIds?.length) await cancelNotifications(plan.notificationIds);
          if (plan?.calendarEventIds?.length) await removePlanFromCalendar(plan.calendarEventIds);
          await savePlanToStorage({ isActive: false, notificationsEnabled: false, notificationIds: [], calendarEnabled: false, calendarEventIds: [] });
          setIsActive(false); setNotifEnabled(false); setCalendarEnabled(false); setConfiguring(false);
        },
      },
    ]);
  };

  const handleNotifToggle = async (value: boolean) => {
    if (!plan) return;
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) { Alert.alert(t('plans.notif_blocked'), t('plans.notif_blocked_msg')); return; }
      if (plan.notificationIds?.length) await cancelNotifications(plan.notificationIds);
      const ids = await scheduleTrainingNotifications(plan);
      await savePlanToStorage({ notificationsEnabled: true, notificationIds: ids });
      setNotifEnabled(true);
    } else {
      if (plan.notificationIds?.length) await cancelNotifications(plan.notificationIds);
      await savePlanToStorage({ notificationsEnabled: false, notificationIds: [] });
      setNotifEnabled(false);
    }
  };

  const handleCalendarToggle = async (value: boolean) => {
    if (!plan) return;
    if (value) {
      const granted = await requestCalendarPermissions();
      if (!granted) { Alert.alert(t('plans.cal_blocked'), t('plans.cal_blocked_msg')); return; }
      const startDate = plan.startDate || new Date().toISOString();
      const ids = await addPlanToCalendar(plan, startDate, CALENDAR_EVENT_TIME);
      if (ids.length === 0) { Alert.alert(t('plans.cal_error'), t('plans.cal_error_msg')); return; }
      await savePlanToStorage({ calendarEnabled: true, calendarEventIds: ids });
      setCalendarEnabled(true);
      Alert.alert(t('plans.cal_added'), t('plans.cal_added_msg', { count: ids.length }));
    } else {
      if (plan.calendarEventIds?.length) await removePlanFromCalendar(plan.calendarEventIds);
      await savePlanToStorage({ calendarEnabled: false, calendarEventIds: [] });
      setCalendarEnabled(false);
    }
  };

  const getHangLabel = (type: string) => {
    if (type === 'campus') return t('timer.move');
    if (type === 'flexibility') return t('timer.stretch');
    if (type === 'endurance') return t('timer.traverse');
    return t('timer.hang');
  };

  if (!plan) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.header}>
          <MenuButton align="left" />
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={globalStyles.backText}>{t('common.back')}</Text></TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          {planError ? (
            <>
              <Text style={{ fontSize: 48, marginBottom: 14 }}>📡</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>{t('plans.error_load_title')}</Text>
              <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 18 }}>{t('plans.error_load_text')}</Text>
              <TouchableOpacity style={{ backgroundColor: '#4ecdc4', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 }} onPress={loadPlan}>
                <Text style={{ color: '#1a1a1a', fontSize: 14, fontWeight: '700' }}>{t('custom.retry')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ color: '#aaa' }}>{t('common.loading')}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const levelColor = LEVEL_COLORS[plan.level] || '#4ecdc4';
  const lp = localizedPlan(plan, lang);

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <MenuButton align="left" />
        <View style={{ flex: 1, alignItems: 'center' }}>
          {isActive && <View style={styles.activePill}><Text style={styles.activePillText}>{t('plans.active_badge')}</Text></View>}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={globalStyles.backText}>{t('common.back')}</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.planHeader}>
          <Text style={styles.planEmoji}>{plan.emoji}</Text>
          <Text style={styles.planName}>{lp.name}</Text>
          <View style={[styles.levelBadge, { backgroundColor: levelColor + '22', borderColor: levelColor }]}>
            <Text style={[styles.levelText, { color: levelColor }]}>{getLevelLabel(plan.level, lang)}</Text>
          </View>
          <Text style={styles.planTagline}>{lp.tagline}</Text>
        </View>

        <Text style={styles.description}>{lp.description}</Text>

        <View style={styles.coachNote}>
          <Text style={styles.coachNoteIcon}>🧗</Text>
          <Text style={styles.coachNoteText}>{lp.coachNote}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaVal}>{t('plans.days_week', { n: plan.daysPerWeek })}</Text>
            <Text style={styles.metaLbl}>{t('plans.frequency')}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaVal}>{plan.weeks > 0 ? t('plans.weeks_label', { n: plan.weeks }) : t('plans.ongoing')}</Text>
            <Text style={styles.metaLbl}>{t('plans.duration')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('plans.weekly_schedule')}</Text>
        {plan.sessions.map((session: PlanSession) => (
          <View key={session.dayIndex} style={styles.sessionBlock}>
            <Text style={styles.sessionDay}>{t(DAY_KEYS[session.dayIndex])}</Text>
            {session.workouts.map(workout => {
              const lw = localizedWorkout(workout, lang);
              return (
              <View key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutTypeEmoji}>{TYPE_EMOJIS[workout.type]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workoutName}>{lw.name}</Text>
                    <Text style={styles.workoutTypeBadge}>{t(`types.${workout.type}` as any)}</Text>
                  </View>
                </View>
                <Text style={styles.workoutParams}>
                  {getHangLabel(workout.type)} {workout.hangTime}s · {t('timer.rest')} {workout.restTime}s · {t('common.reps_x_sets', { reps: workout.reps, sets: workout.sets })}
                </Text>
                {lw.description !== '' && <Text style={styles.workoutDesc}>{lw.description}</Text>}
                {lw.coachTip !== '' && (
                  <View style={styles.coachTipBlock}>
                    <Text style={styles.coachTipIcon}>💬</Text>
                    <Text style={styles.coachTipText}>{lw.coachTip}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('Timer', { workout })}>
                  <Text style={styles.startButtonText}>{t('plans.start_workout')}</Text>
                </TouchableOpacity>
              </View>
              );
            })}
          </View>
        ))}

        {!isActive && !configuring && (
          <TouchableOpacity style={styles.activateButton} onPress={() => setConfiguring(true)}>
            <Text style={styles.activateButtonText}>{t('plans.activate_btn')}</Text>
          </TouchableOpacity>
        )}

        {!isActive && configuring && (
          <View style={styles.wizard}>
            <Text style={styles.wizardTitle}>{t('plans.setup_title')}</Text>

            <Text style={styles.wizardLabel}>{t('plans.start_when')}</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity style={[styles.choice, startChoice === 'today' && styles.choiceActive]} onPress={() => setStartChoice('today')}>
                <Text style={styles.choiceEmoji}>📅</Text>
                <Text style={[styles.choiceText, startChoice === 'today' && styles.choiceTextActive]}>{t('plans.start_today')}</Text>
                <Text style={styles.choiceSub}>{t('plans.start_today_sub')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.choice, startChoice === 'next-monday' && styles.choiceActive]} onPress={() => setStartChoice('next-monday')}>
                <Text style={styles.choiceEmoji}>🗓️</Text>
                <Text style={[styles.choiceText, startChoice === 'next-monday' && styles.choiceTextActive]}>{t('plans.start_monday')}</Text>
                <Text style={styles.choiceSub}>{shortDate(getNextMonday().toISOString())}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.wizardLabel}>{t('plans.want_notif')}</Text>
            <View style={styles.notifToggleRow}>
              <Text style={styles.notifToggleText}>{wantNotif ? t('plans.notif_on') : t('plans.notif_off')}</Text>
              <Switch value={wantNotif} onValueChange={setWantNotif} trackColor={{ false: '#3d3d3d', true: '#4ecdc4' }} thumbColor="#fff" />
            </View>

            <Text style={styles.wizardLabel}>{t('plans.want_calendar')}</Text>
            <View style={styles.notifToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifToggleText}>{wantCalendar ? t('plans.calendar_on') : t('plans.calendar_off')}</Text>
                {wantCalendar && <Text style={styles.calHint}>{t('plans.calendar_hint')}</Text>}
              </View>
              <Switch value={wantCalendar} onValueChange={setWantCalendar} trackColor={{ false: '#3d3d3d', true: '#4ecdc4' }} thumbColor="#fff" />
            </View>

            <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.5 }]} onPress={confirmActivate} disabled={loading}>
              <Text style={styles.confirmBtnText}>{loading ? t('plans.activating') : t('plans.confirm_btn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfiguring(false)}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isActive && (
          <>
            {plan.startDate && (
              <View style={styles.startDateBadge}>
                <Text style={styles.startDateText}>
                  {t('plans.started', { date: shortDate(plan.startDate) })}
                  {plan.weeks > 0
                    ? `  ·  ${t('plans.week_of', { current: Math.min(Math.floor((Date.now() - new Date(plan.startDate).getTime()) / 604800000) + 1, plan.weeks), total: plan.weeks })}`
                    : ''}
                </Text>
              </View>
            )}

            <View style={styles.notifSection}>
              <Text style={styles.notifTitle}>{t('plans.notif_section')}</Text>
              <View style={styles.notifRow}>
                <Text style={styles.notifLabel}>{t('plans.enable_notif')}</Text>
                <Switch value={notifEnabled} onValueChange={handleNotifToggle} trackColor={{ false: '#3d3d3d', true: '#4ecdc4' }} thumbColor="#fff" />
              </View>
              {notifEnabled && <Text style={styles.calHint}>{t('plans.notif_fixed_times')}</Text>}
            </View>

            <View style={styles.notifSection}>
              <Text style={styles.notifTitle}>{t('plans.calendar_section')}</Text>
              <View style={styles.notifRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifLabel}>{calendarEnabled ? t('plans.calendar_enabled_label') : t('plans.calendar_add_label')}</Text>
                  {!calendarEnabled && <Text style={styles.calHint}>{t('plans.calendar_hint')}</Text>}
                </View>
                <Switch value={calendarEnabled} onValueChange={handleCalendarToggle} trackColor={{ false: '#3d3d3d', true: '#4ecdc4' }} thumbColor="#fff" />
              </View>
            </View>

            <TouchableOpacity style={styles.deactivateButton} onPress={handleDeactivate}>
              <Text style={styles.deactivateButtonText}>{t('plans.deactivate_btn')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 30 },
  activePill: { backgroundColor: '#4ecdc4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 'auto' },
  activePillText: { color: '#1a1a1a', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  planHeader: { alignItems: 'center', marginBottom: 20 },
  planEmoji: { fontSize: 56, marginBottom: 10 },
  planName: { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  levelBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  levelText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  planTagline: { color: '#aaa', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  description: { color: '#ccc', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  coachNote: { backgroundColor: '#1e2535', borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#4ecdc4', flexDirection: 'row', alignItems: 'flex-start' },
  coachNoteIcon: { fontSize: 20, marginRight: 10, marginTop: 2 },
  coachNoteText: { color: '#ccc', fontSize: 13, lineHeight: 20, flex: 1, fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metaItem: { flex: 1, backgroundColor: '#2d2d2d', borderRadius: 12, padding: 14, alignItems: 'center' },
  metaVal: { color: '#4ecdc4', fontSize: 18, fontWeight: '700' },
  metaLbl: { color: '#888', fontSize: 12, marginTop: 2 },
  sectionTitle: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },
  sessionBlock: { marginBottom: 20 },
  sessionDay: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 10 },
  workoutCard: { backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16, marginBottom: 10 },
  workoutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  workoutTypeEmoji: { fontSize: 24, marginRight: 10 },
  workoutName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  workoutTypeBadge: { color: '#888', fontSize: 12, marginTop: 2 },
  workoutParams: { color: '#4ecdc4', fontSize: 13, marginBottom: 8, fontWeight: '600' },
  workoutDesc: { color: '#aaa', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  coachTipBlock: { flexDirection: 'row', backgroundColor: '#1e2535', borderRadius: 8, padding: 10, marginBottom: 12, alignItems: 'flex-start' },
  coachTipIcon: { fontSize: 14, marginRight: 8 },
  coachTipText: { color: '#aaa', fontSize: 12, lineHeight: 17, flex: 1, fontStyle: 'italic' },
  startButton: { backgroundColor: '#4ecdc4', borderRadius: 10, padding: 12, alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  activateButton: { backgroundColor: '#2ed573', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  activateButtonText: { color: '#1a1a1a', fontSize: 18, fontWeight: '800' },
  wizard: { backgroundColor: '#2d2d2d', borderRadius: 16, padding: 20, marginTop: 10, marginBottom: 10 },
  wizardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 18, textAlign: 'center' },
  wizardLabel: { color: '#aaa', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginTop: 6 },
  choiceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  choice: { flex: 1, backgroundColor: '#1e1e22', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  choiceActive: { borderColor: '#4ecdc4', backgroundColor: '#1e3040' },
  choiceEmoji: { fontSize: 26, marginBottom: 6 },
  choiceText: { color: '#aaa', fontSize: 14, fontWeight: '700' },
  choiceTextActive: { color: '#4ecdc4' },
  choiceSub: { color: '#666', fontSize: 11, marginTop: 3 },
  notifToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e22', borderRadius: 10, padding: 14, marginBottom: 8, gap: 10 },
  notifToggleText: { color: '#ccc', fontSize: 14 },
  calHint: { color: '#666', fontSize: 11, marginTop: 3 },
  confirmBtn: { backgroundColor: '#4ecdc4', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#1a1a1a', fontSize: 16, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: '#666', fontSize: 14 },
  startDateBadge: { backgroundColor: '#1e2535', borderRadius: 10, padding: 12, marginBottom: 14, alignItems: 'center' },
  startDateText: { color: '#4ecdc4', fontSize: 13, fontWeight: '600' },
  notifSection: { backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16, marginBottom: 14 },
  notifTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  notifLabel: { color: '#ccc', fontSize: 14 },
  deactivateButton: { backgroundColor: '#2d2d2d', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ff6b6b' },
  deactivateButtonText: { color: '#ff6b6b', fontSize: 15, fontWeight: '600' },
});
