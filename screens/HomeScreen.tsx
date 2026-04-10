import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  CreateWorkout: undefined;
  LoadWorkouts: undefined;
  History: undefined;
  Timer: { workout: any };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const goToCreate = () => navigation.navigate('CreateWorkout');
  const goToLoad = () => navigation.navigate('LoadWorkouts');
  const goToHistory = () => navigation.navigate('History');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Climbing Timer</Text>
      <TouchableOpacity style={styles.button} onPress={goToLoad}>
        <Text style={styles.buttonText}>Load my workouts</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={goToCreate}>
        <Text style={styles.buttonText}>Create and save new workout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={goToHistory}>
        <Text style={styles.buttonText}>My workouts history</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

