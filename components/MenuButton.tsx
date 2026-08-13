import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SideMenu from './SideMenu';

interface Props {
  // 'right' (default) mirrors backText's reserved width, for headers that
  // already have a back button on the left. 'left' is the standalone
  // hamburger position — HomeScreen, which has no back button to balance against.
  align?: 'left' | 'right';
}

// Self-contained: owns its own open/close state so any screen can drop this
// into its header without wiring up local state for the menu.
export default function MenuButton({ align = 'right' }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, align === 'right' ? styles.containerRight : styles.containerLeft]}>
      <TouchableOpacity onPress={() => setVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.icon}>☰</Text>
      </TouchableOpacity>
      <SideMenu visible={visible} onClose={() => setVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minWidth: 64 },
  containerRight: { alignItems: 'flex-end' },
  containerLeft: { alignItems: 'flex-start' },
  icon: { fontSize: 22, color: '#fff' },
});
