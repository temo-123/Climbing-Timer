import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import WorkoutCreatorScreen from './screens/WorkoutCreatorScreen';
import WorkoutsListScreen from './screens/WorkoutsListScreen';
import HistoryScreen from './screens/HistoryScreen';
import TimerScreen from './screens/TimerScreen';

import { RootStackParamList } from './types/navigation';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateWorkout" component={WorkoutCreatorScreen} />
          <Stack.Screen name="LoadWorkouts" component={WorkoutsListScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Timer" component={TimerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

