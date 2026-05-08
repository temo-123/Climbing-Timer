import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Footer from '../components/Footer';
import { globalStyles } from '../styles/globalStyles';


type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoadWorkouts'>;

interface Workout {
  id: string;
  name: string;
  description?: string;
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

  const deleteWorkout = async (workoutId: string, workoutName: string) => {
    Alert.alert(
      'Delete Workout',
      `Delete "${workoutName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem('workouts');
              const workouts: Workout[] = stored ? JSON.parse(stored) : [];
              const updated = workouts.filter(w => w.id !== workoutId);
              await AsyncStorage.setItem('workouts', JSON.stringify(updated));
              loadWorkouts(); // Reload list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.workoutItem}>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutName}>{item.name}</Text>
        <Text style={styles.workoutDetails}>
          Hang {item.hangTime / 60}m / Rest {item.restTime / 60}m x{item.reps} reps | {item.sets} sets | Recover {item.recoverTime / 60}m
        </Text>
        {item.description ? (
          <Text style={styles.workoutDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <View style={styles.workoutActions}>
        <TouchableOpacity 
          style={[styles.deleteButton, styles.smallButton]} 
          onPress={() => deleteWorkout(item.id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.startButton, styles.largeButton]} onPress={() => startWorkout(item)}>
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={globalStyles.title}>My Workouts ({workouts.length})</Text>
      </View>
      <View style={globalStyles.content}>
        <FlatList
          data={workouts}
          renderItem={renderWorkout}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
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
  workoutInfo: {
    flex: 1,
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
    marginBottom: 5,
  },
  workoutDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  workoutActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  smallButton: {
    flex: 0.2,
    margin: 4,
  },
  largeButton: {
    flex: 0.8,
    margin: 4,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 10,
    // minWidth: 40,
    // height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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


