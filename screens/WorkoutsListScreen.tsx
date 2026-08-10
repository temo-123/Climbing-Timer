import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { Workout } from '../types/models';
import { TYPE_EMOJIS } from '../data/constants';
import Footer from '../components/Footer';
import { globalStyles } from '../styles/globalStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoadWorkouts'>;

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const calcTotalDuration = (w: Workout): number =>
  12 + w.sets * (w.reps * w.hangTime + (w.reps - 1) * w.restTime) + (w.sets - 1) * w.recoverTime;

export default function WorkoutsListScreen() {
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const navigation = useNavigation<NavigationProp>();

  useFocusEffect(useCallback(() => { loadWorkouts(); }, []));

  const loadWorkouts = async () => {
    try {
      const stored = await AsyncStorage.getItem('workouts');
      setWorkouts(stored ? JSON.parse(stored) : []);
    } catch {
      Alert.alert(t('common.error'), t('workouts.load_error'));
    }
  };

  const deleteWorkout = async (workoutId: string, workoutName: string) => {
    Alert.alert(t('workouts.delete_title'), t('workouts.delete_msg', { name: workoutName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const stored = await AsyncStorage.getItem('workouts');
            const list: Workout[] = stored ? JSON.parse(stored) : [];
            await AsyncStorage.setItem('workouts', JSON.stringify(list.filter(w => w.id !== workoutId)));
            loadWorkouts();
          } catch {
            Alert.alert(t('common.error'), t('workouts.delete_error'));
          }
        },
      },
    ]);
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.workoutItem}>
      <View style={styles.workoutInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>{TYPE_EMOJIS[item.type || 'fingerboard']}</Text>
          <Text style={styles.workoutName}>{item.name}</Text>
        </View>
        <Text style={styles.workoutDetails}>
          {t('workouts.hang')} {formatDuration(item.hangTime)} · {t('workouts.rest')} {formatDuration(item.restTime)} · {t('common.reps_x_sets', { reps: item.reps, sets: item.sets })} · {t('workouts.recover')} {formatDuration(item.recoverTime)}
        </Text>
        <Text style={styles.workoutTotal}>{t('workouts.total', { duration: formatDuration(calcTotalDuration(item)) })}</Text>
        {item.description ? <Text style={styles.workoutDescription} numberOfLines={2}>{item.description}</Text> : null}
      </View>
      <View style={styles.workoutActions}>
        <TouchableOpacity style={[styles.deleteButton, styles.smallButton]} onPress={() => deleteWorkout(item.id, item.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.startButton, styles.largeButton]} onPress={() => navigation.navigate('Timer', { workout: item })}>
          <Text style={styles.startButtonText}>{t('workouts.start')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('workouts.title', { n: workouts.length })}</Text>
        <View style={globalStyles.headerSpacer} />
      </View>
      <View style={globalStyles.content}>
        <FlatList
          data={workouts}
          renderItem={renderWorkout}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('workouts.empty')}</Text>
              <Text style={styles.emptySubText}>{t('workouts.empty_sub')}</Text>
            </View>
          }
        />
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  list: { padding: 20 },
  workoutItem: { backgroundColor: '#2d2d2d', padding: 20, borderRadius: 15, marginBottom: 15 },
  workoutInfo: { flex: 1 },
  workoutName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  workoutDetails: { color: '#aaa', fontSize: 16, marginBottom: 5 },
  workoutDescription: { color: '#ccc', fontSize: 14, marginBottom: 10, fontStyle: 'italic' },
  workoutTotal: { color: '#4ecdc4', fontSize: 13, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#aaa', fontSize: 18, textAlign: 'center' },
  emptySubText: { color: '#666', fontSize: 15, marginTop: 8 },
  workoutActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 },
  smallButton: { flex: 0.2, margin: 4 },
  largeButton: { flex: 0.8, margin: 4 },
  deleteButton: { backgroundColor: '#ff6b6b', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  startButton: { backgroundColor: '#4ecdc4', padding: 12, borderRadius: 10, alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
