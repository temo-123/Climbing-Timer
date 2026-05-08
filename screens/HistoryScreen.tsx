import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from '../components/Footer';
import { globalStyles } from '../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface HistoryEntry {
  date: string;
  workoutName: string;
  repsCompleted: number;
  setsCompleted: number;
  status: 'success' | 'failed';
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('history');
      const parsed: HistoryEntry[] = stored ? JSON.parse(stored) : [];
      setHistory(parsed.reverse());
    } catch (error) {
      console.log('History load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    Alert.alert('Clear History', 'Delete all workout history? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('history');
            setHistory([]);
          } catch (error) {
            console.log('Clear history error:', error);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={globalStyles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={globalStyles.title}>Workout History</Text>
        </View>
        <View style={[globalStyles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#aaa', fontSize: 18 }}>Loading history...</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={globalStyles.title}>Workout History ({history.filter(h => h.status === 'success').length}/{history.length})</Text>
      </View>
      <View style={globalStyles.content}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {history.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Text style={{ color: '#aaa', fontSize: 18, textAlign: 'center' }}>
                No workout history yet.
              </Text>
              <Text style={{ color: '#aaa', fontSize: 16, marginTop: 10 }}>
                Complete a workout to see your progress here.
              </Text>
            </View>
          ) : (
            <>
              <Text style={globalStyles.sectionTitle}>Recent Sessions</Text>
              {history.slice(0, 10).map((entry, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyDate}>{new Date(entry.date).toLocaleString()}</Text>
                  <Text style={styles.historyWorkout}>{entry.workoutName}</Text>
                  <Text style={styles.historyStats}>
                    {entry.repsCompleted} reps x {entry.setsCompleted} sets {entry.status === 'success' ? '✅' : '❌'}
                  </Text>
                </View>
              ))}
              <TouchableOpacity style={[globalStyles.buttonSecondary, styles.clearButton]} onPress={clearHistory}>
                <Text style={globalStyles.buttonText}>Clear All History</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 2,
  },
  historyStats: {
    color: '#4ecdc4',
    fontSize: 14,
    marginTop: 4,
  },
  clearButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
});
