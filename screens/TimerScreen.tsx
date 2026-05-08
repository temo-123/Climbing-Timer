import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import Footer from '../components/Footer';


type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;

interface Workout {
  hangTime: number;
  restTime: number;
  reps: number;
  sets: number;
  recoverTime: number;
  name: string;
  id: string;
}

type Phase = 'prepare' | 'hang' | 'rest' | 'recover';

interface HistoryEntry {
  date: string;
  workoutName: string;
  repsCompleted: number;
  setsCompleted: number;
  status: 'success' | 'failed';
}

export default function TimerScreen({ route, navigation }: Props) {
  const { workout } = route.params;

  const [timeLeft, setTimeLeft] = useState(12);
  const [phase, setPhase] = useState<Phase>('prepare');
  const [isRunning, setIsRunning] = useState(false);
  const [currentRep, setCurrentRep] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentDuration, setCurrentDuration] = useState(12);
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef<Phase>('prepare');
  const currentRepRef = useRef(1);
  const currentSetRef = useRef(1);
  const isRunningRef = useRef(false);

  phaseRef.current = phase;
  currentRepRef.current = currentRep;
  currentSetRef.current = currentSet;
  isRunningRef.current = isRunning;

  const reps = workout.reps || 6;
  const sets = workout.sets || 4;
  const hangTime = workout.hangTime || 240;
  const restTime = workout.restTime || 240;
  const recoverTime = workout.recoverTime || 180;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (ph: Phase): string => {
    const colors: Record<Phase, string> = {
      prepare: '#ffa502',
      hang: '#ff4757',
      rest: '#3742fa',
      recover: '#2ed573',
    };
    return colors[ph] || '#fff';
  };

  const progress = currentDuration > 0 ? 1 - timeLeft / currentDuration : 0;

  const saveHistory = async (status: 'success' | 'failed') => {
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      workoutName: workout.name,
      repsCompleted: currentRepRef.current - 1,
      setsCompleted: currentSetRef.current - 1,
      status,
    };
    try {
      const stored = await AsyncStorage.getItem('history');
      const history: HistoryEntry[] = stored ? JSON.parse(stored) : [];
      history.push(entry);
      await AsyncStorage.setItem('history', JSON.stringify(history));
    } catch (error) {
      console.log('History save error:', error);
    }
  };

  const finishWorkout = useCallback(() => {
    setIsRunning(false);
    saveHistory('success');
    setIsFinished(true);
  }, [workout]);

  const resetWorkout = useCallback(() => {
    setIsRunning(false);
    if (currentSet > 1 || currentRep > 1) {
      saveHistory('failed');
    }
    setTimeLeft(12);
    setPhase('prepare');
    setCurrentDuration(12);
    setCurrentRep(1);
    setCurrentSet(1);
    setIsFinished(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [workout]);

  const stopWorkout = useCallback(() => {
    setIsRunning(false);
    saveHistory('failed');
    Alert.alert('Workout Stopped', 'Workout marked as failed and saved to history.');
    navigation.navigate('Home' as any);
  }, [workout, navigation]);

  const skipPhase = useCallback(() => {
    const currPhase = phaseRef.current;
    const currRep = currentRepRef.current;
    const currSet = currentSetRef.current;

    if (currPhase === 'hang') {
      // End hang, start rest
      setPhase('rest');
      phaseRef.current = 'rest';
      setCurrentDuration(restTime);
      setTimeLeft(restTime);
    } else if (currPhase === 'rest') {
      // End rest, next rep hang
      if (currRep < reps) {
        setPhase('hang');
        phaseRef.current = 'hang';
        currentRepRef.current = currRep + 1;
        setCurrentRep(currRep + 1);
        setCurrentDuration(hangTime);
        setTimeLeft(hangTime);
      } else {
        // End set, start recover
        if (currSet < sets) {
          setPhase('recover');
          phaseRef.current = 'recover';
          setCurrentRep(1);
          setCurrentDuration(recoverTime);
          setTimeLeft(recoverTime);
        } else {
          // Last set complete
          finishWorkout();
        }
      }
    } else if (currPhase === 'recover') {
      // End recover, next set hang
      setPhase('hang');
      phaseRef.current = 'hang';
      currentSetRef.current = currSet + 1;
      setCurrentSet(currSet + 1);
      setCurrentRep(1);
      setCurrentDuration(hangTime);
      setTimeLeft(hangTime);
    }
  }, [reps, sets, hangTime, restTime, recoverTime, finishWorkout]);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => {
      isRunningRef.current = !prev;
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            const currPhase = phaseRef.current;
            const currRep = currentRepRef.current;
            const currSet = currentSetRef.current;

            if (currPhase === 'prepare') {
              setPhase('hang');
              phaseRef.current = 'hang';
              setCurrentDuration(hangTime);
              return hangTime;
            } else if (currPhase === 'hang') {
              if (currRep < reps) {
                setPhase('rest');
                phaseRef.current = 'rest';
                setCurrentDuration(restTime);
                currentRepRef.current = currRep + 1;
                setCurrentRep(currRep + 1);
                return restTime;
              } else {
                if (currSet < sets) {
                  setPhase('recover');
                  phaseRef.current = 'recover';
                  setCurrentRep(1);
                  setCurrentDuration(recoverTime);
                  currentSetRef.current = currSet + 1;
                  setCurrentSet(currSet + 1);
                  return recoverTime;
                } else {
                  finishWorkout();
                  return 0;
                }
              }
            } else if (currPhase === 'rest') {
              setPhase('hang');
              phaseRef.current = 'hang';
              setCurrentDuration(hangTime);
              return hangTime;
            } else if (currPhase === 'recover') {
              setPhase('hang');
              phaseRef.current = 'hang';
              currentSetRef.current = currSet + 1;
              setCurrentSet(currSet + 1);
              setCurrentRep(1);
              setCurrentDuration(hangTime);
              return hangTime;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isFinished, hangTime, restTime, recoverTime, reps, sets, finishWorkout]);

  if (isFinished) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#1a1a1a" />
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Home' as any)}>
              <Text style={globalStyles.backText}>← Home</Text>
            </TouchableOpacity>
            <Text style={styles.workoutName}>{workout.name} - Complete!</Text>
          </View>

          <View style={styles.congratsContainer}>
            <Text style={globalStyles.congratsTitle}>🎉 CONGRATULATIONS! 🎉</Text>
            <Text style={globalStyles.congratsStats}>
              Completed {sets} sets x {reps} reps
            </Text>
            <Text style={styles.congratsSub}>Great job on your climb session!</Text>
          </View>

          <View style={styles.congratsButtons}>
            <TouchableOpacity style={[globalStyles.button, styles.congratsButton]} onPress={() => navigation.navigate('Home' as any)}>
              <Text style={globalStyles.buttonText}>🏠 Back to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.button, styles.congratsButton]} onPress={() => navigation.navigate('History' as any)}>
              <Text style={globalStyles.buttonText}>📊 View History</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          {!isRunning ? (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={globalStyles.backText}>← Back</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.workoutName}>{workout.name}</Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={[globalStyles.phase, { color: getPhaseColor(phase) }]}>{phase === 'prepare' ? 'GET READY' : phase.toUpperCase()}</Text>
          <View style={styles.timeContainer}>
            <Svg width={320} height={320} style={{ position: 'absolute' }}>
              <Circle cx="160" cy="160" r="145" stroke="#333" strokeWidth="10" fill="none" strokeOpacity="0.4" />
              <Circle 
                cx="160" cy="160" r="145" 
                stroke={getPhaseColor(phase)} strokeWidth="10" fill="none" 
                strokeLinecap="round" strokeDasharray="911" strokeDashoffset={progress * 911} 
                rotation="-90" origin="160,160"
              />
            </Svg>
            <Text style={[globalStyles.time, { color: getPhaseColor(phase) }]}>{formatTime(timeLeft)}</Text>
          </View>
          <View style={styles.rounds}>
            <Text style={[styles.roundText, { color: getPhaseColor(phase) }]}>{phase === 'prepare' ? 'Preparation' : `Rep ${currentRep}/${reps} | Set ${currentSet}/${sets}`}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[globalStyles.button, styles.controlButton]} onPress={toggleRunning}>
            <Text style={globalStyles.buttonText}>{isRunning ? '⏸️ PAUSE' : '▶️ START'}</Text>
          </TouchableOpacity>
          {isRunning && (
            <TouchableOpacity style={[globalStyles.buttonSecondary, styles.controlButton]} onPress={stopWorkout}>
              <Text style={globalStyles.buttonText}>⛔ STOP</Text>
            </TouchableOpacity>
          )}
          <View style={styles.bottomRow}>
            <TouchableOpacity style={[styles.halfButton, styles.leftHalf]} onPress={resetWorkout}>
              <Text style={styles.halfButtonText}>🔄 Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.halfButton, styles.rightHalf]} onPress={skipPhase}>
              <Text style={styles.halfButtonText}>⏭️ Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  workoutName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginLeft: 10,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeContainer: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rounds: {
    marginTop: 20,
  },
  roundText: {
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  controlButton: {
    width: '100%',
    marginBottom: 0,
  },
  skipButton: {
    backgroundColor: '#ff9500',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftHalf: {
    backgroundColor: '#ff6b6b',
  },
  rightHalf: {
    backgroundColor: '#ff9500',
  },
  halfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  congratsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  congratsButtons: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 15,
  },
  congratsButton: {
    width: '100%',
    marginBottom: 0,
  },
  congratsSub: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
  },
});
