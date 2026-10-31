import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../ui/Theme';

/** Slim persistent footer with copyright and developer credit. */
export default function AppFooter() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <Text style={styles.line1}>© 2025 Vyshnavi Computers Services</Text>
      <Text style={styles.line2}>Developer S.Abhiram</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  line1: { color: colors.textOnDark, fontWeight: '700', fontSize: 11, letterSpacing: 0.3 },
  line2: { color: colors.textOnDarkMuted, fontWeight: '600', fontSize: 10, marginTop: 1 },
});
