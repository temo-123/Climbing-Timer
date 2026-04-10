import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface TimerSettings {
  workTime: number; // seconds
  restTime: number;
  totalRounds: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workTime: 240, // 4 min
  restTime: 240,
  totalRounds: 6,
};

export default function App() {
  const [timeLeft, setTimeLeft] = useState(240);
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(settings.workTime);
    setPhase('work');
    setCurrentRound(1);
  }, [settings.workTime]);

  const adjustSetting = useCallback((key: keyof TimerSettings, delta: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: Math.max(10, Math.min(1800, prev[key] + delta * 30)), // 10s-30min, 30s steps
    }));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time up: switch phase or finish
            if (phase === 'work') {
              if (currentRound < settings.totalRounds) {
                setPhase('rest');
                setCurrentRound(prevRound => prevRound + 1);
                return settings.restTime;
              } else {
                Alert.alert('Session Complete!', 'Great job!');
                setIsRunning(false);
                return 0;
              }
            } else {
              setPhase('work');
              return settings.workTime;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, phase, currentRound, settings]);

  useEffect(() => {
    if (phase === 'work') {
      setTimeLeft(settings.workTime);
    } else {
      setTimeLeft(settings.restTime);
    }
  }, [settings, phase]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      
      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={styles.phase}>{phase.toUpperCase()}</Text>
        <Text style={styles.time}>{formatTime(timeLeft)}</Text>
        <View style={styles.rounds}>
          <Text style={styles.roundText}>Round {currentRound} / {settings.totalRounds}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleRunning}>
          <Text style={styles.buttonText}>{isRunning ? 'PAUSE' : 'START'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={reset}>
          <Text style={styles.buttonTextSecondary}>RESET</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={styles.settings}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Work</Text>
          <View style={styles.adjusters}>
            <TouchableOpacity style={styles.adjustButton} onPress={() => adjustSetting('workTime', -1)}>
              <Text style={styles.adjustText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.settingValue}>{formatTime(settings.workTime)}</Text>
            <TouchableOpacity style={styles.adjustButton} onPress={() => adjustSetting('workTime', 1)}>
              <Text style={styles.adjustText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Rest</Text>
          <View style={styles.adjusters}>
            <TouchableOpacity style={styles.adjustButton} onPress={() => adjustSetting('restTime', -1)}>
              <Text style={styles.adjustText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.settingValue}>{formatTime(settings.restTime)}</Text>
            <TouchableOpacity style={styles.adjustButton} onPress={() => adjustSetting('restTime', 1)}>
              <Text style={styles.adjustText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Rounds</Text>
          <View style={styles.adjusters}>
            <TouchableOpacity style={styles.adjustButton} onPress={() => adjustSetting('totalRounds', -1)}>
              <Text style={styles.adjustText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.settingValue}>{settings.totalRounds}</Text>
            <TouchableOpacity style={styles.adjustButton} onPress={() => adjustSetting('totalRounds', 1)}>
              <Text style={styles.adjustText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
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
  controls: {
    padding: 30,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 50,
    marginBottom: 15,
    minWidth: 150,
  },
  buttonSecondary: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 50,
    minWidth: 150,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settings: {
    padding: 20,
    backgroundColor: '#2d2d2d',
    margin: 20,
    borderRadius: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 18,
    color: '#fff',
    minWidth: 80,
    textAlign: 'center',
  },
  adjusters: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustButton: {
    backgroundColor: '#4ecdc4',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  adjustText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

