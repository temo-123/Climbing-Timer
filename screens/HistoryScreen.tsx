import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from '../components/Footer';
import { globalStyles } from '../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface HistoryEntry {
  date: string;
  workoutName: string;
  repsCompleted: number;
  setsCompleted: number;
}

const screenWidth = Dimensions.get('window').width;

type RootStackParamList = {
  History: undefined;
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('history');
      const parsed: HistoryEntry[] = stored ? JSON.parse(stored) : [];
      setHistory(parsed.reverse().slice(0, 30));
    } catch (error) {
      console.log('History load error:', error);
    }
  };

  const getDailyData = () => {
    const daily: { day: string; sessions: number; maxSessions: number }[] = [];
    const today = new Date();
    const maxS = 5;
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const count = history.filter(h => {
        const hDate = new Date(h.date);
        return hDate.toDateString() === date.toDateString();
      }).length;
      daily.push({ day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), sessions: count, maxSessions: maxS });
    }
    return daily;
  };

  const getMonthlyData = () => {
    const monthly: { month: string; reps: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const totalReps = history
        .filter(h => {
          const hDate = new Date(h.date);
          return hDate.getMonth() === date.getMonth() && hDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, h) => sum + h.repsCompleted, 0);
      monthly.push({ month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), reps: totalReps });
    }
    return monthly;
  };

  const renderBar = (value: number, max: number, color: string) => {
    const width = (value / max) * (screenWidth - 80);
    return (
      <View style={[styles.bar, { backgroundColor: color, width: Math.max(20, width) }]} />
    );
  };

  const dailyData = getDailyData();
  const monthlyData = getMonthlyData();

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={globalStyles.title}>Workout History ({history.length} sessions)</Text>
      </View>
      <View style={globalStyles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={globalStyles.sectionTitle}>Sessions by Day (Last Week)</Text>
          <View style={styles.chartContainer}>
            {dailyData.map((data, index) => (
              <View key={index} style={styles.dailyItem}>
                <Text style={styles.dayLabel}>{data.day}</Text>
                {renderBar(data.sessions, data.maxSessions, '#4ecdc4')}
                <Text style={styles.valueLabel}>{data.sessions}</Text>
              </View>
            ))}
          </View>

          <Text style={globalStyles.sectionTitle}>Total Reps by Month (Last 6 Months)</Text>
          <View style={styles.chartContainer}>
            {monthlyData.map((data, index) => (
              <View key={index} style={styles.monthlyItem}>
                <Text style={styles.monthLabel}>{data.month}</Text>
                {renderBar(data.reps, 500, '#ff6b6b')}
                <Text style={styles.valueLabel}>{data.reps} reps</Text>
              </View>
            ))}
          </View>

          <Text style={styles.recent}>Recent Sessions</Text>
          {history.slice(0, 10).map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyDate}>{new Date(entry.date).toLocaleString()}</Text>
              <Text style={styles.historyWorkout}>{entry.workoutName}</Text>
              <Text style={styles.historyStats}>{entry.repsCompleted} reps x {entry.setsCompleted} sets</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  chartContainer: {
    alignItems: 'stretch',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 10,
  },
  dayLabel: {
    color: '#fff',
    fontSize: 16,
    width: 80,
    fontWeight: '600',
  },
  monthlyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 10,
  },
  monthLabel: {
    color: '#fff',
    fontSize: 16,
    width: 100,
    fontWeight: '600',
  },
  bar: {
    height: 25,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  valueLabel: {
    color: '#aaa',
    fontSize: 16,
    minWidth: 50,
    textAlign: 'right',
  },
  recent: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: '#2d2d2d',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
  },
  historyDate: {
    color: '#aaa',
    fontSize: 14,
  },
  historyWorkout: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyStats: {
    color: '#4ecdc4',
    fontSize: 14,
    marginTop: 2,
  },
});

