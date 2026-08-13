import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { login } from '../utils/auth';
import { syncNow } from '../utils/sync';
import RecaptchaWebView, { RecaptchaWebViewHandle } from '../components/RecaptchaWebView';
import { globalStyles } from '../styles/globalStyles';
import MenuButton from '../components/MenuButton';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const recaptchaRef = useRef<RecaptchaWebViewHandle>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const errorMessageFor = (err: any): string => {
    const status = err?.response?.status;
    const message = err?.response?.data?.message;
    if (status === 403) return t('auth.error_banned');
    if (message === 'reCAPTCHA verification failed. Please try again.') return t('auth.error_captcha');
    if (status === 422) return t('auth.error_invalid_credentials');
    return t('auth.error_network');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) { Alert.alert(t('auth.error_title'), t('auth.error_missing_fields')); return; }
    setIsLoading(true);
    try {
      const recaptchaToken = await recaptchaRef.current?.getToken();
      await login(email.trim(), password, recaptchaToken);
      syncNow();
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('auth.error_title'), errorMessageFor(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <RecaptchaWebView ref={recaptchaRef} />
      <View style={globalStyles.header}>
        <MenuButton align="left" />
        <Text style={styles.headerTitle}>{t('auth.login_title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>{t('auth.email_label')}</Text>
            <TextInput
              style={globalStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.email_placeholder')}
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>{t('auth.password_label')}</Text>
            <TextInput
              style={globalStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.password_placeholder')}
              placeholderTextColor="#666"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('auth.login_btn')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Register')} disabled={isLoading}>
            <Text style={styles.linkText}>{t('auth.no_account')} <Text style={styles.linkAccent}>{t('auth.create_account_link')}</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  scrollContainer: { padding: 20, paddingBottom: 20, flexGrow: 1 },
  inputGroup: { marginBottom: 16 },
  submitButton: { backgroundColor: '#4ecdc4', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#888', fontSize: 14 },
  linkAccent: { color: '#4ecdc4', fontWeight: '700' },
});
