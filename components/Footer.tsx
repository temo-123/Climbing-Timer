import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{t('footer.powered')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
  },
  footerText: { color: '#aaa', fontSize: 13 },
});
