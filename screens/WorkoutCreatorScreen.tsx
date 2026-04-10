import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  CreateWorkout: undefined;
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateWorkout'>;

interface Workout {
  id: string;
  name: string;
  hangTime: number;
  restTime: number;
  reps: number;
  sets: number;
  recoverTime: number;
}

export default function WorkoutCreatorScreen() {
  const [name, setName] = useState('');
  const [hangTime, setHangTime] = useState('240');
  const [restTime, setRestTime] = useState('240');
  const [reps, setReps] = useState('6');
  const [sets, setSets] = useState('4');
  const [recoverTime, setRecoverTime] = useState('180');
  const navigation = useNavigation<NavigationProp>();

  const saveWorkout = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Workout name is required');
      return;
    }

    const workout: Workout = {
      id: Date.now().toString(),
      name: name.trim(),
      hangTime: parseInt(hangTime) || 240,
      restTime: parseInt(restTime) || 240,
      reps: parseInt(reps) || 6,
      sets: parseInt(sets) || 4,
      recoverTime: parseInt(recoverTime) || 180,
    };

    try {
      const stored = await AsyncStorage.getItem('workouts');
      const workouts: Workout[] = stored ? JSON.parse(stored) : [];
      workouts.push(workout);
      await AsyncStorage.setItem('workouts', JSON.stringify(workouts));
      Alert.alert('Success', 'Workout saved!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Create New Workout</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., 4/4 x6"
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hang Time (seconds)</Text>
          <TextInput
            style={styles.input}
            value={hangTime}
            onChangeText={setHangTime}
            keyboardType="numeric"
            placeholder="240"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rest Time (seconds)</Text>
          <TextInput
            style={styles.input}
            value={restTime}
            onChangeText={setRestTime}
            keyboardType="numeric"
            placeholder="240"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reps</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            placeholder="6"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sets</Text>
          <TextInput
            style={styles.input}
            value={sets}
            onChangeText={setSets}
            keyboardType="numeric"
            placeholder="4"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recover Time (seconds)</Text>
          <TextInput
            style={styles.input}
            value={recoverTime}
            onChangeText={setRecoverTime}
            keyboardType="numeric"
            placeholder="180"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveWorkout}>
          <Text style={styles.saveButtonText}>Save Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    padding: 30,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2d2d2d',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#4ecdc4',
  },
  saveButton: {
    backgroundColor: '#4ecdc4',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

