import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  LoadWorkouts: undefined;
  Timer: { workout: any };
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoadWorkouts'>;

interface Workout {
  id: string;
  name: string;
  hangTime: number;
  restTime: number;
  reps: number;
  sets: number;
  recoverTime: number;
}

export default function WorkoutsListScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const stored = await AsyncStorage.getItem('workouts');
      const parsed: Workout[] = stored ? JSON.parse(stored) : [];
      setWorkouts(parsed);
    } catch (error) {
      Alert.alert('Error', 'Failed to load workouts');
    }
  };

  const startWorkout = (workout: Workout) => {
    navigation.navigate('Timer', { workout });
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.workoutItem}>
      <Text style={styles.workoutName}>{item.name}</Text>
      <Text style={styles.workoutDetails}>
        Hang {item.hangTime / 60}m / Rest {item.restTime / 60}m x{item.reps} reps | {item.sets} sets | Recover {item.recoverTime / 60}m
      </Text>
      <TouchableOpacity style={styles.startButton} onPress={() => startWorkout(item)}>
        <Text style={styles.startButtonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Workouts</Text>
      {workouts.length === 0 ? (
        <Text style={styles.emptyText}>No workouts saved. Create one first!</Text>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkout}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  list: {
    padding: 20,
  },
  workoutItem: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  workoutName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  workoutDetails: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#4ecdc4',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

