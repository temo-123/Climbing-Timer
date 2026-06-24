import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { HistoryEntry } from '../types/models';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { TYPE_EMOJIS, localizedWorkout } from '../data/presetPlans';
import Footer from '../components/Footer';

type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;
type Phase = 'prepare' | 'hang' | 'rest' | 'recover';

export default function TimerScreen({ route, navigation }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { workout } = route.params;
  const workoutType = workout.type || 'fingerboard';
  const workoutName = localizedWorkout(workout, lang).name;

  const getPhaseLabel = (phase: Phase, type: string): string => {
    if (phase === 'prepare') return t('timer.get_ready');
    if (phase === 'hang') {
      if (type === 'campus') return t('timer.move');
      if (type === 'flexibility') return t('timer.stretch');
      if (type === 'strength') return t('timer.work');
      if (type === 'endurance') return t('timer.traverse');
      return t('timer.hang');
    }
    if (phase === 'rest') return t('timer.rest');
    return t('timer.recover');
  };

  const [timeLeft, setTimeLeft] = useState(12);
  const [phase, setPhase] = useState<Phase>('prepare');
  const [isRunning, setIsRunning] = useState(false);
  const [currentRep, setCurrentRep] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentDuration, setCurrentDuration] = useState(12);
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('prepare');
  const currentRepRef = useRef(1);
  const currentSetRef = useRef(1);

  phaseRef.current = phase;
  currentRepRef.current = currentRep;
  currentSetRef.current = currentSet;

  const reps = workout.reps || 6;
  const sets = workout.sets || 4;
  const hangTime = workout.hangTime || 7;
  const restTime = workout.restTime || 3;
  const recoverTime = workout.recoverTime || 180;

  const prevPhaseRef = useRef<Phase>('prepare');
  useEffect(() => {
    if (phase !== prevPhaseRef.current) {
      prevPhaseRef.current = phase;
      if (phase === 'hang') Vibration.vibrate([0, 150, 80, 150]);
      else if (phase === 'rest' || phase === 'recover') Vibration.vibrate(250);
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
    const colors: Record<Phase, string> = { prepare: '#ffa502', hang: '#ff4757', rest: '#3742fa', recover: '#2ed573' };
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

  const finishWorkout = useCallback(async () => {
    setIsRunning(false);
    await saveHistory('success', reps, sets);
    Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    setIsFinished(true);
  }, [workout, reps, sets]);

  const resetWorkout = useCallback(() => {
    setIsRunning(false);
    Speech.stop();
    if (currentSetRef.current > 1 || currentRepRef.current > 1) {
      saveHistory('failed', currentRepRef.current - 1, currentSetRef.current - 1);
    }
    setTimeLeft(12); setPhase('prepare'); setCurrentDuration(12);
    setCurrentRep(1); setCurrentSet(1); setIsFinished(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [workout]);

  const stopWorkout = useCallback(() => {
    setIsRunning(false);
    Speech.stop();
    saveHistory('failed', currentRepRef.current - 1, currentSetRef.current - 1);
    Alert.alert(t('timer.stopped_title'), t('timer.stopped_msg'));
    navigation.navigate('Home' as any);
  }, [workout, navigation, t]);

  const skipPhase = useCallback(() => {
    const currPhase = phaseRef.current;
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
  }, [reps, sets, hangTime, restTime, recoverTime, finishWorkout]);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => { if (prev) Speech.stop(); return !prev; });
  }, []);

  useEffect(() => {
    if (isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            const currPhase = phaseRef.current;
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
  }, [isRunning, isFinished, hangTime, restTime, recoverTime, reps, sets, finishWorkout]);

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
            <Text style={globalStyles.congratsStats}>{t('common.reps_x_sets', { reps, sets })}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          {!isRunning && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={globalStyles.backText}>{t('timer.back')}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.workoutName}>{workoutName}</Text>
          <Text style={styles.typeTag}>{TYPE_EMOJIS[workoutType]}</Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={[globalStyles.phase, { color: phaseColor }]}>{phaseLabel}</Text>
          <Animated.View style={[styles.timeContainer, { opacity: blinkAnim }]}>
            <Svg width={320} height={320} style={{ position: 'absolute' }}>
              <Circle cx="160" cy="160" r="145" stroke="#333" strokeWidth="10" fill="none" strokeOpacity="0.4" />
              <Circle cx="160" cy="160" r="145" stroke={phaseColor} strokeWidth="10" fill="none"
                strokeLinecap="round" strokeDasharray="911" strokeDashoffset={progress * 911}
                rotation="-90" origin="160,160" />
            </Svg>
            <Text style={[globalStyles.time, { color: phaseColor }]}>{formatTime(timeLeft)}</Text>
          </Animated.View>
          <View style={styles.rounds}>
            <Text style={[styles.roundText, { color: phaseColor }]}>
              {phase === 'prepare'
                ? t('timer.preparation')
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  workoutName: { color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  typeTag: { fontSize: 22 },
  timerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timeContainer: { width: 320, height: 320, alignItems: 'center', justifyContent: 'center' },
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
