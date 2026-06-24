import './utils/i18n'; // must be imported before any screen
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './screens/HomeScreen';
import WorkoutCreatorScreen from './screens/WorkoutCreatorScreen';
import WorkoutsListScreen from './screens/WorkoutsListScreen';
import HistoryScreen from './screens/HistoryScreen';
import TimerScreen from './screens/TimerScreen';
import TrainingPlansScreen from './screens/TrainingPlansScreen';
import PlanDetailScreen from './screens/PlanDetailScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import CustomTrainingScreen from './screens/CustomTrainingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AITrainingScreen from './screens/AITrainingScreen';

import { RootStackParamList } from './types/navigation';
import { initNotifications } from './utils/notifications';
import { loadStoredLanguage } from './utils/i18n';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'Home' | 'Onboarding' | null>(null);

  useEffect(() => {
    initNotifications();
    loadStoredLanguage();
    AsyncStorage.getItem('userProfile').then(v => {
      setInitialRoute(v ? 'Home' : 'Onboarding');
    }).catch(() => setInitialRoute('Home'));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4ecdc4" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateWorkout" component={WorkoutCreatorScreen} />
          <Stack.Screen name="LoadWorkouts" component={WorkoutsListScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Timer" component={TimerScreen} />
          <Stack.Screen name="TrainingPlans" component={TrainingPlansScreen} />
          <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="CustomTraining" component={CustomTrainingScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="AITraining" component={AITrainingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
