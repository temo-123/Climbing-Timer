import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Footer from '../components/Footer';

type RootStackParamList = {
  Timer: { workout: any };
};

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

type Phase = 'hang' | 'rest' | 'recover';

interface HistoryEntry {
  date: string;
  workoutName: string;
  repsCompleted: number;
  setsCompleted: number;
}

export default function TimerScreen({ route, navigation }: Props) {
  const { workout } = route.params;

  const [timeLeft, setTimeLeft] = useState(workout.hangTime || 240);
  const [phase, setPhase] = useState<Phase>('hang');
  const [isRunning, setIsRunning] = useState(false);
  const [currentRep, setCurrentRep] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef<Phase>('hang');
  const currentRepRef = useRef(1);
  const currentSetRef = useRef(1);
  const isRunningRef = useRef(false);

  phaseRef.current = phase;
  currentRepRef.current = currentRep;
  currentSetRef.current = currentSet;
  isRunningRef.current = isRunning;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => {
      isRunningRef.current = !prev;
      return !prev;
    });
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(workout.hangTime || 240);
    setPhase('hang');
    setCurrentRep(1);
    setCurrentSet(1);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [workout.hangTime]);

  const skipRep = useCallback(() => {
    const currPhase = phaseRef.current;
    const currRep = currentRepRef.current;
    const reps = workout.reps || 6;
    if (currPhase === 'hang') {
      setPhase('rest');
      phaseRef.current = 'rest';
      setTimeLeft(workout.restTime || 240);
    } else if (currRep < reps) {
      setPhase('hang');
      phaseRef.current = 'hang';
      currentRepRef.current = currRep + 1;
      setCurrentRep(currRep + 1);
      setTimeLeft(workout.hangTime || 240);
    }
  }, [workout]);

  const skipSet = useCallback(() => {
    const currSet = currentSetRef.current;
    const sets = workout.sets || 4;
    if (currSet < sets) {
      setCurrentRep(1);
      currentRepRef.current = 1;
      currentSetRef.current = currSet + 1;
      setCurrentSet(currSet + 1);
      setPhase('hang');
      phaseRef.current = 'hang';
      setTimeLeft(workout.hangTime || 240);
    }
  }, [workout]);

  const saveHistory = async () => {
    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      workoutName: workout.name,
      repsCompleted: currentRepRef.current - 1,
      setsCompleted: currentSetRef.current - 1,
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

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime: number) => {
          if (prevTime <= 1) {
            const currPhase = phaseRef.current;
            const currRep = currentRepRef.current;
            const currSet = currentSetRef.current;
            const reps = workout.reps || 6;
            const sets = workout.sets || 4;

            if (currPhase === 'hang') {
              if (currRep < reps) {
                phaseRef.current = 'rest';
                setPhase('rest');
                currentRepRef.current = currRep + 1;
                setCurrentRep(currRep + 1);
                return workout.restTime || 240;
              } else {
                phaseRef.current = 'recover';
                setPhase('recover');
                setCurrentRep(1);
                if (currSet < sets) {
                  currentSetRef.current = currSet + 1;
                  setCurrentSet(currSet + 1);
                  return workout.recoverTime || 180;
                } else {
                  setIsRunning(false);
                  saveHistory();
                  Alert.alert('Session Complete!', 'Great job!');
                  navigation.goBack();
                  return 0;
                }
              }
            } else if (currPhase === 'rest') {
              phaseRef.current = 'hang';
              setPhase('hang');
              return workout.hangTime || 240;
            } else { // recover
              phaseRef.current = 'hang';
              setPhase('hang');
              setCurrentRep(1);
              currentSetRef.current = currSet + 1;
              setCurrentSet(currSet + 1);
              return workout.hangTime || 240;
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
  }, [isRunning, workout, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.workoutName}>{workout.name}</Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.phase}>{phase.toUpperCase()}</Text>
          <Text style={styles.time}>{formatTime(timeLeft)}</Text>
          <View style={styles.rounds}>
            <Text style={styles.roundText}>Rep {currentRep} / {workout.reps || 6} | Set {currentSet} / {workout.sets || 4}</Text>
          </View>
        </View>

        <View style={styles.controlsTop}>
          <TouchableOpacity style={styles.button} onPress={toggleRunning}>
            <Text style={styles.buttonText}>{isRunning ? 'PAUSE' : 'START'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={reset}>
            <Text style={styles.buttonTextSecondary}>RESET</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlsBottom}>
          <TouchableOpacity style={styles.skipButtonSmall} onPress={skipRep}>
            <Text style={styles.skipTextSmall}>Skip Rep</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButtonSmall} onPress={skipSet}>
            <Text style={styles.skipTextSmall}>Skip Set</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by climbing.ge</Text>
      </View>
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
  backText: {
    color: '#4ecdc4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  workoutName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginLeft: 10,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phase: {
    fontSize: 24,
    color: '#ff6b6b',
    marginBottom: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 96,
    color: '#fff',
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  rounds: {
    marginTop: 20,
  },
  roundText: {
    fontSize: 20,
    color: '#aaa',
  },
  controlsTop: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  controlsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  skipButtonSmall: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 10,
  },
  skipTextSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    marginTop: 30,
  },
  footerText: {
    color: '#aaa',
    fontSize: 14,
  },
});
