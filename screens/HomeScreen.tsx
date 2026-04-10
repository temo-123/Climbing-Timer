import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Footer from '../components/Footer';
import { globalStyles } from '../styles/globalStyles';

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
    <SafeAreaView style={globalStyles.container}>
      <View style={[globalStyles.content, { alignItems: 'center' }]}>
        <Text style={globalStyles.title}>Climbing Timer</Text>
        <TouchableOpacity style={globalStyles.button} onPress={goToLoad}>
          <Text style={globalStyles.buttonText}>Load my workouts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={globalStyles.button} onPress={goToCreate}>
          <Text style={globalStyles.buttonText}>Create and save new workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={globalStyles.button} onPress={goToHistory}>
          <Text style={globalStyles.buttonText}>My workouts history</Text>
        </TouchableOpacity>
      </View>
      <Footer />
    </SafeAreaView>
  );



}



