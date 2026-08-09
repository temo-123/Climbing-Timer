import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types/navigation';
import { setLanguage, AppLanguage } from '../utils/i18n';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isKa = i18n.language === 'ka';

  const toggle = () => setLanguage(isKa ? 'en' : 'ka' as AppLanguage);

  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.gearText}>⚙️</Text>
      </TouchableOpacity>
      <Text style={styles.footerText}>{t('footer.powered')}</Text>
      <TouchableOpacity onPress={toggle} style={styles.langBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.langText}>{isKa ? t('footer.lang_en') : t('footer.lang_ka')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2d2d2d',
  },
  footerText: { color: '#aaa', fontSize: 13 },
  gearText: { fontSize: 16 },
  langBtn: { backgroundColor: '#3d3d3d', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  langText: { color: '#4ecdc4', fontSize: 13, fontWeight: '700' },
});
