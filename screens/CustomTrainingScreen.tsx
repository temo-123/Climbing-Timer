import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { Workout, TrainingType, UserProfile, Equipment } from '../types/models';
import { fetchTrainings } from '../utils/api';
import { TYPE_EMOJIS, DIFFICULTY_COLORS, getDifficultyLabel, localizedWorkout, getWorkoutPreviewImage } from '../data/constants';
import { globalStyles } from '../styles/globalStyles';
import MenuButton from '../components/MenuButton';
import Footer from '../components/Footer';
import TopAlignedImage from '../components/TopAlignedImage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CustomTraining'>;

const ALL_TABS: { type: TrainingType; requiredEquipment: Equipment | null }[] = [
  { type: 'fingerboard', requiredEquipment: 'fingerboard' },
  { type: 'campus',      requiredEquipment: 'campus_board' },
  { type: 'endurance',   requiredEquipment: 'system_wall' },
  { type: 'flexibility', requiredEquipment: null },
];

const formatSec = (s: number) => {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60 ? ' ' + (s % 60) + 's' : ''}`;
};


export default function CustomTrainingScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigation = useNavigation<NavigationProp>();
  const [userEquipment, setUserEquipment] = useState<Equipment[]>([]);
  const [activeTab, setActiveTab] = useState<TrainingType>('fingerboard');
  const [selectedExercise, setSelectedExercise] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('userProfile').then(profileRaw => {
      if (profileRaw) {
        const profile: UserProfile = JSON.parse(profileRaw);
        const equip = profile.equipment || [];
        setUserEquipment(equip);
        const tabs = getAvailableTabs(equip);
        if (tabs.length > 0 && !tabs.find(tab => tab.type === activeTab)) {
          setActiveTab(tabs[0].type);
        }
      }
    }).catch(() => {});
  }, []));

  const getAvailableTabs = (equip: Equipment[]) => ALL_TABS.filter(tab =>
    tab.requiredEquipment === null || equip.includes(tab.requiredEquipment)
  );

  const tabs = getAvailableTabs(userEquipment);
  const effectiveTab = tabs.find(t => t.type === activeTab) ? activeTab : (tabs[0]?.type ?? 'flexibility');

  const loadExercises = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchTrainings(effectiveTab)
      .then(data => { if (!cancelled) setExercises(data); })
      .catch(() => { if (!cancelled) { setExercises([]); setError(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [effectiveTab]);

  useEffect(() => loadExercises(), [loadExercises]);

  const lEx = (ex: Workout) => localizedWorkout(ex, lang);

  const getTypeDesc = (type: TrainingType) => t(`custom.type_desc_${type}`);

  const getWorkLabel = (type: TrainingType) => {
    if (type === 'campus') return t('custom.move_lbl');
    if (type === 'flexibility') return t('custom.stretch_lbl');
    if (type === 'endurance') return t('custom.circuit_lbl');
    return t('custom.hang_lbl');
  };

  const startExercise = (ex: Workout) => {
    setSelectedExercise(null);
    navigation.navigate('Timer', { workout: ex });
  };

  const diffColor = (ex: Workout) => DIFFICULTY_COLORS[ex.difficulty ?? 'medium'];

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <MenuButton align="left" />
        <Text style={styles.headerTitle}>{t('custom.title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.type}
            style={[styles.tab, effectiveTab === tab.type && styles.tabActive]}
            onPress={() => setActiveTab(tab.type)}
          >
            <Text style={styles.tabEmoji}>{TYPE_EMOJIS[tab.type]}</Text>
            <Text style={[styles.tabLabel, effectiveTab === tab.type && styles.tabLabelActive]}>
              {t(`custom.${tab.type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.typeDesc}>
        <Text style={styles.typeDescText}>{getTypeDesc(effectiveTab)}</Text>
        <Text style={styles.typeDescCount}>{t('custom.n_exercises', { n: exercises.length })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#4ecdc4" />
            <Text style={styles.centerStateText}>{t('common.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateEmoji}>📡</Text>
            <Text style={styles.centerStateTitle}>{t('custom.error_title')}</Text>
            <Text style={styles.centerStateText}>{t('custom.error_text')}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadExercises}>
              <Text style={styles.retryBtnText}>{t('custom.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateEmoji}>🗂️</Text>
            <Text style={styles.centerStateTitle}>{t('custom.empty_title')}</Text>
            <Text style={styles.centerStateText}>{t('custom.empty_text')}</Text>
          </View>
        ) : exercises.map(ex => {
          const loc = lEx(ex);
          const previewImage = getWorkoutPreviewImage(ex);
          const isLocked = ex.type === 'fingerboard' && !userEquipment.includes('fingerboard');
          const showImage = !!previewImage && !isLocked;
          return (
          <TouchableOpacity
            key={ex.id}
            style={styles.card}
            onPress={() => setSelectedExercise(ex)}
            activeOpacity={0.85}
          >
            {isLocked
              ? <Text style={styles.cardDescOnly}>{loc.description}</Text>
              : (
                <View style={styles.cardImage}>
                  {showImage
                    ? <TopAlignedImage uri={previewImage!} style={StyleSheet.absoluteFill} />
                    : <View style={[StyleSheet.absoluteFill, styles.cardImagePlaceholder]}><Text style={styles.cardImagePlaceholderEmoji}>{TYPE_EMOJIS[ex.type]}</Text></View>
                  }
                  <View style={styles.cardImageBadge}><Text style={styles.cardImageBadgeText}>{TYPE_EMOJIS[ex.type]}</Text></View>
                </View>
              )
            }
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName}>{loc.name}</Text>
                <View style={[styles.diffBadge, { backgroundColor: diffColor(ex) + '25', borderColor: diffColor(ex) }]}>
                  <Text style={[styles.diffText, { color: diffColor(ex) }]}>{getDifficultyLabel(ex.difficulty ?? 'medium', lang)}</Text>
                </View>
              </View>

              {loc.targetMuscle !== '' && <Text style={styles.cardTarget}>🎯 {loc.targetMuscle}</Text>}

              <View style={styles.timerRow}>
                <View style={styles.timerItem}>
                  <Text style={styles.timerVal}>{ex.hangTime}s</Text>
                  <Text style={styles.timerLbl}>{getWorkLabel(ex.type)}</Text>
                </View>
                <View style={styles.timerDivider} />
                <View style={styles.timerItem}>
                  <Text style={styles.timerVal}>{ex.reps}</Text>
                  <Text style={styles.timerLbl}>{t('custom.reps_lbl')}</Text>
                </View>
                <View style={styles.timerDivider} />
                <View style={styles.timerItem}>
                  <Text style={styles.timerVal}>{ex.sets}</Text>
                  <Text style={styles.timerLbl}>{t('custom.sets_lbl')}</Text>
                </View>
                <View style={styles.timerDivider} />
                <View style={styles.timerItem}>
                  <Text style={styles.timerVal}>{formatSec(ex.recoverTime)}</Text>
                  <Text style={styles.timerLbl}>{t('custom.recover_lbl')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.startBtn, { borderColor: diffColor(ex) }]}
                onPress={() => setSelectedExercise(ex)}
              >
                <Text style={styles.startBtnText}>{t('custom.view_start')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={selectedExercise !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedExercise(null)}
      >
        {selectedExercise && (() => {
          const selLoc = lEx(selectedExercise);
          const selPreviewImage = getWorkoutPreviewImage(selectedExercise);
          const selLocked = selectedExercise.type === 'fingerboard' && !userEquipment.includes('fingerboard');
          return (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {!!selPreviewImage && !selLocked && (
                  <TopAlignedImage uri={selPreviewImage} style={styles.modalImage} />
                )}
                <View style={styles.modalBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.modalName}>{selLoc.name}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: diffColor(selectedExercise) + '25', borderColor: diffColor(selectedExercise) }]}>
                      <Text style={[styles.diffText, { color: diffColor(selectedExercise) }]}>{getDifficultyLabel(selectedExercise.difficulty ?? 'medium', lang)}</Text>
                    </View>
                  </View>

                  {selLoc.targetMuscle !== '' && <Text style={styles.modalTarget}>🎯 {selLoc.targetMuscle}</Text>}
                  <Text style={styles.modalDesc}>{selLoc.description}</Text>

                  <Text style={styles.sectionLabel}>{t('custom.timer_settings')}</Text>
                  <View style={styles.modalTimerGrid}>
                    {[
                      { label: getWorkLabel(selectedExercise.type), val: `${selectedExercise.hangTime}s` },
                      { label: t('custom.rest_between_reps'), val: `${selectedExercise.restTime}s` },
                      { label: t('custom.reps_lbl'), val: String(selectedExercise.reps) },
                      { label: t('custom.sets_lbl'), val: String(selectedExercise.sets) },
                      { label: t('custom.recover_between_sets'), val: formatSec(selectedExercise.recoverTime) },
                    ].map(item => (
                      <View key={item.label} style={styles.timerSettingRow}>
                        <Text style={styles.timerSettingLabel}>{item.label}</Text>
                        <Text style={styles.timerSettingVal}>{item.val}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.coachTipBlock}>
                    <Text style={styles.coachTipIcon}>💬</Text>
                    <Text style={styles.coachTipText}>{selLoc.coachTip}</Text>
                  </View>

                  <TouchableOpacity style={styles.bigStartBtn} onPress={() => startExercise(selectedExercise)}>
                    <Text style={styles.bigStartBtnText}>{t('custom.start_exercise')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedExercise(null)}>
                    <Text style={styles.closeBtnText}>{t('custom.close')}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
          );
        })()}
      </Modal>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  tab: { flex: 1, backgroundColor: '#2d2d2d', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { borderColor: '#4ecdc4', backgroundColor: '#1e3040' },
  tabEmoji: { fontSize: 20, marginBottom: 3 },
  tabLabel: { color: '#888', fontSize: 11, fontWeight: '600' },
  tabLabelActive: { color: '#4ecdc4' },
  typeDesc: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16 },
  typeDescText: { color: '#aaa', fontSize: 13, lineHeight: 18, flex: 1, marginRight: 16 },
  typeDescCount: { color: '#4ecdc4', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 20 },
  centerState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  centerStateEmoji: { fontSize: 48, marginBottom: 14 },
  centerStateTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  centerStateText: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 10 },
  retryBtn: { backgroundColor: '#4ecdc4', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 18 },
  retryBtnText: { color: '#1a1a1a', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: '#2d2d2d', borderRadius: 16, marginBottom: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#333',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  cardImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#1e2530', overflow: 'hidden' },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e2530' },
  cardImagePlaceholderEmoji: { fontSize: 90, opacity: 0.6 },
  cardImageBadge: {
    position: 'absolute', top: 10, left: 10, width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  cardImageBadgeText: { fontSize: 16 },
  cardBody: { padding: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  cardName: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  diffBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexShrink: 0 },
  diffText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardTarget: { color: '#aaa', fontSize: 13, marginBottom: 10 },
  timerRow: { flexDirection: 'row', backgroundColor: '#1e2530', borderRadius: 10, padding: 10, marginBottom: 12 },
  timerItem: { flex: 1, alignItems: 'center' },
  timerVal: { color: '#4ecdc4', fontSize: 15, fontWeight: '700' },
  timerLbl: { color: '#666', fontSize: 10, marginTop: 2 },
  timerDivider: { width: 1, backgroundColor: '#2d3540', marginVertical: 2 },
  startBtn: { borderWidth: 1, borderRadius: 10, padding: 11, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1e1e22', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalImage: { width: '100%', aspectRatio: 16 / 9, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalBody: { padding: 20, paddingBottom: 30 },
  modalName: { color: '#fff', fontSize: 22, fontWeight: '800', flex: 1, marginRight: 8 },
  modalTarget: { color: '#aaa', fontSize: 14, marginBottom: 12, marginTop: 4 },
  modalDesc: { color: '#ccc', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  sectionLabel: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  modalTimerGrid: { backgroundColor: '#2d2d2d', borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 },
  timerSettingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timerSettingLabel: { color: '#aaa', fontSize: 14 },
  timerSettingVal: { color: '#4ecdc4', fontSize: 14, fontWeight: '700' },
  coachTipBlock: { flexDirection: 'row', backgroundColor: '#1e2535', borderRadius: 12, padding: 14, marginBottom: 20, alignItems: 'flex-start', borderLeftWidth: 3, borderLeftColor: '#4ecdc4' },
  coachTipIcon: { fontSize: 16, marginRight: 10 },
  coachTipText: { color: '#ccc', fontSize: 13, lineHeight: 20, flex: 1, fontStyle: 'italic' },
  bigStartBtn: { backgroundColor: '#4ecdc4', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 10 },
  bigStartBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  closeBtn: { alignItems: 'center', padding: 12 },
  closeBtnText: { color: '#888', fontSize: 15 },
  cardDescOnly: { color: '#aaa', fontSize: 13, lineHeight: 19, padding: 14, paddingBottom: 4 },
  modalFingerboad: { padding: 16, paddingBottom: 0 },
});
