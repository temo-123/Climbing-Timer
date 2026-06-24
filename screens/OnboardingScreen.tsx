import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { Sex, Equipment, UserProfile } from '../types/models';
import { setLanguage, AppLanguage } from '../utils/i18n';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const TOTAL_STEPS = 5;

const STEP_LABELS = ['Language', 'About You', 'Equipment', 'Climbing', 'AI Coach'];

const SEX_OPTIONS: { id: Sex; emoji: string; labelKey: string }[] = [
  { id: 'male',   emoji: '♂',  labelKey: 'sex_male' },
  { id: 'female', emoji: '♀',  labelKey: 'sex_female' },
  { id: 'other',  emoji: '⚧',  labelKey: 'sex_other' },
];

const EXPERIENCE_OPTIONS = [
  { value: 0, emoji: '🌱', titleKey: 'exp_lt1',   gradeHint: 'Up to 5a / V0' },
  { value: 1, emoji: '🧗', titleKey: 'exp_1_2',   gradeHint: '5b–6a / V1–V3' },
  { value: 3, emoji: '💪', titleKey: 'exp_3_5',   gradeHint: '6b–7a / V4–V6' },
  { value: 6, emoji: '⭐', titleKey: 'exp_6plus',  gradeHint: '7a+ / V7+' },
];

const ALL_EQUIPMENT: { id: Equipment; emoji: string; labelKey: string; descKey: string }[] = [
  { id: 'fingerboard',   emoji: '🏔️', labelKey: 'equip_fingerboard',  descKey: 'equip_desc_fingerboard' },
  { id: 'campus_board',  emoji: '⚡', labelKey: 'equip_campus_board', descKey: 'equip_desc_campus' },
  { id: 'system_wall',   emoji: '🔶', labelKey: 'equip_system_wall',  descKey: 'equip_desc_system' },
  { id: 'climbing_wall', emoji: '🧗', labelKey: 'equip_climbing_wall',descKey: 'equip_desc_wall' },
  { id: 'pull_up_bar',   emoji: '💪', labelKey: 'equip_pull_up_bar',  descKey: 'equip_desc_pullup' },
  { id: 'weights',       emoji: '⚖️', labelKey: 'equip_weights',      descKey: 'equip_desc_weights' },
];

const WALL_DEGREES = [30, 40, 45, 50, 55, 60, 70, 90];

function Stepper({ value, onDec, onInc, unit }: { value: number; onDec: () => void; onInc: () => void; unit: string }) {
  return (
    <View style={stepperStyles.row}>
      <TouchableOpacity style={stepperStyles.btn} onPress={onDec} activeOpacity={0.7}>
        <Text style={stepperStyles.btnText}>−</Text>
      </TouchableOpacity>
      <View style={stepperStyles.valBox}>
        <Text style={stepperStyles.val}>{value}</Text>
        <Text style={stepperStyles.unit}>{unit}</Text>
      </View>
      <TouchableOpacity style={stepperStyles.btn} onPress={onInc} activeOpacity={0.7}>
        <Text style={stepperStyles.btnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  btn:    { width: 52, height: 52, borderRadius: 26, backgroundColor: '#252525', borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  btnText:{ color: '#4ecdc4', fontSize: 26, fontWeight: '300', lineHeight: 30 },
  valBox: { alignItems: 'center', width: 110 },
  val:    { color: '#fff', fontSize: 42, fontWeight: '800', lineHeight: 48 },
  unit:   { color: '#555', fontSize: 13, marginTop: -4 },
});

export default function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(i18n.language === 'ka' ? 'ka' : 'en');

  const [age,    setAge]    = useState(25);
  const [sex,    setSex]    = useState<Sex>('male');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);

  const [equipment,  setEquipment]  = useState<Equipment[]>([]);
  const [wallDegree, setWallDegree] = useState<number>(45);

  const [experienceYears, setExperienceYears] = useState<number>(-1);
  const [climbingGrade,   setClimbingGrade]   = useState('');

  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const hasWall = equipment.includes('climbing_wall') || equipment.includes('system_wall');

  const pickLanguage = async (lang: AppLanguage) => {
    setSelectedLang(lang);
    await setLanguage(lang);
    setStep(1);
  };

  const toggleEquipment = (id: Equipment) =>
    setEquipment(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const validateStep = (): boolean => {
    if (step === 3 && experienceYears < 0) {
      Alert.alert(t('onboarding.err_experience_title'), t('onboarding.err_experience'));
      return false;
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
    else finish();
  };

  const finish = async () => {
    setSaving(true);
    const profile: UserProfile = {
      age,
      sex,
      weight,
      height,
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

  // ── Progress bar ─────────────────────────────────────────────────────────────
  const renderProgress = () => (
    <View style={styles.progressWrap}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={styles.progressSegment}>
          <View style={[styles.progressBar, i <= step && styles.progressBarActive]} />
          {i === step && (
            <Text style={styles.progressLabel}>{STEP_LABELS[i]}</Text>
          )}
        </View>
      ))}
    </View>
  );

  // ── Step 0: Language ─────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Image source={require('../assets/logo.png')} style={styles.heroLogo} resizeMode="contain" />
      <Text style={styles.heroTitle}>Climbing Trainer</Text>
      <Text style={styles.heroSub}>by climbing.ge</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step0_title')}</Text>

      {(['en', 'ka'] as AppLanguage[]).map(lang => (
        <TouchableOpacity
          key={lang}
          style={[styles.langCard, selectedLang === lang && styles.langCardActive]}
          onPress={() => pickLanguage(lang)}
          activeOpacity={0.8}
        >
          <Text style={styles.langFlag}>{lang === 'en' ? '🇬🇧' : '🇬🇪'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.langName, selectedLang === lang && styles.langNameActive]}>
              {lang === 'en' ? 'English' : 'ქართული'}
            </Text>
            <Text style={styles.langNative}>{lang === 'en' ? 'English' : 'Georgian'}</Text>
          </View>
          {selectedLang === lang && <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ── Step 1: About You ────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepEmoji}>👋</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step1_title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step1_sub')}</Text>

      <Text style={styles.questionLabel}>{t('onboarding.age')}</Text>
      <Stepper value={age} onDec={() => setAge(a => Math.max(10, a - 1))} onInc={() => setAge(a => Math.min(90, a + 1))} unit="years" />

      <Text style={styles.questionLabel}>{t('onboarding.sex')}</Text>
      <View style={styles.sexRow}>
        {SEX_OPTIONS.map(opt => {
          const active = sex === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.sexCard, active && styles.sexCardActive]}
              onPress={() => setSex(opt.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.sexEmoji}>{opt.emoji}</Text>
              <Text style={[styles.sexLabel, active && styles.sexLabelActive]}>
                {t(`onboarding.${opt.labelKey}` as any)}
              </Text>
              {active && <View style={styles.sexCheck}><Text style={styles.checkText}>✓</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.measureRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.questionLabel}>{t('onboarding.weight')}</Text>
          <Stepper value={weight} onDec={() => setWeight(w => Math.max(30, w - 1))} onInc={() => setWeight(w => Math.min(200, w + 1))} unit="kg" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.questionLabel}>{t('onboarding.height')}</Text>
          <Stepper value={height} onDec={() => setHeight(h => Math.max(100, h - 1))} onInc={() => setHeight(h => Math.min(250, h + 1))} unit="cm" />
        </View>
      </View>
    </ScrollView>
  );

  // ── Step 2: Equipment ────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepEmoji}>🏋️</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step2_title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step2_sub')}</Text>

      <View style={styles.equipGrid}>
        {ALL_EQUIPMENT.map(opt => {
          const active = equipment.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.equipCard, active && styles.equipCardActive]}
              onPress={() => toggleEquipment(opt.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.equipEmoji}>{opt.emoji}</Text>
              <Text style={[styles.equipLabel, active && styles.equipLabelActive]}>
                {t(`onboarding.${opt.labelKey}` as any)}
              </Text>
              <Text style={styles.equipDesc}>
                {t(`onboarding.${opt.descKey}` as any)}
              </Text>
              {active && <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      {equipment.includes('fingerboard') && (
        <View style={styles.boardHint}>
          <Text style={styles.boardHintIcon}>🏔️</Text>
          <Text style={styles.boardHintText}>{t('onboarding.board_preview_sub')}</Text>
        </View>
      )}

      {hasWall && (
        <View style={styles.wallSection}>
          <Text style={styles.questionLabel}>{t('onboarding.wall_angle')}</Text>
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

      {equipment.length === 0 && (
        <TouchableOpacity style={styles.noEquipBtn} onPress={() => setStep(3)}>
          <Text style={styles.noEquipTitle}>{t('onboarding.skip_equip')}</Text>
          <Text style={styles.noEquipSub}>{t('onboarding.skip_equip_sub')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  // ── Step 3: Climbing Experience ──────────────────────────────────────────────
  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepEmoji}>🧗</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step3_title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step3_sub')}</Text>

      <View style={styles.expGrid}>
        {EXPERIENCE_OPTIONS.map(opt => {
          const active = experienceYears === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.expCard, active && styles.expCardActive]}
              onPress={() => setExperienceYears(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.expEmoji}>{opt.emoji}</Text>
              <Text style={[styles.expTitle, active && styles.expTitleActive]}>
                {t(`onboarding.${opt.titleKey}` as any)}
              </Text>
              <Text style={styles.expGrade}>{opt.gradeHint}</Text>
              {active && <View style={styles.checkBadge}><Text style={styles.checkText}>✓</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.questionLabel}>
        {t('onboarding.grade')}{'  '}
        <Text style={styles.optional}>{t('onboarding.grade_optional')}</Text>
      </Text>
      <TextInput
        style={styles.gradeInput}
        value={climbingGrade}
        onChangeText={setClimbingGrade}
        placeholder={t('onboarding.grade_placeholder')}
        placeholderTextColor="#444"
        autoCapitalize="none"
        maxLength={10}
      />
      <Text style={styles.hint}>{t('onboarding.grade_hint')}</Text>
    </ScrollView>
  );

  // ── Step 4: AI Setup ─────────────────────────────────────────────────────────
  const renderStep4 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepEmoji}>🤖</Text>
      <Text style={styles.stepTitle}>{t('onboarding.step4_title')}</Text>
      <Text style={styles.stepSub}>{t('onboarding.step4_sub')}</Text>

      <View style={styles.aiBenefitsList}>
        {(['ai_benefit_1', 'ai_benefit_2', 'ai_benefit_3', 'ai_benefit_4'] as const).map(key => (
          <View key={key} style={styles.aiBenefitRow}>
            <Text style={styles.aiBenefitText}>{t(`onboarding.${key}` as any)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.apiCard}>
        <Text style={styles.apiCardTitle}>{t('onboarding.api_what_title')}</Text>
        <Text style={styles.apiCardText}>{t('onboarding.api_what_text')}</Text>
      </View>

      <Text style={styles.questionLabel}>
        {t('onboarding.api_key_label')}{'  '}
        <Text style={styles.optional}>{t('onboarding.api_key_optional')}</Text>
      </Text>
      <TextInput
        style={[styles.gradeInput, styles.apiInput]}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder={t('onboarding.api_key_placeholder')}
        placeholderTextColor="#444"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>{t('onboarding.api_key_hint')}</Text>

      <TouchableOpacity style={styles.skipBtn} onPress={finish}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          {renderProgress()}
        </View>

        <View style={{ flex: 1 }}>
          {steps[step]?.()}
        </View>

        {step > 0 && (
          <View style={styles.footer}>
            {step > 1 && (
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
                {saving ? t('onboarding.saving') : step === TOTAL_STEPS - 1 ? t('onboarding.finish') : t('onboarding.continue')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },

  // Progress
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  progressWrap: { flexDirection: 'row', gap: 5 },
  progressSegment: { flex: 1, alignItems: 'center' },
  progressBar: { height: 4, width: '100%', backgroundColor: '#2d2d2d', borderRadius: 2 },
  progressBarActive: { backgroundColor: '#4ecdc4' },
  progressLabel: { color: '#4ecdc4', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },

  stepContent: { padding: 24, paddingBottom: 24 },
  stepEmoji: { fontSize: 44, marginBottom: 10 },
  stepTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  stepSub: { color: '#666', fontSize: 14, lineHeight: 21, marginBottom: 28 },
  questionLabel: { color: '#aaa', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12, textAlign: 'center' },
  optional: { color: '#444', fontWeight: '400' },
  hint: { color: '#444', fontSize: 12, lineHeight: 18, marginTop: -8, marginBottom: 16 },

  // Step 0
  heroLogo: { width: 80, height: 80, marginBottom: 8, alignSelf: 'center' },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 2 },
  heroSub: { color: '#4ecdc4', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 32 },
  langCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#222',
    borderRadius: 18, padding: 22, marginBottom: 14, borderWidth: 1.5, borderColor: '#2d2d2d',
  },
  langCardActive: { backgroundColor: '#0f2018', borderColor: '#4ecdc4' },
  langFlag: { fontSize: 44, marginRight: 18 },
  langName: { color: '#ccc', fontSize: 22, fontWeight: '800' },
  langNative: { color: '#555', fontSize: 13, marginTop: 2 },
  langNameActive: { color: '#4ecdc4' },

  // Step 1
  sexRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  sexCard: {
    flex: 1, alignItems: 'center', backgroundColor: '#222',
    borderRadius: 16, paddingVertical: 18, borderWidth: 1.5, borderColor: '#2d2d2d', position: 'relative',
  },
  sexCardActive: { backgroundColor: '#0f2018', borderColor: '#4ecdc4' },
  sexEmoji: { fontSize: 28, marginBottom: 6 },
  sexLabel: { color: '#666', fontSize: 13, fontWeight: '700' },
  sexLabelActive: { color: '#4ecdc4' },
  sexCheck: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#4ecdc4', borderRadius: 9, width: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  measureRow: { flexDirection: 'row', gap: 10 },

  // Step 2
  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  equipCard: {
    width: '47%', backgroundColor: '#222', borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#2d2d2d', position: 'relative', minHeight: 110,
  },
  equipCardActive: { backgroundColor: '#0f2018', borderColor: '#4ecdc4' },
  equipEmoji: { fontSize: 30, marginBottom: 8 },
  equipLabel: { color: '#bbb', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  equipLabelActive: { color: '#4ecdc4' },
  equipDesc: { color: '#555', fontSize: 11, lineHeight: 16 },
  boardHint: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0f2018', borderRadius: 12, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#4ecdc422',
  },
  boardHintIcon: { fontSize: 20 },
  boardHintText: { color: '#4ecdc4', fontSize: 12, flex: 1 },
  wallSection: { marginBottom: 12 },
  wallSub: { color: '#555', fontSize: 12, marginTop: -8, marginBottom: 12, textAlign: 'center' },
  degreeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  degChip: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#252525', borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  degChipActive: { backgroundColor: '#0f2018', borderColor: '#4ecdc4' },
  degText: { color: '#666', fontSize: 13, fontWeight: '600' },
  degTextActive: { color: '#4ecdc4' },
  noEquipBtn: {
    marginTop: 8, borderRadius: 14, paddingVertical: 18,
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2d2d2d', alignItems: 'center',
  },
  noEquipTitle: { color: '#666', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  noEquipSub: { color: '#444', fontSize: 12 },

  // Step 3
  expGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  expCard: {
    width: '47%', backgroundColor: '#222', borderRadius: 18, padding: 16, minHeight: 120,
    borderWidth: 1.5, borderColor: '#2d2d2d', position: 'relative', alignItems: 'center',
  },
  expCardActive: { backgroundColor: '#0f2018', borderColor: '#4ecdc4' },
  expEmoji: { fontSize: 32, marginBottom: 8 },
  expTitle: { color: '#aaa', fontSize: 14, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  expTitleActive: { color: '#4ecdc4' },
  expGrade: { color: '#555', fontSize: 11, textAlign: 'center' },
  gradeInput: {
    backgroundColor: '#1e1e1e', color: '#fff', borderRadius: 14,
    padding: 16, fontSize: 16, borderWidth: 1.5, borderColor: '#2d2d2d', marginBottom: 8,
  },

  // Step 4
  aiBenefitsList: { backgroundColor: '#1a2a1a', borderRadius: 16, padding: 16, marginBottom: 20, gap: 10 },
  aiBenefitRow: { flexDirection: 'row', alignItems: 'center' },
  aiBenefitText: { color: '#ccc', fontSize: 14 },
  apiCard: {
    backgroundColor: '#1e2535', borderRadius: 14, padding: 16, marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: '#4ecdc4',
  },
  apiCardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  apiCardText: { color: '#888', fontSize: 13, lineHeight: 20 },
  apiInput: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },
  skipBtn: { alignItems: 'center', paddingVertical: 16 },
  skipText: { color: '#444', fontSize: 13, textDecorationLine: 'underline' },

  // Shared
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#4ecdc4', borderRadius: 10, width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: '#1a1a1a', fontSize: 11, fontWeight: '900' },

  // Footer
  footer: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  backBtn: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#222', borderRadius: 14, justifyContent: 'center', borderWidth: 1, borderColor: '#2d2d2d',
  },
  backText: { color: '#666', fontSize: 15, fontWeight: '600' },
  nextBtn: { flex: 1, backgroundColor: '#4ecdc4', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: { color: '#1a1a1a', fontSize: 16, fontWeight: '800' },
});
