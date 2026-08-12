import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration, Animated, LayoutChangeEvent } from 'react-native';
import * as Speech from 'expo-speech';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { HistoryEntry, StepPhase } from '../types/models';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { TYPE_EMOJIS, localizedWorkout, getWorkoutPreviewImage } from '../data/constants';
import Footer from '../components/Footer';
import TopAlignedImage from '../components/TopAlignedImage';

type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;
type Phase = StepPhase;

export default function TimerScreen({ route, navigation }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { workout } = route.params;
  const workoutType = workout.type || 'fingerboard';
  const workoutName = localizedWorkout(workout, lang).name;

  // Ordered steps from the training API — when present, the timer walks this
  // list directly instead of computing the sequence from hangTime/restTime/reps/sets.
  const sortedSteps = useMemo(
    () => (workout.steps && workout.steps.length > 0 ? [...workout.steps].sort((a, b) => a.order - b.order) : []),
    [workout.steps]
  );
  const stepsMode = sortedSteps.length > 0;

  const getPhaseLabel = (phase: Phase, type: string): string => {
    if (phase === 'prepare') return t('timer.get_ready');
    if (phase === 'rest') return t('timer.rest');
    if (phase === 'recover') return t('timer.recover');
    if (phase === 'work') return t('timer.work');
    if (phase === 'stretch') return t('timer.stretch');
    // phase === 'hang' in legacy (formula-driven) mode reads its label from the workout type
    if (type === 'campus') return t('timer.move');
    if (type === 'flexibility') return t('timer.stretch');
    if (type === 'strength') return t('timer.work');
    if (type === 'endurance') return t('timer.traverse');
    return t('timer.hang');
  };

  const [timeLeft, setTimeLeft] = useState(12);
  const [phase, setPhase] = useState<Phase>('prepare');
  const [isRunning, setIsRunning] = useState(false);
  const [currentRep, setCurrentRep] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentDuration, setCurrentDuration] = useState(12);
  const [isFinished, setIsFinished] = useState(false);

  // The countdown circle's diameter is derived from whatever vertical space
  // is actually left over (this section is the only flexible one — banner,
  // title bar, and controls are all fixed/content-sized), rather than a
  // fixed pixel size that fits some phones and clips others (e.g. the extra
  // Stop button that appears while running eats into this on small screens).
  const [circleSize, setCircleSize] = useState(200);
  const onTimerSectionLayout = useCallback((e: LayoutChangeEvent) => {
    const available = e.nativeEvent.layout.height;
    // ~90px is the phase label + rounds label + their margins — whatever's
    // left is the circle's budget. Floor is a legibility limit, not a nice
    // target: on the tightest devices/states (e.g. a small phone once the
    // extra Stop button appears) there just isn't much room, and a slightly
    // undersized circle beats one that overlaps the title bar above it.
    const reserved = 90;
    setCircleSize(Math.min(220, Math.max(70, Math.round(available - reserved))));
  }, []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('prepare');
  const currentRepRef = useRef(1);
  const currentSetRef = useRef(1);
  const currentStepIndexRef = useRef(-1);

  phaseRef.current = phase;
  currentRepRef.current = currentRep;
  currentSetRef.current = currentSet;
  currentStepIndexRef.current = currentStepIndex;

  const reps = workout.reps || 6;
  const sets = workout.sets || 4;
  const hangTime = workout.hangTime || 7;
  const restTime = workout.restTime || 3;
  const recoverTime = workout.recoverTime || 180;

  const prevPhaseRef = useRef<Phase>('prepare');
  useEffect(() => {
    if (phase !== prevPhaseRef.current) {
      prevPhaseRef.current = phase;
      if (phase === 'hang' || phase === 'work') Vibration.vibrate([0, 150, 80, 150]);
      else if (phase === 'rest' || phase === 'recover' || phase === 'stretch') Vibration.vibrate(250);
    }
  }, [phase]);

  const blinkAnim = useRef(new Animated.Value(1)).current;
  const blinkLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    const isCountdown = isRunning && !isFinished && phase !== 'prepare' && timeLeft <= 3 && timeLeft > 0;
    if (isCountdown) {
      blinkLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.15, duration: 250, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ])
      );
      blinkLoopRef.current.start();
    } else {
      blinkLoopRef.current?.stop();
      blinkAnim.setValue(1);
    }
    return () => { blinkLoopRef.current?.stop(); };
  }, [timeLeft, isRunning, isFinished, phase]);

  useEffect(() => {
    if (isRunning && !isFinished && phase !== 'prepare' && timeLeft >= 1 && timeLeft <= 4) {
      Speech.speak(String(timeLeft), { rate: 1.2, pitch: 1.0 });
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (ph: Phase): string => {
    const colors: Record<Phase, string> = {
      prepare: '#ffa502', hang: '#ff4757', rest: '#3742fa', recover: '#2ed573', work: '#ff4757', stretch: '#2ed573',
    };
    return colors[ph] || '#fff';
  };

  const progress = currentDuration > 0 ? 1 - timeLeft / currentDuration : 0;

  const saveHistory = async (status: 'success' | 'failed', repsDone: number, setsDone: number) => {
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      workoutName: workoutName,
      workoutType: workoutType as any,
      repsCompleted: repsDone,
      setsCompleted: setsDone,
      status,
    };
    try {
      const stored = await AsyncStorage.getItem('history');
      const history: HistoryEntry[] = stored ? JSON.parse(stored) : [];
      history.push(entry);
      await AsyncStorage.setItem('history', JSON.stringify(history));
    } catch { /* ignore */ }
  };

  // For step-mode workouts, "reps/sets completed" reads as "steps completed / total steps".
  const getProgressCounts = useCallback((): { repsDone: number; setsDone: number } => {
    if (stepsMode) {
      const doneSteps = Math.max(currentStepIndexRef.current, 0);
      return { repsDone: doneSteps, setsDone: doneSteps > 0 ? 1 : 0 };
    }
    return { repsDone: currentRepRef.current - 1, setsDone: currentSetRef.current - 1 };
  }, [stepsMode]);

  const finishWorkout = useCallback(async () => {
    setIsRunning(false);
    await saveHistory('success', reps, sets);
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    setIsFinished(true);
  }, [workout, reps, sets]);

  const resetWorkout = useCallback(() => {
    setIsRunning(false);
    Speech.stop();
    const hadProgress = stepsMode ? currentStepIndexRef.current > 0 : (currentSetRef.current > 1 || currentRepRef.current > 1);
    if (hadProgress) {
      const { repsDone, setsDone } = getProgressCounts();
      saveHistory('failed', repsDone, setsDone);
    }
    setTimeLeft(12); setPhase('prepare'); setCurrentDuration(12);
    setCurrentRep(1); setCurrentSet(1); setCurrentStepIndex(-1); setIsFinished(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [workout, stepsMode, getProgressCounts]);

  const stopWorkout = useCallback(() => {
    setIsRunning(false);
    Speech.stop();
    const { repsDone, setsDone } = getProgressCounts();
    saveHistory('failed', repsDone, setsDone);
    Alert.alert(t('timer.stopped_title'), t('timer.stopped_msg'));
    navigation.navigate('Home' as any);
  }, [workout, navigation, t, getProgressCounts]);

  const advanceToStep = useCallback((idx: number) => {
    const step = sortedSteps[idx];
    setPhase(step.phase); phaseRef.current = step.phase;
    setCurrentStepIndex(idx); currentStepIndexRef.current = idx;
    setCurrentDuration(step.durationSeconds); setTimeLeft(step.durationSeconds);
  }, [sortedSteps]);

  const skipPhase = useCallback(() => {
    const currPhase = phaseRef.current;

    if (stepsMode) {
      const nextIdx = currPhase === 'prepare' ? 0 : currentStepIndexRef.current + 1;
      if (nextIdx < sortedSteps.length) advanceToStep(nextIdx);
      else finishWorkout();
      return;
    }

    const currRep = currentRepRef.current;
    const currSet = currentSetRef.current;
    if (currPhase === 'prepare') {
      setPhase('hang'); phaseRef.current = 'hang'; setCurrentDuration(hangTime); setTimeLeft(hangTime);
    } else if (currPhase === 'hang') {
      setPhase('rest'); phaseRef.current = 'rest'; setCurrentDuration(restTime); setTimeLeft(restTime);
    } else if (currPhase === 'rest') {
      if (currRep < reps) {
        setPhase('hang'); phaseRef.current = 'hang';
        currentRepRef.current = currRep + 1; setCurrentRep(currRep + 1);
        setCurrentDuration(hangTime); setTimeLeft(hangTime);
      } else if (currSet < sets) {
        setPhase('recover'); phaseRef.current = 'recover'; setCurrentRep(1);
        setCurrentDuration(recoverTime); setTimeLeft(recoverTime);
      } else { finishWorkout(); }
    } else if (currPhase === 'recover') {
      setPhase('hang'); phaseRef.current = 'hang';
      currentSetRef.current = currSet + 1; setCurrentSet(currSet + 1);
      setCurrentRep(1); setCurrentDuration(hangTime); setTimeLeft(hangTime);
    }
  }, [stepsMode, sortedSteps, advanceToStep, reps, sets, hangTime, restTime, recoverTime, finishWorkout]);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => { if (prev) Speech.stop(); return !prev; });
  }, []);

  useEffect(() => {
    if (isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            const currPhase = phaseRef.current;

            if (stepsMode) {
              const nextIdx = currPhase === 'prepare' ? 0 : currentStepIndexRef.current + 1;
              if (nextIdx < sortedSteps.length) {
                const step = sortedSteps[nextIdx];
                setPhase(step.phase); phaseRef.current = step.phase;
                setCurrentStepIndex(nextIdx); currentStepIndexRef.current = nextIdx;
                setCurrentDuration(step.durationSeconds);
                return step.durationSeconds;
              }
              finishWorkout();
              return 0;
            }

            const currRep = currentRepRef.current;
            const currSet = currentSetRef.current;
            if (currPhase === 'prepare') {
              setPhase('hang'); phaseRef.current = 'hang'; setCurrentDuration(hangTime); return hangTime;
            } else if (currPhase === 'hang') {
              if (currRep < reps) {
                setPhase('rest'); phaseRef.current = 'rest'; setCurrentDuration(restTime);
                currentRepRef.current = currRep + 1; setCurrentRep(currRep + 1); return restTime;
              } else if (currSet < sets) {
                setPhase('recover'); phaseRef.current = 'recover'; setCurrentRep(1); setCurrentDuration(recoverTime);
                currentSetRef.current = currSet + 1; setCurrentSet(currSet + 1); return recoverTime;
              } else { finishWorkout(); return 0; }
            } else if (currPhase === 'rest') {
              setPhase('hang'); phaseRef.current = 'hang'; setCurrentDuration(hangTime); return hangTime;
            } else if (currPhase === 'recover') {
              setPhase('hang'); phaseRef.current = 'hang';
              currentSetRef.current = currSet + 1; setCurrentSet(currSet + 1);
              setCurrentRep(1); setCurrentDuration(hangTime); return hangTime;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isFinished, stepsMode, sortedSteps, hangTime, restTime, recoverTime, reps, sets, finishWorkout]);

  if (isFinished) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#1a1a1a" />
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Home' as any)}>
              <Text style={globalStyles.backText}>{t('timer.back_home')}</Text>
            </TouchableOpacity>
            <Text style={styles.workoutName}>{workoutName}</Text>
          </View>
          <View style={styles.congratsContainer}>
            <Text style={{ fontSize: 64, marginBottom: 10 }}>🎉</Text>
            <Text style={globalStyles.congratsTitle}>{t('timer.completed')}</Text>
            <Text style={globalStyles.congratsStats}>
              {stepsMode ? t('timer.steps_completed', { n: sortedSteps.length }) : t('common.reps_x_sets', { reps, sets })}
            </Text>
            <Text style={styles.typeBadge}>{TYPE_EMOJIS[workoutType]} {workoutType.charAt(0).toUpperCase() + workoutType.slice(1)}</Text>
            <Text style={styles.congratsSub}>{t('timer.great_session')}</Text>
          </View>
          <View style={styles.congratsButtons}>
            <TouchableOpacity style={[globalStyles.button, styles.fullButton]} onPress={() => navigation.navigate('Home' as any)}>
              <Text style={globalStyles.buttonText}>{t('timer.btn_home')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.button, styles.fullButton]} onPress={() => navigation.navigate('Analytics' as any)}>
              <Text style={globalStyles.buttonText}>{t('timer.btn_progress')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  const phaseLabel = getPhaseLabel(phase, workoutType);
  const phaseColor = getPhaseColor(phase);
  const currentStep = stepsMode && currentStepIndex >= 0 ? sortedSteps[currentStepIndex] : null;
  // Once a specific step is active, show only *that* step's photo (or no
  // photo at all) — falling back to some other step's image here would mean
  // silently redisplaying an old, unrelated photo for every step that
  // doesn't have its own (real trainings are often only partially
  // photographed), which reads as the image being "stuck" or wrong. The
  // workout-level preview is only used before a step is active yet (prepare).
  const bannerImage = currentStep ? currentStep.imageUrl : getWorkoutPreviewImage(workout);

  const strokeWidth = 9;
  const radius = circleSize / 2 - 15;
  const circumference = 2 * Math.PI * radius;
  const timeFontSize = Math.round(circleSize * 0.28);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <View style={styles.mainContent}>
        <View style={styles.banner}>
          {bannerImage ? (
            <TopAlignedImage uri={bannerImage} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.bannerPlaceholder]}>
              <Text style={styles.bannerPlaceholderEmoji}>{TYPE_EMOJIS[workoutType]}</Text>
            </View>
          )}
          {!isRunning && (
            <TouchableOpacity style={styles.bannerBackBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.bannerBackText}>{t('timer.back')}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.bannerTypeTag}><Text style={styles.bannerTypeTagText}>{TYPE_EMOJIS[workoutType]}</Text></View>
        </View>
        <View style={styles.titleBar}>
          <Text style={styles.titleBarText} numberOfLines={1}>{workoutName}</Text>
        </View>

        <View style={styles.timerSection} onLayout={onTimerSectionLayout}>
          <Text style={[globalStyles.phase, { color: phaseColor }]}>{currentStep?.label || phaseLabel}</Text>
          <Animated.View style={[{ width: circleSize, height: circleSize, alignItems: 'center', justifyContent: 'center' }, { opacity: blinkAnim }]}>
            <Svg width={circleSize} height={circleSize} style={{ position: 'absolute' }}>
              <Circle cx={circleSize / 2} cy={circleSize / 2} r={radius} stroke="#333" strokeWidth={strokeWidth} fill="none" strokeOpacity="0.4" />
              <Circle cx={circleSize / 2} cy={circleSize / 2} r={radius} stroke={phaseColor} strokeWidth={strokeWidth} fill="none"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progress * circumference}
                rotation="-90" origin={`${circleSize / 2},${circleSize / 2}`} />
            </Svg>
            <Text style={[globalStyles.time, { color: phaseColor, fontSize: timeFontSize }]}>{formatTime(timeLeft)}</Text>
          </Animated.View>
          <View style={styles.rounds}>
            <Text style={[styles.roundText, { color: phaseColor }]}>
              {phase === 'prepare'
                ? t('timer.preparation')
                : stepsMode
                  ? t('timer.step_of', { current: currentStepIndex + 1, total: sortedSteps.length })
                  : t('timer.rep_set', { rep: currentRep, reps, set: currentSet, sets })}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[globalStyles.button, styles.controlButton]} onPress={toggleRunning}>
            <Text style={globalStyles.buttonText}>{isRunning ? t('timer.pause') : t('timer.start_btn')}</Text>
          </TouchableOpacity>
          {isRunning && (
            <TouchableOpacity style={[globalStyles.buttonSecondary, styles.controlButton]} onPress={stopWorkout}>
              <Text style={globalStyles.buttonText}>{t('timer.stop_btn')}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.bottomRow}>
            <TouchableOpacity style={[styles.halfButton, styles.leftHalf]} onPress={resetWorkout}>
              <Text style={styles.halfButtonText}>{t('timer.reset_btn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.halfButton, styles.rightHalf]} onPress={skipPhase}>
              <Text style={styles.halfButtonText}>{t('timer.skip_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  mainContent: { flex: 1 },
  // 16:9 like the training list/modal images, inset as a card (not full-bleed
  // to the top) — the countdown circle below is shrunk to compensate so the
  // controls still never require scrolling to reach.
  banner: {
    aspectRatio: 16 / 9, backgroundColor: '#1e2530', overflow: 'hidden',
    marginTop: 16, marginHorizontal: 16, borderRadius: 16,
  },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e2530' },
  bannerPlaceholderEmoji: { fontSize: 56, opacity: 0.5 },
  bannerBackBtn: {
    position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7,
  },
  bannerBackText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bannerTypeTag: {
    position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  bannerTypeTagText: { fontSize: 16 },
  titleBar: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  titleBarText: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  workoutName: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  timerSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rounds: { marginTop: 20 },
  roundText: { fontSize: 20, textAlign: 'center', fontWeight: '600' },
  controls: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  controlButton: { width: '100%', marginBottom: 0 },
  bottomRow: { flexDirection: 'row', gap: 10 },
  halfButton: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  leftHalf: { backgroundColor: '#ff6b6b' },
  rightHalf: { backgroundColor: '#ff9500' },
  halfButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  congratsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  typeBadge: { color: '#4ecdc4', fontSize: 16, fontWeight: '600', marginTop: 6, marginBottom: 10 },
  congratsSub: { fontSize: 16, color: '#aaa', textAlign: 'center', marginTop: 4, marginBottom: 40 },
  congratsButtons: { width: '100%', paddingHorizontal: 20, gap: 12, paddingBottom: 10 },
  fullButton: { width: '100%', marginBottom: 0 },
});
