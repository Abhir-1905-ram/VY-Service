import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, radii, shadows, spacing } from '../ui/Theme';

/**
 * Surface container. `variant`: elevated (default) | outline | tinted | dark.
 * Pass `onPress` to make the whole card tappable.
 */
export default function AppCard({ children, style, onPress, variant = 'elevated', padded = true }) {
  const variantStyle =
    variant === 'outline'
      ? styles.outline
      : variant === 'tinted'
        ? styles.tinted
        : variant === 'dark'
          ? styles.dark
          : styles.elevated;
  const content = <View style={[styles.card, variantStyle, padded && styles.padded, style]}>{children}</View>;
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg },
  padded: { padding: spacing.lg },
  elevated: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'android' ? { elevation: 0 } : shadows.card),
  },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tinted: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  dark: { backgroundColor: colors.primaryDeep },
});
