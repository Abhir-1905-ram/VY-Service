import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, tones } from '../ui/Theme';
import Icon from './Icon';

/** Friendly placeholder for empty lists and blocked states. */
export default function EmptyState({ icon = 'file-tray-outline', title, subtitle, tone = 'primary', action, style }) {
  const t = tones[tone] || tones.primary;
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconWrap, { backgroundColor: t.soft }]}>
        <Icon name={icon} size={30} color={t.main} />
      </View>
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  iconWrap: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { marginTop: 6, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: spacing.lg, alignSelf: 'stretch', alignItems: 'center' },
});
