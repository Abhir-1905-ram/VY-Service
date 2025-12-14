import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppFooter() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8, // minimum padding for content
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
      justifyContent: 'center', // center content vertically
      paddingTop: 10, // adds space above
      paddingBottom: 8, // minimum padding below content
      height: 70, // fixed height to ensure visibility
      zIndex: 999,
      marginBottom: 0,
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
