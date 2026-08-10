import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { HistoryEntry } from '../types/models';
import { TYPE_EMOJIS } from '../data/constants';
import Footer from '../components/Footer';
import { globalStyles } from '../styles/globalStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  const loadHistory = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('history');
      const parsed: HistoryEntry[] = stored ? JSON.parse(stored) : [];
      setHistory([...parsed].reverse());
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const clearHistory = async () => {
    Alert.alert(t('history.clear_title'), t('history.clear_msg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('history.clear_btn'),
        style: 'destructive',
        onPress: async () => { await AsyncStorage.removeItem('history'); setHistory([]); },
      },
    ]);
  };

  const successCount = history.filter(h => h.status === 'success').length;
  const thisMonth = history.filter(h => {
    const d = new Date(h.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={globalStyles.backText}>{t('common.back')}</Text></TouchableOpacity>
          <Text style={[globalStyles.title, styles.headerTitle]}>{t('history.title')}</Text>
          <View style={globalStyles.headerSpacer} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#aaa', fontSize: 16 }}>{t('common.loading')}</Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={globalStyles.backText}>{t('common.back')}</Text></TouchableOpacity>
        <Text style={[globalStyles.title, styles.headerTitle]}>{t('history.title')}</Text>
        <View style={globalStyles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {history.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{history.length}</Text>
              <Text style={styles.statLbl}>{t('history.total')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{successCount}</Text>
              <Text style={styles.statLbl}>{t('history.completed')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{thisMonth}</Text>
              <Text style={styles.statLbl}>{t('history.this_month')}</Text>
            </View>
            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Analytics')}>
              <Text style={[styles.statVal, { color: '#4ecdc4' }]}>→</Text>
              <Text style={[styles.statLbl, { color: '#4ecdc4' }]}>{t('history.analytics')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>{t('history.empty_title')}</Text>
            <Text style={styles.emptyText}>{t('history.empty_text')}</Text>
          </View>
        ) : (
          <>
            {history.map((entry, index) => {
              const typeEmoji = entry.workoutType ? (TYPE_EMOJIS[entry.workoutType] || '🏋️') : '🏋️';
              const dateObj = new Date(entry.date);
              const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
              const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

              return (
                <View key={index} style={[styles.historyItem, entry.status === 'failed' && styles.historyItemFailed]}>
                  <View style={styles.historyLeft}><Text style={styles.historyEmoji}>{typeEmoji}</Text></View>
                  <View style={styles.historyCenter}>
                    <Text style={styles.historyName}>{entry.workoutName}</Text>
                    <Text style={styles.historyStats}>{t('common.reps_x_sets', { reps: entry.repsCompleted, sets: entry.setsCompleted })}</Text>
                    <Text style={styles.historyDate}>{dateStr} {t('history.at_time')} {timeStr}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.statusIcon}>{entry.status === 'success' ? '✅' : '❌'}</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
              <Text style={styles.clearButtonText}>{t('history.clear_all')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 22, marginBottom: 0, paddingTop: 0, flex: 1, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: '#2d2d2d', borderRadius: 14, padding: 14, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLbl: { color: '#888', fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#aaa', fontSize: 14, textAlign: 'center' },
  historyItem: { flexDirection: 'row', backgroundColor: '#2d2d2d', borderRadius: 12, padding: 14, marginBottom: 10, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#2ed573' },
  historyItemFailed: { borderLeftColor: '#ff6b6b' },
  historyLeft: { marginRight: 12 },
  historyEmoji: { fontSize: 26 },
  historyCenter: { flex: 1 },
  historyName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  historyStats: { color: '#4ecdc4', fontSize: 13, marginBottom: 2 },
  historyDate: { color: '#888', fontSize: 12 },
  historyRight: { marginLeft: 10 },
  statusIcon: { fontSize: 20 },
  clearButton: { borderWidth: 1, borderColor: '#ff6b6b', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  clearButtonText: { color: '#ff6b6b', fontSize: 14, fontWeight: '600' },
});
