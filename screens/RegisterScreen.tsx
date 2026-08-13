import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { register } from '../utils/auth';
import { syncNow } from '../utils/sync';
import RecaptchaWebView, { RecaptchaWebViewHandle } from '../components/RecaptchaWebView';
import { globalStyles } from '../styles/globalStyles';
import MenuButton from '../components/MenuButton';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const recaptchaRef = useRef<RecaptchaWebViewHandle>(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const errorMessageFor = (err: any): string => {
    const status = err?.response?.status;
    const message = err?.response?.data?.message;
    if (message === 'reCAPTCHA verification failed. Please try again.') return t('auth.error_captcha');
    if (status === 422) return t('auth.error_validation');
    return t('auth.error_network');
  };

  const handleRegister = async () => {
    if (!name.trim() || !surname.trim() || !country.trim() || !city.trim() || !phone.trim() || !email.trim() || !password) {
      Alert.alert(t('auth.error_title'), t('auth.error_missing_fields'));
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert(t('auth.error_title'), t('auth.error_password_mismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const recaptchaToken = await recaptchaRef.current?.getToken();
      await register({
        name: name.trim(),
        surname: surname.trim(),
        country: country.trim(),
        city: city.trim(),
        phone_number: phone.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirm,
      }, i18n.language === 'ka' ? 'ka' : 'en', recaptchaToken);
      syncNow();
      Alert.alert(t('auth.register_title'), t('auth.registered_msg'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
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
        <Text style={styles.headerTitle}>{t('auth.register_title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={globalStyles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.row2}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={globalStyles.label}>{t('auth.name_label')}</Text>
              <TextInput style={globalStyles.input} value={name} onChangeText={setName} returnKeyType="next" />
            </View>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={globalStyles.label}>{t('auth.surname_label')}</Text>
              <TextInput style={globalStyles.input} value={surname} onChangeText={setSurname} returnKeyType="next" />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={globalStyles.label}>{t('auth.country_label')}</Text>
              <TextInput style={globalStyles.input} value={country} onChangeText={setCountry} returnKeyType="next" />
            </View>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={globalStyles.label}>{t('auth.city_label')}</Text>
              <TextInput style={globalStyles.input} value={city} onChangeText={setCity} returnKeyType="next" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>{t('auth.phone_label')}</Text>
            <TextInput style={globalStyles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" returnKeyType="next" />
          </View>

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
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={globalStyles.label}>{t('auth.password_confirm_label')}</Text>
            <TextInput
              style={globalStyles.input}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder={t('auth.password_placeholder')}
              placeholderTextColor="#666"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('auth.register_btn')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')} disabled={isLoading}>
            <Text style={styles.linkText}>{t('auth.have_account')} <Text style={styles.linkAccent}>{t('auth.login_link')}</Text></Text>
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
  row2: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  submitButton: { backgroundColor: '#4ecdc4', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#888', fontSize: 14 },
  linkAccent: { color: '#4ecdc4', fontWeight: '700' },
});
