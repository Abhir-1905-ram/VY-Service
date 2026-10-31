import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, shadows, tones, spacing } from '../ui/Theme';
import Icon from './Icon';

/** Compact KPI tile for dashboards. */
export default function StatCard({ label, value, icon, tone = 'primary', style, compact = false }) {
  const t = tones[tone] || tones.primary;
  return (
    <View style={[styles.card, compact && styles.compact, style]}>
      <View style={[styles.iconWrap, { backgroundColor: t.soft }, compact && styles.iconWrapCompact]}>
        <Icon name={icon} size={compact ? 16 : 20} color={t.main} />
      </View>
      <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  compact: { padding: spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconWrapCompact: { width: 32, height: 32, borderRadius: 10, marginBottom: spacing.sm },
  value: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  valueCompact: { fontSize: 20 },
  label: { marginTop: 2, color: colors.textMuted, fontWeight: '600', fontSize: 12 },
});
