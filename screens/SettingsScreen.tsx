import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { getApiBaseUrl, setApiBaseUrl } from '../utils/api';
import { globalStyles } from '../styles/globalStyles';
import Footer from '../components/Footer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => { getApiBaseUrl().then(setApiUrl); }, []);

  const save = async () => {
    if (!apiUrl.trim()) { Alert.alert(t('common.error'), t('settings.error_empty')); return; }
    await setApiBaseUrl(apiUrl);
    Alert.alert(t('settings.saved_title'), t('settings.saved_msg'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={globalStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <Text style={styles.sectionLabel}>{t('settings.api_section')}</Text>
          <Text style={styles.hint}>{t('settings.api_hint')}</Text>
          <TextInput
            style={globalStyles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="https://climbing.ge/api"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity style={styles.saveButton} onPress={save}>
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { padding: 20 },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  hint: { color: '#888', fontSize: 13, marginBottom: 16, lineHeight: 19 },
  saveButton: { backgroundColor: '#4ecdc4', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
