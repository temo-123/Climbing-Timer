import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { Sex, Equipment, UserProfile } from '../types/models';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const TOTAL_STEPS = 4;

const EQUIPMENT_OPTIONS: { id: Equipment; emoji: string; labelKey: string }[] = [
  { id: 'fingerboard',   emoji: '🏋️', labelKey: 'equip_fingerboard' },
  { id: 'campus_board',  emoji: '🔢', labelKey: 'equip_campus_board' },
  { id: 'climbing_wall', emoji: '🧗', labelKey: 'equip_climbing_wall' },
  { id: 'system_wall',   emoji: '🔶', labelKey: 'equip_system_wall' },
  { id: 'pull_up_bar',   emoji: '💪', labelKey: 'equip_pull_up_bar' },
  { id: 'weights',       emoji: '⚖️', labelKey: 'equip_weights' },
];

const WALL_DEGREES = [30, 40, 45, 50, 55, 60, 70, 90];

const EXPERIENCE_OPTIONS = [
  { valueKey: 'exp_lt1', value: 0 },
  { valueKey: 'exp_1_2', value: 1 },
  { valueKey: 'exp_3_5', value: 3 },
  { valueKey: 'exp_6plus', value: 6 },
];


export default function OnboardingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState(0);

  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [wallDegree, setWallDegree] = useState<number>(45);

  const [experienceYears, setExperienceYears] = useState<number>(-1);
  const [climbingGrade, setClimbingGrade] = useState('');

  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const hasWall = equipment.includes('climbing_wall') || equipment.includes('system_wall');

  const toggleEquipment = (id: Equipment) => {
    setEquipment(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!age || parseInt(age) < 10 || parseInt(age) > 90) {
        Alert.alert(t('onboarding.err_age_title'), t('onboarding.err_age'));
        return false;
      }
      if (!weight || parseFloat(weight) < 30 || parseFloat(weight) > 200) {
        Alert.alert(t('onboarding.err_weight_title'), t('onboarding.err_weight'));
        return false;
      }
      if (!height || parseFloat(height) < 100 || parseFloat(height) > 250) {
        Alert.alert(t('onboarding.err_height_title'), t('onboarding.err_height'));
        return false;
      }
    }
    if (step === 1 && equipment.length === 0) {
      Alert.alert(t('onboarding.err_equipment_title'), t('onboarding.err_equipment'));
      return false;
    }
    if (step === 2 && experienceYears < 0) {
      Alert.alert(t('onboarding.err_experience_title'), t('onboarding.err_experience'));
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    setSaving(true);
    const profile: UserProfile = {
      age: parseInt(age),
      sex,
      weight: parseFloat(weight),
      height: parseFloat(height),
      equipment,
      wallDegree: hasWall ? wallDegree : undefined,
      experienceYears,
      climbingGrade: climbingGrade.trim() || undefined,
      anthropicApiKey: apiKey.trim() || undefined,
    };
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      navigation.replace('Home');
    } catch {
      Alert.alert(t('onboarding.err_save_title'), t('onboarding.err_save'));
    } finally {
      setSaving(false);
    }
  };

  const renderProgress = () => (
    <View style={styles.progressRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
      ))}
    </View>
  );

  const renderStep0 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepEmoji}>👤</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step1_title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step1_sub')}</Text>

      <Text style={styles.label}>{t('onboarding.age')}</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        placeholder={t('onboarding.age_placeholder')}
        placeholderTextColor="#555"
        maxLength={3}
      />

      <Text style={styles.label}>{t('onboarding.sex')}</Text>
      <View style={styles.chipRow}>
        {(['male', 'female', 'other'] as Sex[]).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, sex === s && styles.chipActive]}
            onPress={() => setSex(s)}
          >
            <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
              {t(`onboarding.sex_${s}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row2}>
        <View style={styles.halfCol}>
          <Text style={styles.label}>{t('onboarding.weight')}</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={t('onboarding.weight_placeholder')}
            placeholderTextColor="#555"
            maxLength={5}
          />
        </View>
        <View style={styles.halfCol}>
          <Text style={styles.label}>{t('onboarding.height')}</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            placeholder={t('onboarding.height_placeholder')}
            placeholderTextColor="#555"
            maxLength={5}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepEmoji}>🏋️</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step2_title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step2_sub')}</Text>

      <View style={styles.equipGrid}>
        {EQUIPMENT_OPTIONS.map(opt => {
          const active = equipment.includes(opt.id);
          const label = t(`onboarding.${opt.labelKey}` as any);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.equipCard, active && styles.equipCardActive]}
              onPress={() => toggleEquipment(opt.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.equipEmoji}>{opt.emoji}</Text>
              <Text style={[styles.equipLabel, active && styles.equipLabelActive]}>{label}</Text>
              {active && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {hasWall && (
        <View style={styles.wallSection}>
          <Text style={styles.label}>{t('onboarding.wall_angle')}</Text>
          <Text style={styles.wallSub}>{t('onboarding.wall_angle_sub')}</Text>
          <View style={styles.degreeRow}>
            {WALL_DEGREES.map(deg => (
              <TouchableOpacity
                key={deg}
                style={[styles.degChip, wallDegree === deg && styles.degChipActive]}
                onPress={() => setWallDegree(deg)}
              >
                <Text style={[styles.degText, wallDegree === deg && styles.degTextActive]}>
                  {deg === 90 ? t('onboarding.wall_roof') : `${deg}°`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepEmoji}>🧗</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step3_title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step3_sub')}</Text>

      <Text style={styles.label}>{t('onboarding.experience')}</Text>
      <View style={styles.expGrid}>
        {EXPERIENCE_OPTIONS.map(opt => {
          const active = experienceYears === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.expChip, active && styles.expChipActive]}
              onPress={() => setExperienceYears(opt.value)}
            >
              <Text style={[styles.expText, active && styles.expTextActive]}>
                {t(`onboarding.${opt.valueKey}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>
        {t('onboarding.grade')}{'  '}
        <Text style={styles.optional}>{t('onboarding.grade_optional')}</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={climbingGrade}
        onChangeText={setClimbingGrade}
        placeholder={t('onboarding.grade_placeholder')}
        placeholderTextColor="#555"
        autoCapitalize="none"
        maxLength={10}
      />
      <Text style={styles.hint}>{t('onboarding.grade_hint')}</Text>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepEmoji}>🤖</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step4_title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step4_sub')}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🔑</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>{t('onboarding.api_what_title')}</Text>
          <Text style={styles.infoText}>{t('onboarding.api_what_text')}</Text>
        </View>
      </View>

      <Text style={styles.label}>
        {t('onboarding.api_key_label')}{'  '}
        <Text style={styles.optional}>{t('onboarding.api_key_optional')}</Text>
      </Text>
      <TextInput
        style={[styles.input, styles.apiInput]}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder={t('onboarding.api_key_placeholder')}
        placeholderTextColor="#555"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>{t('onboarding.api_key_hint')}</Text>

      <TouchableOpacity style={styles.skipBtn} onPress={finish}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('onboarding.app_title')}</Text>
          {renderProgress()}
        </View>

        <View style={{ flex: 1 }}>
          {steps[step]?.()}
        </View>

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backText}>{t('onboarding.back')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
            onPress={next}
            disabled={saving}
          >
            <Text style={styles.nextText}>
              {saving
                ? t('onboarding.saving')
                : step === TOTAL_STEPS - 1
                  ? t('onboarding.finish')
                  : t('onboarding.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 10 },
  headerTitle: { color: '#4ecdc4', fontSize: 17, fontWeight: '800', marginBottom: 14 },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressDot: { flex: 1, height: 4, backgroundColor: '#2d2d2d', borderRadius: 2 },
  progressDotActive: { backgroundColor: '#4ecdc4' },

  stepContent: { padding: 24, paddingBottom: 20 },
  stepEmoji: { fontSize: 40, marginBottom: 12 },
  stepTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  stepSub: { color: '#888', fontSize: 14, lineHeight: 21, marginBottom: 24 },

  label: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  optional: { color: '#555', fontWeight: '400', fontSize: 13 },
  input: {
    backgroundColor: '#252525',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  hint: { color: '#555', fontSize: 12, marginTop: -10, marginBottom: 16, lineHeight: 18 },

  row2: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },

  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#252525', borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  chipActive: { backgroundColor: '#162535', borderColor: '#4ecdc4' },
  chipText: { color: '#777', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#4ecdc4' },

  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  equipCard: {
    width: '47%', backgroundColor: '#252525', borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333',
    position: 'relative',
  },
  equipCardActive: { backgroundColor: '#162535', borderColor: '#4ecdc4' },
  equipEmoji: { fontSize: 30, marginBottom: 8 },
  equipLabel: { color: '#777', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  equipLabelActive: { color: '#4ecdc4' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#4ecdc4', borderRadius: 10, width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#1a1a1a', fontSize: 11, fontWeight: '900' },

  wallSection: { marginTop: 4 },
  wallSub: { color: '#666', fontSize: 12, marginTop: -4, marginBottom: 12 },
  degreeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  degChip: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#252525', borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  degChipActive: { backgroundColor: '#162535', borderColor: '#4ecdc4' },
  degText: { color: '#777', fontSize: 13, fontWeight: '600' },
  degTextActive: { color: '#4ecdc4' },

  expGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  expChip: { paddingHorizontal: 20, paddingVertical: 13, backgroundColor: '#252525', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  expChipActive: { backgroundColor: '#162535', borderColor: '#4ecdc4' },
  expText: { color: '#777', fontSize: 14, fontWeight: '600' },
  expTextActive: { color: '#4ecdc4' },

  infoCard: {
    flexDirection: 'row', backgroundColor: '#1e2535', borderRadius: 14,
    padding: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#4ecdc4', gap: 12,
  },
  infoIcon: { fontSize: 22 },
  infoTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  infoText: { color: '#aaa', fontSize: 13, lineHeight: 20 },

  apiInput: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },

  skipBtn: { alignItems: 'center', paddingVertical: 16 },
  skipText: { color: '#555', fontSize: 13, textDecorationLine: 'underline' },

  footer: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#222' },
  backBtn: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#252525', borderRadius: 14, justifyContent: 'center',
  },
  backText: { color: '#888', fontSize: 15, fontWeight: '600' },
  nextBtn: { flex: 1, backgroundColor: '#4ecdc4', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: { color: '#1a1a1a', fontSize: 16, fontWeight: '800' },
});
