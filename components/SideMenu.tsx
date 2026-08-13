import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { AuthUser, getStoredUser, logout } from '../utils/auth';
import { setLanguage, AppLanguage } from '../utils/i18n';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.78, 320);
const ANIM_MS = 250;

export default function SideMenu({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const isKa = i18n.language === 'ka';
  const navigation = useNavigation<NavigationProp>();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      getStoredUser().then(setAuthUser);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: ANIM_MS, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -PANEL_WIDTH, duration: ANIM_MS, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const goTo = (screen: keyof RootStackParamList) => {
    onClose();
    setTimeout(() => navigation.navigate(screen as any), ANIM_MS + 50);
  };

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

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.panel, { width: PANEL_WIDTH, transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <Image source={require('../assets/adaptive-icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appTitle}>{t('home.app_title')}</Text>
          </View>

          <Text style={styles.sectionLabel}>{t('settings.account_section')}</Text>
          {authUser ? (
            <>
              <Text style={styles.loggedInText}>{t('settings.logged_in_as', { name: authUser.name })}</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>{t('settings.logout_btn')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.accountRow}>
              <TouchableOpacity style={styles.accountButton} onPress={() => goTo('Login')}>
                <Text style={styles.accountButtonText}>{t('settings.login_btn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.accountButton, styles.accountButtonSecondary]} onPress={() => goTo('Register')}>
                <Text style={[styles.accountButtonText, styles.accountButtonTextSecondary]}>{t('settings.register_btn')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => goTo('Settings')}>
            <Text style={styles.menuItemEmoji}>⚙️</Text>
            <Text style={styles.menuItemText}>{t('settings.title')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setLanguage(isKa ? 'en' : 'ka' as AppLanguage)}>
            <Text style={styles.menuItemEmoji}>🌐</Text>
            <Text style={styles.menuItemText}>{isKa ? t('footer.lang_en') : t('footer.lang_ka')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  backdropTouch: { flex: 1 },
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#1e1e22', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logo: { width: 44, height: 44 },
  appTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  loggedInText: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 14 },
  logoutButton: { borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ff6b6b' },
  logoutButtonText: { color: '#ff6b6b', fontSize: 14, fontWeight: '700' },
  accountRow: { flexDirection: 'row', gap: 10 },
  accountButton: { flex: 1, backgroundColor: '#4ecdc4', borderRadius: 12, padding: 14, alignItems: 'center' },
  accountButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  accountButtonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4ecdc4' },
  accountButtonTextSecondary: { color: '#4ecdc4' },
  divider: { height: 1, backgroundColor: '#2d2d2d', marginVertical: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  menuItemEmoji: { fontSize: 18 },
  menuItemText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
