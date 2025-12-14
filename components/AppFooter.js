import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppFooter() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0, // only apply safe area padding on iOS
      },
    ]}>
      <Text style={styles.line1}>@2025 Vyshnavi Computers Services</Text>
      <Text style={styles.line2}>Developer S.Abhiram</Text>
    </View>
  );
}

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0D47A1',
      alignItems: 'center',
      justifyContent: 'flex-start', // ⬆️ moves text toward top within footer
      paddingTop: 10, // adds space above
      height: 70, // slightly taller for visual balance
      zIndex: 999,
    },
  line1: {
    color: '#E3F2FD',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 2, // reduces gap between lines
  },
  line2: {
    color: '#E3F2FD',
    opacity: 0.9,
    fontWeight: '700',
    fontSize: 11,
  },
});
