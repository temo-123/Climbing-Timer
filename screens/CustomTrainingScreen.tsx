import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { Workout, TrainingType } from '../types/models';
import { Exercise, EXERCISES_BY_TYPE, DIFFICULTY_COLORS, localizedExercise, getDifficultyLabel } from '../data/exercises';
import { TYPE_EMOJIS } from '../data/presetPlans';
import { globalStyles } from '../styles/globalStyles';
import Footer from '../components/Footer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CustomTraining'>;

const TABS: { type: TrainingType }[] = [
  { type: 'fingerboard' },
  { type: 'campus' },
  { type: 'flexibility' },
];

const formatSec = (s: number) => {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60 ? ' ' + (s % 60) + 's' : ''}`;
};

export default function CustomTrainingScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TrainingType>('fingerboard');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const exercises = EXERCISES_BY_TYPE(activeTab);
  const lEx = (ex: Exercise) => localizedExercise(ex, lang);

  const getTypeDesc = (type: TrainingType) => t(`custom.type_desc_${type}`);

  const getWorkLabel = (type: TrainingType) => {
    if (type === 'campus') return t('custom.move_lbl');
    if (type === 'flexibility') return t('custom.stretch_lbl');
    return t('custom.hang_lbl');
  };

  const startExercise = (ex: Exercise) => {
    setSelectedExercise(null);
    const loc = lEx(ex);
    const workout: Workout = {
      id: `custom-${ex.id}-${Date.now()}`,
      name: loc.name,
      type: ex.type,
      description: loc.description,
      hangTime: ex.workout.hangTime,
      restTime: ex.workout.restTime,
      reps: ex.workout.reps,
      sets: ex.workout.sets,
      recoverTime: ex.workout.recoverTime,
      coachTip: loc.coachTip,
    };
    navigation.navigate('Timer', { workout });
  };

  const diffColor = (ex: Exercise) => DIFFICULTY_COLORS[ex.difficulty];

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('custom.title')}</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.type}
            style={[styles.tab, activeTab === tab.type && styles.tabActive]}
            onPress={() => setActiveTab(tab.type)}
          >
            <Text style={styles.tabEmoji}>{TYPE_EMOJIS[tab.type]}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.type && styles.tabLabelActive]}>
              {t(`custom.${tab.type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.typeDesc}>
        <Text style={styles.typeDescText}>{getTypeDesc(activeTab)}</Text>
        <Text style={styles.typeDescCount}>{t('custom.n_exercises', { n: exercises.length })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {exercises.map(ex => {
          const loc = lEx(ex);
          return (
          <TouchableOpacity
            key={ex.id}
            style={styles.card}
            onPress={() => setSelectedExercise(ex)}
            activeOpacity={0.85}
          >
            <Image source={ex.imageSource} style={styles.cardImage} resizeMode="cover" />
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName}>{loc.name}</Text>
                <View style={[styles.diffBadge, { backgroundColor: diffColor(ex) + '25', borderColor: diffColor(ex) }]}>
                  <Text style={[styles.diffText, { color: diffColor(ex) }]}>{getDifficultyLabel(ex.difficulty, lang)}</Text>
                </View>
              </View>

              <Text style={styles.cardTarget}>🎯 {loc.targetMuscle}</Text>

              <View style={styles.timerRow}>
                <View style={styles.timerItem}>
                  <Text style={styles.timerVal}>{ex.workout.hangTime}s</Text>
                  <Text style={styles.timerLbl}>{getWorkLabel(ex.type)}</Text>
                </View>
                <View style={styles.timerDivider} />
                <View style={styles.timerItem}>
                  <Text style={styles.timerVal}>{ex.workout.reps}</Text>
                  <Text style={styles.timerLbl}>{t('custom.reps_lbl')}</Text>
                </View>
                <View style={styles.timerDivider} />
                <View style={styles.timerItem}>
                  <Text style={styles.timerVal}>{ex.workout.sets}</Text>
                  <Text style={styles.timerLbl}>{t('custom.sets_lbl')}</Text>
                </View>
                <View style={styles.timerDivider} />
                <View style={styles.timerItem}>
                  <Text style={styles.timerVal}>{formatSec(ex.workout.recoverTime)}</Text>
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
          return (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={selectedExercise.imageSource} style={styles.modalImage} resizeMode="contain" />
                <View style={styles.modalBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.modalName}>{selLoc.name}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: diffColor(selectedExercise) + '25', borderColor: diffColor(selectedExercise) }]}>
                      <Text style={[styles.diffText, { color: diffColor(selectedExercise) }]}>{getDifficultyLabel(selectedExercise.difficulty, lang)}</Text>
                    </View>
                  </View>

                  <Text style={styles.modalTarget}>🎯 {selLoc.targetMuscle}</Text>
                  <Text style={styles.modalDesc}>{selLoc.description}</Text>

                  <Text style={styles.sectionLabel}>{t('custom.timer_settings')}</Text>
                  <View style={styles.modalTimerGrid}>
                    {[
                      { label: getWorkLabel(selectedExercise.type), val: `${selectedExercise.workout.hangTime}s` },
                      { label: t('custom.rest_between_reps'), val: `${selectedExercise.workout.restTime}s` },
                      { label: t('custom.reps_lbl'), val: String(selectedExercise.workout.reps) },
                      { label: t('custom.sets_lbl'), val: String(selectedExercise.workout.sets) },
                      { label: t('custom.recover_between_sets'), val: formatSec(selectedExercise.workout.recoverTime) },
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
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tab: { flex: 1, backgroundColor: '#2d2d2d', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { borderColor: '#4ecdc4', backgroundColor: '#1e3040' },
  tabEmoji: { fontSize: 20, marginBottom: 3 },
  tabLabel: { color: '#888', fontSize: 11, fontWeight: '600' },
  tabLabelActive: { color: '#4ecdc4' },
  typeDesc: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  typeDescText: { color: '#aaa', fontSize: 13, flex: 1, marginRight: 10 },
  typeDescCount: { color: '#4ecdc4', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 20 },
  card: { backgroundColor: '#2d2d2d', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  cardImage: { width: '100%', height: 180 },
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
  modalImage: { width: '100%', height: 260, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
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
});
