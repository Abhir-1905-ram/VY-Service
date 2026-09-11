import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../ui/Theme';

/** Centered spinner with an optional message. */
export default function LoadingState({ message = 'Loading...', style }) {
  return (
    <View style={[styles.wrap, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!!message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  text: { marginTop: spacing.md, color: colors.textMuted, fontWeight: '600' },
});
