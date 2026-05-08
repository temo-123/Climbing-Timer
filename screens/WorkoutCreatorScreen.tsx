import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Footer from '../components/Footer';
import { globalStyles } from '../styles/globalStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateWorkout'>;

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

export default function WorkoutCreatorScreen() {
  const [name, setName] = useState('');
  const [hangTime, setHangTime] = useState('240');
  const [restTime, setRestTime] = useState('240');
  const [reps, setReps] = useState('6');
const [sets, setSets] = useState('4');
  const [recoverTime, setRecoverTime] = useState('180');
  const [description, setDescription] = useState('');

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
      description: description.trim() || '',
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

  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={globalStyles.title}>Create New Workout</Text>
      </View>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          
          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Name</Text>
            <TextInput
              style={globalStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., 4/4 x6"
              placeholderTextColor="#aaa"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Description (optional)</Text>
            <TextInput
              style={globalStyles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes about this workout..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Hang Time (seconds)</Text>
            <TextInput
              style={globalStyles.input}
              value={hangTime}
              onChangeText={setHangTime}
              keyboardType="numeric"
              placeholder="240"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Rest Time (seconds)</Text>
            <TextInput
              style={globalStyles.input}
              value={restTime}
              onChangeText={setRestTime}
              keyboardType="numeric"
              placeholder="240"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Reps</Text>
            <TextInput
              style={globalStyles.input}
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              placeholder="6"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Sets</Text>
            <TextInput
              style={globalStyles.input}
              value={sets}
              onChangeText={setSets}
              keyboardType="numeric"
              placeholder="4"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>Recover Time (seconds)</Text>
            <TextInput
              style={globalStyles.input}
              value={recoverTime}
              onChangeText={setRecoverTime}
              keyboardType="numeric"
              placeholder="180"
              returnKeyType="next"
            />
          </View>

          <TouchableOpacity style={globalStyles.button} onPress={saveWorkout}>
            <Text style={globalStyles.buttonText}>Save Workout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Footer />
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
  inputGroup: {
    marginBottom: 25,
  },
});

