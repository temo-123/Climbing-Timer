import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setLanguage, AppLanguage } from '../utils/i18n';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isKa = i18n.language === 'ka';

  const toggle = () => setLanguage(isKa ? 'en' : 'ka' as AppLanguage);

  return (
    <View style={styles.footer}>
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
  langBtn: { backgroundColor: '#3d3d3d', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  langText: { color: '#4ecdc4', fontSize: 13, fontWeight: '700' },
});
