import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Powered by climbing.ge</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
  },
  footerText: {
    color: '#aaa',
    fontSize: 14,
  },
});
