import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { TrainingPlan } from '../types/models';
import { fetchPlans } from '../utils/api';
import { LEVEL_COLORS, localizedPlan, getLevelLabel } from '../data/constants';
import { globalStyles } from '../styles/globalStyles';
import MenuButton from '../components/MenuButton';
import Footer from '../components/Footer';
import { DAY_KEYS } from '../utils/i18n';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TrainingPlans'>;

export default function TrainingPlansScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigation = useNavigation<NavigationProp>();
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(useCallback(() => { loadActivePlan(); loadPlans(); }, []));

  const loadActivePlan = async () => {
    try {
      const raw = await AsyncStorage.getItem('plans');
      const stored: TrainingPlan[] = raw ? JSON.parse(raw) : [];
      setActivePlanId(stored.find(p => p.isActive)?.id || null);
    } catch { /* ignore */ }
  };

  const loadPlans = async () => {
    setLoading(true);
    setError(false);
    try {
      setPlans(await fetchPlans());
    } catch {
      setPlans([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const COACH_TIP_KEYS = [
    'plans.tip_tendons',
    'plans.tip_maxhangs',
    'plans.tip_consistency',
    'plans.tip_warmup',
    'plans.tip_pulley',
  ];
  const tip = t(COACH_TIP_KEYS[new Date().getDate() % COACH_TIP_KEYS.length]);

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <MenuButton align="left" />
        <Text style={[globalStyles.title, styles.headerTitle]}>{t('plans.title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('plans.choose_level')}</Text>
        <Text style={styles.sectionDesc}>{t('plans.section_desc')}</Text>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#4ecdc4" />
            <Text style={styles.centerStateText}>{t('common.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateEmoji}>📡</Text>
            <Text style={styles.centerStateTitle}>{t('plans.error_load_title')}</Text>
            <Text style={styles.centerStateText}>{t('plans.error_load_text')}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadPlans}>
              <Text style={styles.retryBtnText}>{t('custom.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateEmoji}>🗂️</Text>
            <Text style={styles.centerStateTitle}>{t('plans.empty_title')}</Text>
            <Text style={styles.centerStateText}>{t('plans.empty_text')}</Text>
          </View>
        ) : plans.map(plan => {
          const isActive = activePlanId === plan.id;
          const levelColor = LEVEL_COLORS[plan.level] || '#4ecdc4';
          const lp = localizedPlan(plan, lang);
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isActive && styles.planCardActive]}
              onPress={() => navigation.navigate('PlanDetail', { planId: plan.id })}
            >
              {isActive && (
                <View style={styles.activeBanner}>
                  <Text style={styles.activeBannerText}>{t('plans.active_badge')}</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planEmoji}>{plan.emoji}</Text>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{lp.name}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: levelColor + '22', borderColor: levelColor }]}>
                    <Text style={[styles.levelText, { color: levelColor }]}>{getLevelLabel(plan.level, lang)}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.planTagline}>{lp.tagline}</Text>

              <View style={styles.planMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{plan.daysPerWeek}×</Text>
                  <Text style={styles.metaLabel}>{t('plans.per_week')}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{plan.weeks > 0 ? `${plan.weeks}w` : '∞'}</Text>
                  <Text style={styles.metaLabel}>{t('plans.duration_meta')}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaValue}>{[...new Set(plan.sessions.flatMap(s => s.workouts.map(w => w.type)))].length}</Text>
                  <Text style={styles.metaLabel}>{t('plans.training_types_meta')}</Text>
                </View>
              </View>

              <View style={styles.dayTags}>
                {plan.sessions.map(s => (
                  <View key={s.dayIndex} style={styles.dayTag}>
                    <Text style={styles.dayTagText}>{t(DAY_KEYS[s.dayIndex]).substring(0, 3)}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.viewDetails}>{t('plans.view_details')}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>{t('plans.bottom_note')}</Text>
        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 22, marginBottom: 0, paddingTop: 0, flex: 1, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 20 },
  tipCard: { flexDirection: 'row', backgroundColor: '#1e2f20', borderRadius: 12, padding: 14, marginBottom: 22, borderLeftWidth: 3, borderLeftColor: '#2ed573', alignItems: 'flex-start' },
  tipIcon: { fontSize: 18, marginRight: 10, marginTop: 1 },
  tipText: { color: '#ccc', fontSize: 14, lineHeight: 20, flex: 1 },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  sectionDesc: { color: '#888', fontSize: 13, marginBottom: 18, lineHeight: 18 },
  centerState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 10 },
  centerStateEmoji: { fontSize: 48, marginBottom: 14 },
  centerStateTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  centerStateText: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 10 },
  retryBtn: { backgroundColor: '#4ecdc4', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 18 },
  retryBtnText: { color: '#1a1a1a', fontSize: 14, fontWeight: '700' },
  planCard: { backgroundColor: '#2d2d2d', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'transparent' },
  planCardActive: { borderColor: '#4ecdc4' },
  activeBanner: { backgroundColor: '#4ecdc4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 10 },
  activeBannerText: { color: '#1a1a1a', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  planEmoji: { fontSize: 36, marginRight: 14 },
  planInfo: { flex: 1 },
  planName: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  levelBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  planTagline: { color: '#ccc', fontSize: 14, marginBottom: 14, lineHeight: 20 },
  planMeta: { flexDirection: 'row', marginBottom: 14 },
  metaItem: { flex: 1, alignItems: 'center' },
  metaValue: { color: '#4ecdc4', fontSize: 18, fontWeight: '700' },
  metaLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  metaDivider: { width: 1, backgroundColor: '#3d3d3d', marginVertical: 4 },
  dayTags: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  dayTag: { backgroundColor: '#3d3d3d', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  dayTagText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  viewDetails: { color: '#4ecdc4', fontSize: 14, fontWeight: '600', textAlign: 'right' },
  bottomNote: { marginTop: 10, marginBottom: 10 },
  bottomNoteText: { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
