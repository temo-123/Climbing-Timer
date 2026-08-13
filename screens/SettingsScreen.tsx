import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { TrainingPlan } from '../types/models';
import { getApiBaseUrl } from '../utils/api';
import { AuthUser, getStoredUser, logout } from '../utils/auth';
import { cancelNotifications } from '../utils/notifications';
import { removePlanFromCalendar } from '../utils/calendar';
import { globalStyles } from '../styles/globalStyles';
import MenuButton from '../components/MenuButton';
import Footer from '../components/Footer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [apiUrl, setApiUrl] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => { getApiBaseUrl().then(setApiUrl); }, []);

  // Refresh on focus, not just mount — picks up login/logout that happened on
  // the Login/Register screens the user just navigated back from.
  useFocusEffect(useCallback(() => { getStoredUser().then(setAuthUser); }, []));

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout_title'),
      t('settings.logout_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.logout_btn'), style: 'destructive', onPress: async () => { await logout(); setAuthUser(null); } },
      ]
    );
  };

  const resetApp = async () => {
    try {
      const plansRaw = await AsyncStorage.getItem('plans');
      const plans: TrainingPlan[] = plansRaw ? JSON.parse(plansRaw) : [];
      for (const plan of plans) {
        if (plan.notificationIds?.length) await cancelNotifications(plan.notificationIds);
        if (plan.calendarEventIds?.length) await removePlanFromCalendar(plan.calendarEventIds);
      }
    } catch { /* best effort — still wipe storage even if cleanup fails */ }

    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  const confirmReset = () => {
    Alert.alert(
      t('settings.reset_title'),
      t('settings.reset_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.reset_btn'), style: 'destructive', onPress: resetApp },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={globalStyles.header}>
        <MenuButton align="left" />
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>{t('settings.account_section')}</Text>
        {authUser ? (
          <>
            <Text style={styles.loggedInText}>{t('settings.logged_in_as', { name: authUser.name })}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>{t('settings.logout_btn')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.hint}>{t('settings.account_hint')}</Text>
            <View style={styles.accountRow}>
              <TouchableOpacity style={styles.accountButton} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.accountButtonText}>{t('settings.login_btn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.accountButton, styles.accountButtonSecondary]} onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.accountButtonText, styles.accountButtonTextSecondary]}>{t('settings.register_btn')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, styles.apiSectionLabel]}>{t('settings.api_section')}</Text>
        <Text style={styles.hint}>{t('settings.api_hint')}</Text>
        <Text style={styles.apiUrlText}>{apiUrl}</Text>

        <Text style={[styles.sectionLabel, styles.dangerSectionLabel]}>{t('settings.reset_section')}</Text>
        <Text style={styles.hint}>{t('settings.reset_hint')}</Text>
        <TouchableOpacity style={styles.resetButton} onPress={confirmReset}>
          <Text style={styles.resetButtonText}>{t('settings.reset_btn')}</Text>
        </TouchableOpacity>
      </View>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { padding: 20 },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  apiSectionLabel: { marginTop: 32 },
  dangerSectionLabel: { marginTop: 32 },
  hint: { color: '#888', fontSize: 13, marginBottom: 16, lineHeight: 19 },
  apiUrlText: { color: '#4ecdc4', fontSize: 15, fontWeight: '600' },
  loggedInText: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 16 },
  logoutButton: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ff6b6b' },
  logoutButtonText: { color: '#ff6b6b', fontSize: 15, fontWeight: '700' },
  accountRow: { flexDirection: 'row', gap: 12 },
  accountButton: { flex: 1, backgroundColor: '#4ecdc4', borderRadius: 14, padding: 16, alignItems: 'center' },
  accountButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  accountButtonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4ecdc4' },
  accountButtonTextSecondary: { color: '#4ecdc4' },
  resetButton: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ff6b6b' },
  resetButtonText: { color: '#ff6b6b', fontSize: 15, fontWeight: '700' },
});
