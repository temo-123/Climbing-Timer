import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TextInput, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { UserProfile, TrainingPlan, Equipment } from '../types/models';
import { generateAIPlan } from '../utils/aiTraining';
import { globalStyles } from '../styles/globalStyles';
import Footer from '../components/Footer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AITraining'>;

const EQUIP_EMOJI: Record<string, string> = {
  fingerboard: '🏋️',
  campus_board: '🔢',
  climbing_wall: '🧗',
  system_wall: '🔶',
  pull_up_bar: '💪',
  weights: '⚖️',
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#2ed573',
  intermediate: '#ffa502',
  expert: '#ff6b6b',
  maintenance: '#4ecdc4',
};

const LOADING_TIP_KEYS = [
  'ai.tip_1', 'ai.tip_2', 'ai.tip_3', 'ai.tip_4',
  'ai.tip_5', 'ai.tip_6', 'ai.tip_7',
];

export default function AITrainingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<TrainingPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [editingKey, setEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const tipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(useCallback(() => {
    loadProfile();
    return () => { if (tipIntervalRef.current) clearInterval(tipIntervalRef.current); };
  }, []));

  const loadProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem('userProfile');
      if (raw) setProfile(JSON.parse(raw));
    } catch { /* ignore */ }
  };

  const startLoadingTips = () => {
    let i = 0;
    tipIntervalRef.current = setInterval(() => {
      i = (i + 1) % LOADING_TIP_KEYS.length;
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setTipIndex(i);
    }, 2500);
  };

  const stopLoadingTips = () => {
    if (tipIntervalRef.current) { clearInterval(tipIntervalRef.current); tipIntervalRef.current = null; }
  };

  const generate = async () => {
    if (!profile) return;
    if (!profile.anthropicApiKey) { setEditingKey(true); return; }
    setGenerating(true);
    setGeneratedPlan(null);
    setTipIndex(0);
    startLoadingTips();
    try {
      const plan = await generateAIPlan(profile);
      setGeneratedPlan(plan);
    } catch (e: any) {
      Alert.alert(t('ai.gen_failed'), e?.message || t('ai.gen_failed_msg'));
    } finally {
      stopLoadingTips();
      setGenerating(false);
    }
  };

  const saveApiKey = async () => {
    if (!tempKey.trim()) { Alert.alert(t('ai.key_invalid_title'), t('ai.key_invalid_msg')); return; }
    const updated: UserProfile = { ...profile!, anthropicApiKey: tempKey.trim() };
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
      setProfile(updated);
      setEditingKey(false);
      setTempKey('');
    } catch {
      Alert.alert(t('ai.key_error_title'), t('ai.key_error_msg'));
    }
  };

  const activatePlan = async () => {
    if (!generatedPlan) return;
    try {
      const raw = await AsyncStorage.getItem('plans');
      const plans: TrainingPlan[] = raw ? JSON.parse(raw) : [];
      const deactivated = plans.map(p => ({ ...p, isActive: false }));
      const newPlan: TrainingPlan = { ...generatedPlan, isActive: true, activatedAt: new Date().toISOString() };
      const updated = [...deactivated.filter(p => p.id !== newPlan.id), newPlan];
      await AsyncStorage.setItem('plans', JSON.stringify(updated));
      Alert.alert(t('ai.activated_title'), `"${newPlan.name}" ${t('ai.activated_msg')}`, [
        { text: t('ai.view_plan_btn'), onPress: () => navigation.navigate('PlanDetail', { planId: newPlan.id }) },
        { text: t('ai.go_home_btn'), onPress: () => navigation.navigate('Home') },
      ]);
    } catch {
      Alert.alert(t('common.error'), t('ai.activate_error'));
    }
  };

  const savePlanOnly = async () => {
    if (!generatedPlan) return;
    try {
      const raw = await AsyncStorage.getItem('plans');
      const plans: TrainingPlan[] = raw ? JSON.parse(raw) : [];
      const updated = [...plans.filter(p => p.id !== generatedPlan.id), generatedPlan];
      await AsyncStorage.setItem('plans', JSON.stringify(updated));
      Alert.alert(t('ai.saved_title'), `"${generatedPlan.name}" ${t('ai.saved_msg')}`, [
        { text: t('ai.view_plans_btn'), onPress: () => navigation.navigate('TrainingPlans') },
        { text: t('common.ok') },
      ]);
    } catch {
      Alert.alert(t('common.error'), t('ai.save_error'));
    }
  };

  const getExperienceLabel = (years: number) => {
    if (years < 1) return t('ai.profile_under_1yr');
    return `${years} ${t('ai.profile_years')}`;
  };

  const getEquipLabel = (e: Equipment): string => {
    const emoji = EQUIP_EMOJI[e] || '🏋️';
    const key = `onboarding.equip_${e}` as any;
    return `${emoji} ${t(key) || e}`;
  };

  if (!profile) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={globalStyles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyTitle}>{t('ai.no_profile_title')}</Text>
          <Text style={styles.emptySub}>{t('ai.no_profile_sub')}</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Onboarding')}>
            <Text style={styles.ctaBtnText}>{t('ai.no_profile_cta')}</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ai.title')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Onboarding')} style={styles.editBtn}>
          <Text style={styles.editBtnText}>{t('ai.edit_profile')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <Text style={styles.profileAvatar}>
              {profile.sex === 'male' ? '♂' : profile.sex === 'female' ? '♀' : '⚧'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileStats}>
                {t('ai.profile_stats', { age: profile.age, weight: profile.weight, height: profile.height })}
              </Text>
              <Text style={styles.profileExp}>
                {getExperienceLabel(profile.experienceYears)}
                {profile.climbingGrade ? `  ·  ${profile.climbingGrade}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.equipRow}>
            {profile.equipment.map((e: Equipment) => (
              <View key={e} style={styles.equipTag}>
                <Text style={styles.equipTagText}>{getEquipLabel(e)}</Text>
              </View>
            ))}
          </View>
          {profile.wallDegree != null && (
            <Text style={styles.wallInfo}>{t('ai.wall_angle_label')} {profile.wallDegree}°</Text>
          )}
        </View>

        {/* API key section */}
        {!profile.anthropicApiKey && !editingKey && (
          <View style={styles.noKeyCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noKeyTitle}>{t('ai.no_key_title')}</Text>
              <Text style={styles.noKeyText}>{t('ai.no_key_sub')}</Text>
            </View>
            <TouchableOpacity onPress={() => { setEditingKey(true); setTempKey(''); }}>
              <Text style={styles.addKeyBtn}>{t('ai.no_key_add')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {editingKey && (
          <View style={styles.keyInputCard}>
            <Text style={styles.keyInputLabel}>{t('ai.key_label')}</Text>
            <TextInput
              style={styles.keyInput}
              value={tempKey}
              onChangeText={setTempKey}
              placeholder={t('ai.key_placeholder')}
              placeholderTextColor="#555"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <Text style={styles.keyHint}>{t('ai.key_hint')}</Text>
            <View style={styles.keyBtns}>
              <TouchableOpacity style={styles.keyCancelBtn} onPress={() => setEditingKey(false)}>
                <Text style={styles.keyCancelText}>{t('ai.key_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keySaveBtn} onPress={saveApiKey}>
                <Text style={styles.keySaveText}>{t('ai.key_save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {profile.anthropicApiKey && !editingKey && (
          <TouchableOpacity
            style={styles.changeKeyBtn}
            onPress={() => { setEditingKey(true); setTempKey(profile.anthropicApiKey || ''); }}
          >
            <Text style={styles.changeKeyText}>{t('ai.key_set')}</Text>
          </TouchableOpacity>
        )}

        {/* Generate button */}
        {!generating && (
          <TouchableOpacity
            style={[styles.generateBtn, !profile.anthropicApiKey && styles.generateBtnGhost]}
            onPress={generate}
            activeOpacity={0.85}
          >
            <Text style={[styles.generateBtnText, !profile.anthropicApiKey && styles.generateBtnTextGhost]}>
              {generatedPlan ? t('ai.regenerate_btn') : t('ai.generate_btn')}
            </Text>
            <Text style={[styles.generateBtnSub, !profile.anthropicApiKey && styles.generateBtnSubGhost]}>
              {t('ai.powered_by')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Loading */}
        {generating && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#4ecdc4" style={{ marginBottom: 20 }} />
            <Animated.Text style={[styles.loadingTip, { opacity: fadeAnim }]}>
              {t(LOADING_TIP_KEYS[tipIndex])}
            </Animated.Text>
            <Text style={styles.loadingNote}>{t('ai.loading_note')}</Text>
          </View>
        )}

        {/* Generated plan preview */}
        {generatedPlan && !generating && (
          <View style={styles.planCard}>
            <View style={styles.planHeaderRow}>
              <Text style={styles.planEmoji}>{generatedPlan.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{generatedPlan.name}</Text>
                {generatedPlan.level && (
                  <View style={[
                    styles.levelBadge,
                    {
                      backgroundColor: (LEVEL_COLORS[generatedPlan.level] || '#4ecdc4') + '22',
                      borderColor: LEVEL_COLORS[generatedPlan.level] || '#4ecdc4',
                    }
                  ]}>
                    <Text style={[styles.levelText, { color: LEVEL_COLORS[generatedPlan.level] || '#4ecdc4' }]}>
                      {generatedPlan.level.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.planTagline}>{generatedPlan.tagline}</Text>
            <Text style={styles.planDesc}>{generatedPlan.description}</Text>

            <View style={styles.planMetaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaVal}>{generatedPlan.daysPerWeek}×</Text>
                <Text style={styles.metaLbl}>{t('ai.per_week')}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaVal}>{generatedPlan.weeks}w</Text>
                <Text style={styles.metaLbl}>{t('ai.duration_weeks')}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaVal}>{generatedPlan.sessions?.length || 0}</Text>
                <Text style={styles.metaLbl}>{t('ai.sessions_count')}</Text>
              </View>
            </View>

            <Text style={styles.scheduleLabel}>{t('ai.schedule_title')}</Text>
            {generatedPlan.sessions?.map(s => (
              <View key={s.dayIndex} style={styles.sessionRow}>
                <View style={styles.sessionDayBadge}>
                  <Text style={styles.sessionDayText}>{s.dayLabel?.substring(0, 3)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {s.workouts?.map(w => (
                    <Text key={w.id} style={styles.sessionWorkout}>
                      · {w.name}
                      <Text style={styles.sessionType}> ({t(`types.${w.type}` as any) || w.type})</Text>
                    </Text>
                  ))}
                </View>
              </View>
            ))}

            {generatedPlan.coachNote && (
              <View style={styles.coachNoteCard}>
                <Text style={styles.coachNoteIcon}>💬</Text>
                <Text style={styles.coachNoteText}>{generatedPlan.coachNote}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.activateBtn} onPress={activatePlan}>
              <Text style={styles.activateBtnText}>{t('ai.activate_btn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveOnlyBtn} onPress={savePlanOnly}>
              <Text style={styles.saveOnlyText}>{t('ai.save_btn')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  editBtn: { padding: 4 },
  editBtnText: { color: '#4ecdc4', fontSize: 13, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 20 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptySub: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  ctaBtn: { backgroundColor: '#4ecdc4', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  ctaBtnText: { color: '#1a1a1a', fontSize: 16, fontWeight: '800' },

  profileCard: { backgroundColor: '#252525', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#333' },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  profileAvatar: { fontSize: 30, color: '#4ecdc4' },
  profileStats: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  profileExp: { color: '#888', fontSize: 13 },
  equipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  equipTag: { backgroundColor: '#1e3040', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#2a4a60' },
  equipTagText: { color: '#6ab0cc', fontSize: 12, fontWeight: '600' },
  wallInfo: { color: '#4ecdc4', fontSize: 13, fontWeight: '600' },

  noKeyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a1e1e', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ff6b6b33', gap: 12 },
  noKeyTitle: { color: '#ff6b6b', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  noKeyText: { color: '#aaa', fontSize: 12, lineHeight: 18 },
  addKeyBtn: { color: '#4ecdc4', fontSize: 14, fontWeight: '700' },

  keyInputCard: { backgroundColor: '#252525', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  keyInputLabel: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  keyInput: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 10, padding: 12,
    fontSize: 13, borderWidth: 1, borderColor: '#4ecdc4',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 6,
  },
  keyHint: { color: '#555', fontSize: 11, marginBottom: 14, lineHeight: 16 },
  keyBtns: { flexDirection: 'row', gap: 10 },
  keyCancelBtn: { flex: 1, padding: 12, backgroundColor: '#333', borderRadius: 10, alignItems: 'center' },
  keyCancelText: { color: '#888', fontWeight: '600', fontSize: 14 },
  keySaveBtn: { flex: 1, padding: 12, backgroundColor: '#4ecdc4', borderRadius: 10, alignItems: 'center' },
  keySaveText: { color: '#1a1a1a', fontWeight: '800', fontSize: 14 },

  changeKeyBtn: { backgroundColor: '#1a2a1a', borderRadius: 10, padding: 10, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a4a2a' },
  changeKeyText: { color: '#2ed573', fontSize: 13, fontWeight: '600' },

  generateBtn: { backgroundColor: '#4ecdc4', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 14 },
  generateBtnGhost: { backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333' },
  generateBtnText: { color: '#1a1a1a', fontSize: 17, fontWeight: '900', marginBottom: 2 },
  generateBtnTextGhost: { color: '#555' },
  generateBtnSub: { color: '#1a5a56', fontSize: 12, fontWeight: '600' },
  generateBtnSubGhost: { color: '#444' },

  loadingCard: { backgroundColor: '#162535', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#4ecdc433' },
  loadingTip: { color: '#4ecdc4', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  loadingNote: { color: '#555', fontSize: 12, textAlign: 'center' },

  planCard: { backgroundColor: '#252525', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#4ecdc4' },
  planHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  planEmoji: { fontSize: 38 },
  planName: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  levelBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  planTagline: { color: '#ccc', fontSize: 14, marginBottom: 8, fontStyle: 'italic' },
  planDesc: { color: '#999', fontSize: 13, lineHeight: 20, marginBottom: 14 },

  planMetaRow: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 16 },
  metaItem: { flex: 1, alignItems: 'center' },
  metaVal: { color: '#4ecdc4', fontSize: 20, fontWeight: '800' },
  metaLbl: { color: '#666', fontSize: 11, marginTop: 2 },
  metaDivider: { width: 1, backgroundColor: '#333', marginVertical: 4 },

  scheduleLabel: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  sessionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  sessionDayBadge: { backgroundColor: '#333', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, minWidth: 44, alignItems: 'center' },
  sessionDayText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  sessionWorkout: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  sessionType: { color: '#666', fontSize: 12 },

  coachNoteCard: { flexDirection: 'row', backgroundColor: '#1e2535', borderRadius: 12, padding: 14, marginTop: 6, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#4ecdc4', gap: 10 },
  coachNoteIcon: { fontSize: 16 },
  coachNoteText: { color: '#ccc', fontSize: 13, lineHeight: 20, flex: 1, fontStyle: 'italic' },

  activateBtn: { backgroundColor: '#4ecdc4', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  activateBtnText: { color: '#1a1a1a', fontSize: 16, fontWeight: '900' },
  saveOnlyBtn: { alignItems: 'center', padding: 10 },
  saveOnlyText: { color: '#666', fontSize: 13, textDecorationLine: 'underline' },
});
