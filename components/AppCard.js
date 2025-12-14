import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radii, shadows } from '../ui/Theme';

export default function AppCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.card,
  },
});


