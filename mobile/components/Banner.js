import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tones, radii, spacing } from '../ui/Theme';
import Icon from './Icon';

const ICONS = {
  danger: 'alert-circle',
  success: 'checkmark-circle',
  warning: 'warning',
  info: 'information-circle',
  primary: 'information-circle',
  neutral: 'information-circle',
};

/** Inline message strip for errors, confirmations and hints. */
export default function Banner({ tone = 'info', message, icon, style }) {
  if (!message) return null;
  const t = tones[tone] || tones.info;
  return (
    <View style={[styles.wrap, { backgroundColor: t.soft }, style]}>
      <Icon name={icon || ICONS[tone] || ICONS.info} size={18} color={t.main} />
      <Text style={[styles.text, { color: t.main }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  text: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
});
