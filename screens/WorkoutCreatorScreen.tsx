import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { Workout, TrainingType } from '../types/models';
import Footer from '../components/Footer';
import { globalStyles } from '../styles/globalStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateWorkout'>;

type TypeOption = { type: TrainingType; emoji: string; labelKey: string; hangLabelKey: string; defaults: Partial<Workout> };

const TYPE_OPTIONS: TypeOption[] = [
  { type: 'fingerboard', emoji: '🏔️', labelKey: 'creator.type_fingerboard', hangLabelKey: 'creator.hang_label_fingerboard', defaults: { hangTime: 7, restTime: 3, reps: 6, sets: 4, recoverTime: 180 } },
  { type: 'campus',      emoji: '⚡', labelKey: 'creator.type_campus',      hangLabelKey: 'creator.hang_label_campus',      defaults: { hangTime: 6, restTime: 174, reps: 4, sets: 3, recoverTime: 300 } },
  { type: 'flexibility', emoji: '🧘', labelKey: 'creator.type_flexibility', hangLabelKey: 'creator.hang_label_flexibility', defaults: { hangTime: 30, restTime: 15, reps: 4, sets: 2, recoverTime: 60 } },
  { type: 'strength',    emoji: '💪', labelKey: 'creator.type_strength',    hangLabelKey: 'creator.hang_label_strength',    defaults: { hangTime: 5, restTime: 175, reps: 5, sets: 3, recoverTime: 240 } },
];

export default function WorkoutCreatorScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [selectedType, setSelectedType] = useState<TypeOption>(TYPE_OPTIONS[0]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hangTime, setHangTime] = useState('7');
  const [restTime, setRestTime] = useState('3');
  const [reps, setReps] = useState('6');
  const [sets, setSets] = useState('4');
  const [recoverTime, setRecoverTime] = useState('180');

  const handleTypeSelect = (opt: TypeOption) => {
    setSelectedType(opt);
    const d = opt.defaults;
    setHangTime(String(d.hangTime ?? hangTime));
    setRestTime(String(d.restTime ?? restTime));
    setReps(String(d.reps ?? reps));
    setSets(String(d.sets ?? sets));
    setRecoverTime(String(d.recoverTime ?? recoverTime));
  };

  const saveWorkout = async () => {
    if (!name.trim()) { Alert.alert(t('common.error'), t('creator.error_name')); return; }
    const parsedHang = parseInt(hangTime) || 0;
    const parsedRest = parseInt(restTime) || 0;
    const parsedReps = parseInt(reps) || 0;
    const parsedSets = parseInt(sets) || 0;
    const parsedRecover = parseInt(recoverTime) || 0;

    if (parsedHang < 1) {
      Alert.alert(t('common.error'), t('creator.error_min1s', { label: t(selectedType.hangLabelKey).split('(')[0].trim() }));
      return;
    }
    if (parsedReps < 1 || parsedSets < 1) { Alert.alert(t('common.error'), t('creator.error_reps_sets')); return; }

    const workout: Workout = {
      id: Date.now().toString(),
      name: name.trim(),
      type: selectedType.type,
      description: description.trim() || undefined,
      hangTime: parsedHang,
      restTime: parsedRest,
      reps: parsedReps,
      sets: parsedSets,
      recoverTime: parsedRecover,
    };

    try {
      const stored = await AsyncStorage.getItem('workouts');
      const workouts: Workout[] = stored ? JSON.parse(stored) : [];
      workouts.push(workout);
      await AsyncStorage.setItem('workouts', JSON.stringify(workouts));
      Alert.alert(t('creator.saved_title'), t('creator.saved_msg', { name }), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert(t('common.error'), t('creator.error_save'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('creator.title')}</Text>
        <View style={globalStyles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>{t('creator.training_type')}</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.type}
                style={[styles.typeOption, selectedType.type === opt.type && styles.typeOptionActive]}
                onPress={() => handleTypeSelect(opt)}
              >
                <Text style={styles.typeEmoji}>{opt.emoji}</Text>
                <Text style={[styles.typeLabel, selectedType.type === opt.type && styles.typeLabelActive]}>{t(opt.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t('creator.details')}</Text>
          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>{t('creator.name_label')}</Text>
            <TextInput style={globalStyles.input} value={name} onChangeText={setName} placeholder={t('creator.name_placeholder')} placeholderTextColor="#666" returnKeyType="next" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>{t('creator.notes_label')}</Text>
            <TextInput style={[globalStyles.input, styles.multilineInput]} value={description} onChangeText={setDescription} placeholder={t('creator.notes_placeholder')} placeholderTextColor="#666" multiline numberOfLines={2} returnKeyType="done" />
          </View>

          <Text style={styles.sectionLabel}>{t('creator.timer_settings')}</Text>
          <View style={styles.row2}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={globalStyles.label}>{t(selectedType.hangLabelKey)}</Text>
              <TextInput style={globalStyles.input} value={hangTime} onChangeText={setHangTime} keyboardType="numeric" returnKeyType="next" />
            </View>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={globalStyles.label}>{t('creator.rest_reps')}</Text>
              <TextInput style={globalStyles.input} value={restTime} onChangeText={setRestTime} keyboardType="numeric" returnKeyType="next" />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={globalStyles.label}>{t('creator.reps')}</Text>
              <TextInput style={globalStyles.input} value={reps} onChangeText={setReps} keyboardType="numeric" returnKeyType="next" />
            </View>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={globalStyles.label}>{t('creator.sets')}</Text>
              <TextInput style={globalStyles.input} value={sets} onChangeText={setSets} keyboardType="numeric" returnKeyType="next" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>{t('creator.rest_sets')}</Text>
            <TextInput style={globalStyles.input} value={recoverTime} onChangeText={setRecoverTime} keyboardType="numeric" returnKeyType="done" />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveWorkout}>
            <Text style={styles.saveButtonText}>{selectedType.emoji}  {t('creator.save_btn')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  scrollContainer: { padding: 20, paddingBottom: 20, flexGrow: 1 },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 10 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeOption: { flex: 1, backgroundColor: '#2d2d2d', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  typeOptionActive: { borderColor: '#4ecdc4', backgroundColor: '#1e3040' },
  typeEmoji: { fontSize: 22, marginBottom: 4 },
  typeLabel: { color: '#888', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  typeLabelActive: { color: '#4ecdc4' },
  inputGroup: { marginBottom: 16 },
  multilineInput: { height: 64, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  saveButton: { backgroundColor: '#4ecdc4', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
